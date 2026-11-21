import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { roleService } from '../services/roleService';
import type { PermissionData, RoleData } from '../services/roleService';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { RoleCard } from '../components/roles/RoleCard';
import { RoleDetailPanel } from '../components/roles/RoleDetailPanel';
import { PermissionPicker } from '../components/roles/PermissionPicker';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Key,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  buildRoleCode,
  formatModuleName,
  formatPermissionName,
  formatRoleName,
  groupPermissionsByModule,
  isProtectedRole,
  normalizeText,
  pluralize,
} from '../utils/roleFormatters';
import { getApiErrorMessage, getApiFieldErrors } from '../utils/apiErrors';

const PAGE_SIZE = 10;

type TabKey = 'roles' | 'permisos';
type RoleSort = 'name' | 'permissions' | 'users';

const ROLE_FORM_STEPS = [
  { title: 'Identidad', description: 'Nombre y descripción' },
  { title: 'Permisos', description: 'Selección por módulo' },
  { title: 'Confirmación', description: 'Resumen del rol' },
];

const errMsg = (err: unknown, fallback: string): string => getApiErrorMessage(err, fallback);

/** Campo del DTO -> paso del asistente, para saltar al primer error del servidor. */
const ROLE_FIELD_STEPS: Record<string, number> = { name: 0, description: 0 };

/**
 * Módulo de roles y permisos.
 * <p>
 * Presenta el catálogo en dos pestañas —roles y permisos— con búsqueda,
 * ordenamiento, detalle lateral y formularios guiados. Toda la interfaz está en
 * español: los códigos técnicos (`ROLE_*`, `MODULO_ACCION`) solo aparecen como
 * referencia secundaria.
 */
export const RolesPage: React.FC = () => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const { hasPermission } = useAuth();

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('roles');

  const [roleQuery, setRoleQuery] = useState('');
  const [roleSort, setRoleSort] = useState<RoleSort>('name');
  const [detailRole, setDetailRole] = useState<RoleData | null>(null);

  const [permQuery, setPermQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleStep, setRoleStep] = useState(0);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedPermIds, setSelectedPermIds] = useState<Set<number>>(new Set());
  const roleFormRef = useRef<HTMLFormElement>(null);
  const roleStepRef = useRef<HTMLDivElement>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [permModalOpen, setPermModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionData | null>(null);
  const [permForm, setPermForm] = useState({ name: '', module: '', description: '' });
  const [permFormError, setPermFormError] = useState<string | null>(null);
  const [permSubmitting, setPermSubmitting] = useState(false);

  const canCreate = hasPermission('ROL_CREATE');
  const canEdit = hasPermission('ROL_EDIT');
  const canDelete = hasPermission('ROL_DELETE');

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes, permRes] = await Promise.all([
        roleService.getAllRoles(),
        roleService.getAllPermissions(),
      ]);
      if (rolesRes.success) setRoles(rolesRes.data);
      if (permRes.success) setPermissions(permRes.data);
    } catch (err: unknown) {
      toast.error('No se pudieron cargar los roles y permisos. Revisa tu conexión e inténtalo de nuevo.');
      console.error('Error al cargar roles y permisos', err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const reload = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!roleModalOpen && !permModalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setRoleModalOpen(false);
      setPermModalOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [roleModalOpen, permModalOpen]);

  const modules = useMemo(() => groupPermissionsByModule(permissions), [permissions]);

  const totalAssignments = useMemo(
    () => roles.reduce((total, role) => total + (role.usuarios ?? 0), 0),
    [roles]
  );

  const permissionUsage = useMemo(() => {
    const usage = new Map<number, number>();
    roles.forEach((role) => {
      (role.permissions ?? []).forEach((permission) => {
        usage.set(permission.id, (usage.get(permission.id) ?? 0) + 1);
      });
    });
    return usage;
  }, [roles]);

  const filteredRoles = useMemo(() => {
    const term = normalizeText(roleQuery);
    const matches = roles.filter((role) => {
      if (!term) return true;
      return [formatRoleName(role.name), role.name, role.description]
        .some((value) => normalizeText(value ?? '').includes(term));
    });

    return [...matches].sort((a, b) => {
      const byName = formatRoleName(a.name).localeCompare(formatRoleName(b.name), 'es');
      if (roleSort === 'permissions') {
        return (b.permissions?.length ?? 0) - (a.permissions?.length ?? 0) || byName;
      }
      if (roleSort === 'users') {
        return (b.usuarios ?? 0) - (a.usuarios ?? 0) || byName;
      }
      return byName;
    });
  }, [roles, roleQuery, roleSort]);

  const filteredPermissions = useMemo(() => {
    const term = normalizeText(permQuery);
    return permissions.filter((permission) => {
      if (moduleFilter !== 'ALL' && permission.module !== moduleFilter) return false;
      if (!term) return true;
      return [permission.name, formatPermissionName(permission.name), permission.description, formatModuleName(permission.module)]
        .some((value) => normalizeText(value ?? '').includes(term));
    });
  }, [permissions, moduleFilter, permQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPermissions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagePermissions = filteredPermissions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* ------------------------------ Roles ------------------------------ */
  const focusRoleStep = () => {
    window.setTimeout(() => {
      roleStepRef.current?.focus({ preventScroll: true });
      roleStepRef.current?.scrollTo({ top: 0 });
    }, 0);
  };

  const validateRoleStep = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (step !== 0) return errors;

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) errors.name = 'El nombre del rol es obligatorio.';
    else if (name.replace(/^ROLE_/i, '').length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.';
    else if (name.length > 50) errors.name = 'El nombre no puede exceder 50 caracteres.';
    else if (!/[\p{L}\p{N}]/u.test(name)) errors.name = 'El nombre debe incluir al menos una letra o número.';

    if (!description) errors.description = 'La descripción del rol es obligatoria.';
    else if (description.length > 255) errors.description = 'La descripción no puede exceder 255 caracteres.';

    return errors;
  };

  const goRoleStep = (target: number) => {
    const next = Math.max(0, Math.min(ROLE_FORM_STEPS.length - 1, target));
    if (next > roleStep) {
      for (let step = roleStep; step < next; step += 1) {
        const errors = validateRoleStep(step);
        if (Object.keys(errors).length > 0) {
          setRoleStep(step);
          setFormFieldErrors(errors);
          setFormError(Object.values(errors)[0]);
          focusRoleStep();
          return;
        }
      }
    }
    setFormFieldErrors({});
    setFormError(null);
    setRoleStep(next);
    focusRoleStep();
  };

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: '', description: '' });
    setSelectedPermIds(new Set());
    setFormError(null);
    setFormFieldErrors({});
    setRoleStep(0);
    setRoleModalOpen(true);
  };

  const openEdit = (role: RoleData) => {
    setDetailRole(null);
    setEditingRole(role);
    setForm({ name: role.name.replace(/^ROLE_/, ''), description: role.description });
    setSelectedPermIds(new Set((role.permissions ?? []).map((permission) => permission.id)));
    setFormError(null);
    setFormFieldErrors({});
    setRoleStep(0);
    setRoleModalOpen(true);
  };

  const openDuplicate = (role: RoleData) => {
    const base = role.name.replace(/^ROLE_/, '');
    setEditingRole(null);
    setForm({ name: `${base}_COPIA`, description: `Copia de ${formatRoleName(role.name)}` });
    setSelectedPermIds(new Set((role.permissions ?? []).map((permission) => permission.id)));
    setFormError(null);
    setFormFieldErrors({});
    setRoleStep(0);
    setRoleModalOpen(true);
    toast.info('Se precargó una copia. Ajusta el nombre antes de guardar.');
  };

  const togglePermission = (id: number) => {
    setSelectedPermIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleModule = (module: string) => {
    const ids = permissions.filter((permission) => permission.module === module).map((permission) => permission.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedPermIds.has(id));
    setSelectedPermIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (roleStep < ROLE_FORM_STEPS.length - 1) {
      goRoleStep(roleStep + 1);
      return;
    }
    for (let step = 0; step < ROLE_FORM_STEPS.length; step += 1) {
      const errors = validateRoleStep(step);
      if (Object.keys(errors).length > 0) {
        setRoleStep(step);
        setFormFieldErrors(errors);
        setFormError(Object.values(errors)[0]);
        focusRoleStep();
        return;
      }
    }
    setSubmitting(true);
    setFormError(null);
    setFormFieldErrors({});
    const payload = {
      name: form.name,
      description: form.description,
      permissionIds: Array.from(selectedPermIds),
    };

    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, payload);
        toast.success(`Se actualizó el rol «${formatRoleName(form.name)}».`);
      } else {
        await roleService.createRole(payload);
        toast.success(`Se creó el rol «${formatRoleName(form.name)}».`);
      }
      setRoleModalOpen(false);
      await fetchData();
    } catch (err) {
      const apiErrors = getApiFieldErrors(err);
      setFormFieldErrors(apiErrors);
      const apiStep = Object.keys(apiErrors).reduce<number | null>((min, field) => {
        const step = ROLE_FIELD_STEPS[field];
        if (step == null) return min;
        return min == null ? step : Math.min(min, step);
      }, null);
      if (apiStep != null) {
        setRoleStep(apiStep);
        focusRoleStep();
      }
      setFormError(errMsg(err, 'No se pudo guardar el rol. Verifica los datos e inténtalo otra vez.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role: RoleData) => {
    if (isProtectedRole(role.name)) {
      toast.warning('El rol base del sistema no se puede eliminar.');
      return;
    }
    if ((role.usuarios ?? 0) > 0) {
      toast.warning(
        `No puedes eliminar «${formatRoleName(role.name)}»: tiene ${pluralize(role.usuarios, 'usuario asignado', 'usuarios asignados')}.`
      );
      return;
    }

    const ok = await confirm({
      title: 'Eliminar rol',
      message: `¿Eliminar el rol «${formatRoleName(role.name)}»? Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await roleService.deleteRole(role.id);
      toast.success(`Se eliminó el rol «${formatRoleName(role.name)}».`);
      setDetailRole(null);
      await fetchData();
    } catch (err) {
      toast.error(errMsg(err, 'No se pudo eliminar el rol.'));
    }
  };

  /* --------------------------- Permisos --------------------------- */
  const openCreatePerm = () => {
    setEditingPermission(null);
    setPermForm({ name: '', module: '', description: '' });
    setPermFormError(null);
    setPermModalOpen(true);
  };

  const openEditPerm = (permission: PermissionData) => {
    setEditingPermission(permission);
    setPermForm({
      name: permission.name,
      module: permission.module,
      description: permission.description,
    });
    setPermFormError(null);
    setPermModalOpen(true);
  };

  const handleSavePerm = async (event: React.FormEvent) => {
    event.preventDefault();
    setPermSubmitting(true);
    setPermFormError(null);
    try {
      if (editingPermission) {
        await roleService.updatePermission(editingPermission.id, permForm);
        toast.success(`Se actualizó el permiso «${formatPermissionName(permForm.name)}».`);
      } else {
        await roleService.createPermission(permForm);
        toast.success(`Se creó el permiso «${formatPermissionName(permForm.name)}».`);
      }
      setPermModalOpen(false);
      await fetchData();
    } catch (err) {
      setPermFormError(errMsg(err, 'No se pudo guardar el permiso. Verifica los datos e inténtalo otra vez.'));
    } finally {
      setPermSubmitting(false);
    }
  };

  const handleDeletePerm = async (permission: PermissionData) => {
    const ok = await confirm({
      title: 'Eliminar permiso',
      message: `¿Eliminar el permiso «${formatPermissionName(permission.name)}»? Se quitará de todos los roles que lo tengan asignado.`,
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await roleService.deletePermission(permission.id);
      toast.success(`Se eliminó el permiso «${formatPermissionName(permission.name)}».`);
      await fetchData();
    } catch (err) {
      toast.error(errMsg(err, 'No se pudo eliminar el permiso.'));
    }
  };

  const closeDetail = useCallback(() => setDetailRole(null), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <PageHeader
        title="Roles y permisos"
        subtitle="Define qué puede hacer cada tipo de usuario y revisa los accesos vigentes."
        icon={<ShieldCheck size={26} />}
        accent="var(--accent-violet)"
        breadcrumbs={[{ label: 'Administración y seguridad' }, { label: 'Roles y permisos' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void reload()} leftIcon={<RefreshCw size={16} />} isLoading={loading}>
              Actualizar
            </Button>
            {canCreate && (
              <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
                Nuevo rol
              </Button>
            )}
          </>
        }
        stats={[
          { label: 'Roles', value: roles.length },
          { label: 'Permisos', value: permissions.length },
          { label: 'Módulos', value: modules.length },
          { label: 'Asignaciones', value: totalAssignments },
        ]}
      />

      <div className="roles-tabs" role="tablist" aria-label="Secciones del módulo de roles">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'roles'}
          className={`roles-tab${activeTab === 'roles' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <ShieldCheck size={16} aria-hidden="true" />
          Roles
          <span className="roles-tab__count">{roles.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'permisos'}
          className={`roles-tab${activeTab === 'permisos' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('permisos')}
        >
          <Key size={16} aria-hidden="true" />
          Permisos
          <span className="roles-tab__count">{permissions.length}</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Cargando roles y permisos desde la base de datos…" />
      ) : activeTab === 'roles' ? (
        <section className="roles-section" aria-label="Catálogo de roles">
          <div className="roles-toolbar">
            <div className="search-box">
              <Search size={16} aria-hidden="true" />
              <input
                value={roleQuery}
                onChange={(event) => setRoleQuery(event.target.value)}
                placeholder="Buscar por nombre, código o descripción"
                aria-label="Buscar roles"
              />
              {roleQuery && (
                <button type="button" className="roles-search-clear" onClick={() => setRoleQuery('')} aria-label="Limpiar búsqueda de roles">
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
            <select
              className="field-select"
              value={roleSort}
              onChange={(event) => setRoleSort(event.target.value as RoleSort)}
              aria-label="Ordenar roles"
            >
              <option value="name">Ordenar por nombre</option>
              <option value="permissions">Más permisos primero</option>
              <option value="users">Más usuarios primero</option>
            </select>
            <span className="roles-toolbar__count">
              {filteredRoles.length} de {pluralize(roles.length, 'rol', 'roles')}
            </span>
          </div>

          {filteredRoles.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck size={24} />}
              title={roleQuery ? 'No encontramos roles con ese término' : 'Todavía no hay roles registrados'}
              description={
                roleQuery
                  ? `Ningún rol coincide con «${roleQuery}». Prueba con el nombre, el código o una palabra de la descripción.`
                  : 'Crea el primer rol para empezar a asignar permisos.'
              }
              action={
                roleQuery ? (
                  <Button variant="secondary" size="sm" onClick={() => setRoleQuery('')}>
                    Limpiar búsqueda
                  </Button>
                ) : canCreate ? (
                  <Button size="sm" leftIcon={<Plus size={15} />} onClick={openCreate}>
                    Crear el primer rol
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="stagger roles-grid">
              {filteredRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onView={setDetailRole}
                  onEdit={openEdit}
                  onDuplicate={openDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="roles-section" aria-label="Catálogo de permisos">
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Key size={19} color="var(--accent-cyan)" aria-hidden="true" />
                <span>Catálogo de permisos</span>
              </div>
            }
            subtitle="Cada permiso habilita una acción concreta y puede compartirse entre varios roles."
            extra={<Badge variant="info" size="sm">{filteredPermissions.length} visibles</Badge>}
          >
            <div className="roles-toolbar roles-toolbar--inner">
              <div className="search-box">
                <Search size={16} aria-hidden="true" />
                <input
                  value={permQuery}
                  onChange={(event) => {
                    setPermQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar permiso, módulo o descripción"
                  aria-label="Buscar permisos"
                />
                {permQuery && (
                  <button type="button" className="roles-search-clear" onClick={() => { setPermQuery(''); setPage(1); }} aria-label="Limpiar búsqueda de permisos">
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <select
                className="field-select"
                value={moduleFilter}
                onChange={(event) => {
                  setModuleFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filtrar por módulo"
              >
                <option value="ALL">Todos los módulos ({permissions.length})</option>
                {modules.map((module) => (
                  <option key={module.module} value={module.module}>
                    {module.label} ({module.total})
                  </option>
                ))}
              </select>
              {canCreate && (
                <Button size="sm" leftIcon={<Plus size={15} />} onClick={openCreatePerm}>
                  Nuevo permiso
                </Button>
              )}
            </div>

            <div className="data-table-wrap">
              <table className="data-table roles-permissions-table">
                <caption className="sr-only">Permisos del sistema con su módulo, descripción y cantidad de roles que los usan</caption>
                <thead>
                  <tr>
                    <th scope="col">Permiso</th>
                    <th scope="col">Módulo</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Roles</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagePermissions.map((permission) => {
                    const usage = permissionUsage.get(permission.id) ?? 0;
                    return (
                      <tr key={permission.id}>
                        <td>
                          <div className="roles-permission">
                            <span className="cell-strong">{formatPermissionName(permission.name)}</span>
                            <code className="roles-permission__code">{permission.name}</code>
                          </div>
                        </td>
                        <td>
                          <Badge variant="info" size="sm">{formatModuleName(permission.module)}</Badge>
                        </td>
                        <td>{permission.description}</td>
                        <td>
                          <span className="roles-usage" title={`${usage} roles usan este permiso`}>
                            <Users size={14} aria-hidden="true" />
                            {usage}
                          </span>
                        </td>
                        <td>
                          <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                            {canEdit && (
                              <button
                                type="button"
                                className="action-btn primary"
                                title="Editar permiso"
                                aria-label={`Editar ${formatPermissionName(permission.name)}`}
                                onClick={() => openEditPerm(permission)}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                className="action-btn danger"
                                title="Eliminar permiso"
                                aria-label={`Eliminar ${formatPermissionName(permission.name)}`}
                                onClick={() => handleDeletePerm(permission)}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pagePermissions.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState
                          icon={<Layers size={22} />}
                          title="Sin permisos para mostrar"
                          description={
                            permQuery || moduleFilter !== 'ALL'
                              ? 'Ajusta la búsqueda o el módulo seleccionado para ver otros permisos.'
                              : 'Aún no hay permisos registrados en el sistema.'
                          }
                          action={
                            (permQuery || moduleFilter !== 'ALL') && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setPermQuery('');
                                  setModuleFilter('ALL');
                                  setPage(1);
                                }}
                              >
                                Restablecer filtros
                              </Button>
                            )
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={safePage}
              pageSize={PAGE_SIZE}
              total={filteredPermissions.length}
              onChange={setPage}
              itemLabel="permisos"
            />
          </Card>
        </section>
      )}

      {detailRole && (
        <RoleDetailPanel
          role={detailRole}
          canEdit={canEdit}
          onClose={closeDetail}
          onEdit={openEdit}
        />
      )}

      {roleModalOpen && (
        <Modal
          titleId="role-modal-title"
          title={editingRole ? 'Editar rol' : 'Nuevo rol'}
          subtitle={
            editingRole
              ? 'Ajusta el nombre, la descripción o los permisos de este rol.'
              : 'Crea un rol y elige los permisos que tendrá.'
          }
          icon={<ShieldCheck size={21} />}
          size="lg"
          onClose={() => setRoleModalOpen(false)}
        >
          <form
            ref={roleFormRef}
            className="modal-step-form"
            onSubmit={handleSave}
          >
            {formError && (
              <div className="roles-form__error" role="alert">
                {formError}
              </div>
            )}
            <div className="institution-stepper modal-form-stepper" aria-label="Pasos del formulario de rol">
              {ROLE_FORM_STEPS.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  className={`institution-step${roleStep === index ? ' is-active' : ''}${index < roleStep ? ' is-complete' : ''}`}
                  aria-current={roleStep === index ? 'step' : undefined}
                  onClick={() => goRoleStep(index)}
                >
                  <span className="institution-step__number">{index + 1}</span>
                  <span className="institution-step__copy">
                    <strong>{step.title}</strong>
                    <small>{step.description}</small>
                  </span>
                </button>
              ))}
            </div>

            <div
              key={roleStep}
              ref={roleStepRef}
              className="modal-step-panel"
              tabIndex={-1}
              aria-label={`${ROLE_FORM_STEPS[roleStep].title} del formulario de rol`}
            >
              {roleStep === 0 && (
                <>
                  <h4 className="modal-step-title"><ShieldCheck size={15} /> Identidad del rol</h4>
                  <div className="modal-field-grid">
                    <div>
                      <label htmlFor="role-name" className="field-label">
                        <ShieldCheck size={13} aria-hidden="true" /> Nombre del rol
                      </label>
                      <input
                        id="role-name"
                        className="roles-input"
                        required
                        data-autofocus
                        minLength={3}
                        maxLength={50}
                        aria-invalid={Boolean(formFieldErrors.name)}
                        value={form.name}
                        onChange={(event) => {
                          setForm((current) => ({ ...current, name: event.target.value }));
                          setFormFieldErrors((current) => {
                            if (!current.name) return current;
                            const next = { ...current };
                            delete next.name;
                            return next;
                          });
                        }}
                        placeholder="Ej. Supervisor de sede"
                      />
                      {formFieldErrors.name && <span className="field-error" role="alert">{formFieldErrors.name}</span>}
                      <span className="roles-form__hint">
                        Código interno: <code>{buildRoleCode(form.name)}</code>
                      </span>
                    </div>
                    <div>
                      <label htmlFor="role-description" className="field-label">
                        <FileText size={13} aria-hidden="true" /> Descripción
                      </label>
                      <input
                        id="role-description"
                        className="roles-input"
                        required
                        maxLength={255}
                        aria-invalid={Boolean(formFieldErrors.description)}
                        value={form.description}
                        onChange={(event) => {
                          setForm((current) => ({ ...current, description: event.target.value }));
                          setFormFieldErrors((current) => {
                            if (!current.description) return current;
                            const next = { ...current };
                            delete next.description;
                            return next;
                          });
                        }}
                        placeholder="Ej. Gestiona sedes y consulta reportes institucionales"
                      />
                      {formFieldErrors.description && <span className="field-error" role="alert">{formFieldErrors.description}</span>}
                      <span className="roles-form__hint">Se muestra en la tarjeta del rol.</span>
                    </div>
                  </div>
                  <p className="field-hint">El nombre y la descripción se usan en el catálogo de roles y en la asignación a cuentas.</p>
                </>
              )}

              {roleStep === 1 && (
                <>
                  <div className="roles-form__section">
                    <div className="roles-form__section-head">
                      <span className="field-label">
                        <ShieldCheck size={13} aria-hidden="true" /> Permisos del rol
                      </span>
                      <span className="roles-form__counter">{selectedPermIds.size} seleccionados</span>
                    </div>
                    <PermissionPicker
                      permissions={permissions}
                      selectedIds={selectedPermIds}
                      onToggle={togglePermission}
                      onToggleModule={toggleModule}
                      onSelectAll={() => setSelectedPermIds(new Set(permissions.map((permission) => permission.id)))}
                      onClear={() => setSelectedPermIds(new Set())}
                    />
                  </div>
                  <p className="field-hint">
                    Busca por nombre o código, o avanza módulo por módulo. Puedes continuar sin permisos
                    y asignarlos después.
                  </p>
                </>
              )}

              {roleStep === 2 && (
                <>
                  <div className="form-review" aria-label="Resumen del rol">
                    <div><span>Nombre</span><strong>{form.name.trim() ? formatRoleName(`ROLE_${form.name.trim()}`) : '—'}</strong></div>
                    <div><span>Código interno</span><strong>{buildRoleCode(form.name) || '—'}</strong></div>
                    <div><span>Descripción</span><strong>{form.description.trim() || '—'}</strong></div>
                    <div><span>Permisos</span><strong>{selectedPermIds.size} de {permissions.length}</strong></div>
                  </div>
                  <div className="form-review" aria-label="Permisos seleccionados por módulo">
                    {Array.from(new Set(permissions.filter((permission) => selectedPermIds.has(permission.id)).map((permission) => permission.module)))
                      .sort((a, b) => formatModuleName(a).localeCompare(formatModuleName(b), 'es'))
                      .map((module) => {
                        const selectedInModule = permissions.filter((permission) => selectedPermIds.has(permission.id) && permission.module === module);
                        return (
                          <div key={module}>
                            <span>{formatModuleName(module)}</span>
                            <strong>
                              {selectedInModule.length} {selectedInModule.length === 1 ? 'permiso' : 'permisos'}
                            </strong>
                          </div>
                        );
                      })}
                    {selectedPermIds.size === 0 && (
                      <div><span>Sin permisos</span><strong>Sin acceso adicional</strong></div>
                    )}
                  </div>
                  <p className="field-hint">
                    {editingRole
                      ? 'Revisa los cambios antes de guardar. El rol aplicará a las cuentas ya asignadas.'
                      : 'Revisa la información. Al crear el rol, podrás asignarlo a las cuentas del sistema.'}
                  </p>
                </>
              )}
            </div>

            <div className="modal-step-footer">
              <span className="modal-step-indicator">Paso {roleStep + 1} de {ROLE_FORM_STEPS.length}</span>
              <div className="modal-step-actions">
                <Button type="button" variant="secondary" onClick={() => setRoleModalOpen(false)}>Cancelar</Button>
                {roleStep > 0 && (
                  <Button type="button" variant="secondary" onClick={() => goRoleStep(roleStep - 1)}>Anterior</Button>
                )}
                {roleStep < ROLE_FORM_STEPS.length - 1 ? (
                  <Button type="button" onClick={() => goRoleStep(roleStep + 1)}>Siguiente</Button>
                ) : (
                  <Button type="submit" isLoading={submitting} leftIcon={<ShieldCheck size={16} />}>
                    {editingRole ? 'Guardar cambios' : 'Crear rol'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {permModalOpen && (
        <Modal
          titleId="permission-modal-title"
          title={editingPermission ? 'Editar permiso' : 'Nuevo permiso'}
          subtitle="Los permisos se agrupan por módulo y se asignan desde el rol."
          icon={<Key size={21} color="var(--accent-cyan)" />}
          onClose={() => setPermModalOpen(false)}
          size="md"
        >
          <form className="roles-form" onSubmit={handleSavePerm}>
            {permFormError && (
              <div className="roles-form__error" role="alert">
                {permFormError}
              </div>
            )}

            <div className="roles-form__row">
              <div>
                <label htmlFor="permission-name" className="field-label">Código del permiso</label>
                <input
                  id="permission-name"
                  className="roles-input"
                  required
                  autoFocus
                  value={permForm.name}
                  onChange={(event) => setPermForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="CURSO_CREATE"
                />
                <span className="roles-form__hint">
                  Formato MÓDULO_ACCIÓN. Se mostrará como «{formatPermissionName(permForm.name)}».
                </span>
              </div>
              <div>
                <label htmlFor="permission-module" className="field-label">Módulo</label>
                <input
                  id="permission-module"
                  className="roles-input"
                  required
                  value={permForm.module}
                  onChange={(event) => setPermForm((current) => ({ ...current, module: event.target.value }))}
                  placeholder="CURSO"
                />
                <span className="roles-form__hint">Agrupa el permiso en el catálogo.</span>
              </div>
            </div>

            <div>
              <label htmlFor="permission-description" className="field-label">Descripción</label>
              <input
                id="permission-description"
                className="roles-input"
                required
                maxLength={160}
                value={permForm.description}
                onChange={(event) => setPermForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Permite registrar nuevos cursos"
              />
              <span className="roles-form__hint">Explica en una frase qué habilita este permiso.</span>
            </div>

            <footer className="roles-form__footer">
              <Button type="button" variant="secondary" onClick={() => setPermModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={permSubmitting} leftIcon={<Key size={16} />}>
                {editingPermission ? 'Guardar cambios' : 'Crear permiso'}
              </Button>
            </footer>
          </form>
        </Modal>
      )}
    </div>
  );
};
