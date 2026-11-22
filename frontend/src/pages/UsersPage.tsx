import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { reportService } from '../services/reportService';
import { userService } from '../services/userService';
import type { UserResponse, UserCreatePayload, UserUpdatePayload } from '../services/userService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { FormSummary } from '../components/ui/FormSummary';
import { Pagination } from '../components/ui/Pagination';
import { ViewToggle } from '../components/ui/ViewToggle';
import { formControlStyle, formLabelStyle } from '../components/ui/formStyles';
import {
  Users, 
  UserPlus, 
  RefreshCw,
  Power,
  Mail,
  Building2,
  Pencil,

  Download,
  ImagePlus,
  Check,
  X,
} from 'lucide-react';
import { evaluatePassword, PASSWORD_MAX_LENGTH, isPasswordSecure } from '../utils/passwordPolicy';
import { getApiErrorMessage } from '../utils/apiErrors';
import { defaultListViewMode } from '../utils/viewMode';

const labelStyle = formLabelStyle;
const inputStyle = formControlStyle;

const PasswordRules: React.FC<{ value: string }> = ({ value }) => (
  <ul className="password-rules" aria-label="Requisitos de la contraseña">
    {evaluatePassword(value).map((rule) => (
      <li key={rule.id} className={rule.valid ? 'is-valid' : ''}>
        {rule.valid
          ? <Check size={12} aria-hidden="true" />
          : <X size={12} aria-hidden="true" />}
        {rule.label}
      </li>
    ))}
  </ul>
);

const roleLabel = (role: string): string =>
  role
    .replace(/^ROLE_/, '')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

const presenceOf = (u: UserResponse): { label: string; color: string } => {
  if (!u.active || !u.lastSeen) return { label: 'Desconectado', color: 'var(--text-muted)' };
  const diffMin = (Date.now() - new Date(u.lastSeen).getTime()) / 60000;
  if (diffMin < 2) return { label: 'En línea', color: 'var(--status-up)' };
  if (diffMin < 10) return { label: 'Ausente', color: 'var(--status-warn)' };
  return { label: 'Desconectado', color: 'var(--text-muted)' };
};

export const UsersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canExport = hasPermission('USUARIO_EXPORT');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filename = await reportService.exportUsers();
      toast.success(`Exportación generada: ${filename}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar la exportación');
    } finally {
      setExporting(false);
    }
  };
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(defaultListViewMode);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [createAvatarPreview, setCreateAvatarPreview] = useState('');

  const [formData, setFormData] = useState<UserCreatePayload>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    roles: ['ROLE_DOCENTE'],
  });

  const [editOpen, setEditOpen] = useState(false);  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [editForm, setEditForm] = useState<UserUpdatePayload>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    roles: ['ROLE_DOCENTE'],
    avatar: '',
    newPassword: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getAllUsers();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar usuarios desde MySQL';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleStatus = async (user: UserResponse) => {
    if (user.active) {
      const ok = await confirm({
        title: 'Deshabilitar usuario',
        message: `¿Deshabilitar la cuenta de ${user.fullName}? No podrá iniciar sesión hasta ser habilitada nuevamente.`,
        confirmLabel: 'Deshabilitar',
        variant: 'danger',
      });
      if (!ok) return;
    }
    try {
      await userService.toggleStatus(user.id, !user.active);
      toast.success(user.active ? 'Usuario deshabilitado.' : 'Usuario habilitado.');
      await loadUsers();
    } catch (err: unknown) {
      toast.error('Error al actualizar estado del usuario: ' + (err instanceof Error ? err.message : ''));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!isPasswordSecure(formData.password)) {
      setFormError('La contraseña debe tener entre 8 y 100 caracteres e incluir mayúscula, minúscula, número y símbolo.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await userService.createUser(formData);
      if (res.success) {
        setFormSuccess(`Usuario '${res.data.username}' creado con éxito.`);
        setFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          department: '',
          roles: ['ROLE_DOCENTE'],
        });
        setCreateAvatarPreview('');
        await loadUsers();
        setTimeout(() => setShowModal(false), 1200);
      }
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, 'Error al crear usuario'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('El archivo seleccionado debe ser una imagen.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCreateAvatarPreview(dataUrl);
        setFormData((f) => ({ ...f, avatar: dataUrl }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (user: UserResponse) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      department: user.department ?? '',
      roles: user.roles ?? [],
      avatar: user.avatar ?? '',
      newPassword: '',
    });
    setAvatarPreview(user.avatar ?? '');
    setEditError(null);
    setEditOpen(true);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditError('El archivo seleccionado debe ser una imagen.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarPreview(dataUrl);
        setEditForm((f) => ({ ...f, avatar: dataUrl }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    if (editForm.newPassword && !isPasswordSecure(editForm.newPassword)) {
      setEditError('La nueva contraseña debe tener entre 8 y 100 caracteres e incluir mayúscula, minúscula, número y símbolo.');
      return;
    }
    setEditSubmitting(true);
    try {
      const payload: UserUpdatePayload = { ...editForm };
      if (!payload.newPassword || !payload.newPassword.trim()) {
        delete payload.newPassword;
      }
      await userService.updateUser(editingUser.id, payload);
      toast.success('Usuario actualizado correctamente.');
      setEditOpen(false);
      await loadUsers();
    } catch (err) {
      setEditError(getApiErrorMessage(err, 'No se pudo actualizar el usuario'));
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Encabezado */}
      <PageHeader
        title="Gestión de Usuarios y Seguridad"
        icon={<Users size={26} />}
        accent="var(--primary)"
        breadcrumbs={[{ label: 'Administración y seguridad' }, { label: 'Usuarios del Sistema' }]}
        actions={
          <>
            <Button variant="outline" onClick={loadUsers} leftIcon={<RefreshCw size={16} />} isLoading={loading}>
              Actualizar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setCreateAvatarPreview('');
                setFormData((f) => ({ ...f, avatar: '' }));
                setShowModal(true);
              }}
              leftIcon={<UserPlus size={16} />}
            >
              Nuevo Usuario
            </Button>
          </>
        }
        stats={[
          { label: 'Usuarios', value: users.length },
          { label: 'Activos', value: users.filter((u) => u.active).length },
          { label: 'Inactivos', value: users.filter((u) => !u.active).length },
        ]}
      />

      {/* Usuarios */}
      <section>
        <SectionHeader
          compact
          icon={<Users size={18} />}
          eyebrow="Directorio"
          title="Usuarios del sistema"
          description="Cuentas, roles y estado de acceso a la plataforma."
          aside={
            <>
              {canExport && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  isLoading={exporting}
                  leftIcon={<Download size={15} />}
                >
                  Exportar
                </Button>
              )}
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </>
          }
        />

        {loading ? (
          <LoadingSpinner message="Consultando usuarios..." />
        ) : error ? (
          <div style={{ padding: '16px', backgroundColor: 'var(--status-down-bg)', borderRadius: 'var(--radius-md)', color: 'var(--status-down)' }}>
            {error}
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? (
              <div className="stagger user-grid">
                {users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((u) => {
                  const presence = presenceOf(u);
                  return (
                    <Card
                      key={u.id}
                      interactive
                      className="card-fill user-card"
                      style={{ padding: 0 }}
                    >
                      <div
                        className="user-card__body"
                        onClick={() => openEdit(u)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openEdit(u);
                          }
                        }}
                        aria-label={`Editar a ${u.fullName}`}
                      >
                        <div className="user-card__head">
                          <span className="user-card__avatar-wrap">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.fullName} className="user-card__avatar" />
                            ) : (
                              <span className="user-card__avatar user-card__avatar--initials" aria-hidden="true">
                                {(u.firstName?.[0] || u.username[0] || '?').toUpperCase()}
                              </span>
                            )}
                            <span
                              className="user-card__presence-dot"
                              style={{ background: presence.color }}
                              aria-hidden="true"
                            />
                          </span>
                          <div className="user-card__identity">
                            <h4 title={u.fullName}>{u.fullName}</h4>
                            <span className="user-card__handle">@{u.username}</span>
                          </div>
                          <Badge variant={u.active ? 'success' : 'danger'} dot size="sm">
                            {u.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>

                        <div className="user-card__meta">
                          <div className="user-card__meta-row">
                            <span className="user-card__meta-icon" aria-hidden="true"><Mail size={14} /></span>
                            <span title={u.email}>{u.email}</span>
                          </div>
                          <div className="user-card__meta-row">
                            <span className="user-card__meta-icon" aria-hidden="true"><Building2 size={14} /></span>
                            <span title={u.department || 'General'}>{u.department || 'General'}</span>
                          </div>
                        </div>

                        <div className="user-card__roles">
                          <span className="user-card__roles-label">Rol</span>
                          {u.roles?.length ? (
                            u.roles.map((r) => (
                              <Badge key={r} variant="role" size="sm">{roleLabel(r)}</Badge>
                            ))
                          ) : (
                            <span className="user-card__roles-empty">Sin rol asignado</span>
                          )}
                        </div>
                      </div>

                      <div className="user-card__footer">
                        <span className="user-card__presence" style={{ color: presence.color }}>
                          <span
                            className="user-card__presence-dot"
                            style={{ background: presence.color }}
                            aria-hidden="true"
                          />
                          {presence.label}
                        </span>
                        <div className="user-card__actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Pencil size={14} />}
                            onClick={() => openEdit(u)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant={u.active ? 'ghost' : 'secondary'}
                            size="sm"
                            className={u.active ? 'user-card__toggle user-card__toggle--danger' : 'user-card__toggle'}
                            leftIcon={<Power size={14} />}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.active ? 'Deshabilitar' : 'Habilitar'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <p className="table-scroll-hint">Desliza para ver más columnas →</p>
                <div className="data-table-wrap">
                  <table className="data-table data-table--stack table--users">
                    <colgroup>
                      <col style={{ width: '28%' }} />
                      <col style={{ width: '24%' }} />
                      <col style={{ width: '19%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Correo</th>
                        <th>Departamento</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((u) => (
                        <tr key={u.id}>
                          <td className="cell-strong">
                            <div className="table-person">
                              <span className="table-avatar" aria-hidden="true">
                                {u.avatar
                                  ? <img src={u.avatar} alt="" />
                                  : (u.firstName?.[0] ?? u.username?.[0] ?? '')}
                              </span>
                              <div className="table-person__copy">
                                <span title={u.fullName}>{u.fullName}</span>
                                <small className="cell-mono">@{u.username}</small>
                              </div>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>{u.department || 'General'}</td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {u.roles?.map((r) => (
                                <Badge key={r} variant="role" size="sm">
                                  {roleLabel(r)}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td>
                            <Badge variant={u.active ? 'success' : 'danger'} size="sm" dot>
                              {u.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td>
                            <div className="action-group">
                              <button
                                type="button"
                                className="action-btn primary"
                                title="Editar"
                                aria-label={`Editar ${u.fullName}`}
                                onClick={() => openEdit(u)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="action-btn warn"
                                title={u.active ? 'Deshabilitar' : 'Habilitar'}
                                aria-label={`${u.active ? 'Deshabilitar' : 'Habilitar'} ${u.fullName}`}
                                onClick={() => handleToggleStatus(u)}
                              >
                                <Power size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ color: 'var(--text-muted)' }}>No hay usuarios registrados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            <Pagination page={page} pageSize={PAGE_SIZE} total={users.length} onChange={setPage} itemLabel="usuarios" />
          </>
        )}
      </section>

      {/* Modal para Crear Usuario */}
      {showModal && (
        <Modal
          title="Registrar Nuevo Usuario"
          subtitle="Cree una cuenta institucional y asigne su rol."
          icon={<UserPlus size={20} />}
          maxWidth="640px"
          onClose={() => setShowModal(false)}
        >
            {formError && (
              <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-down-bg)', color: 'var(--status-down)', fontSize: 'var(--text-sm)', marginBottom: '14px' }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-up-bg)', color: 'var(--status-up)', fontSize: 'var(--text-sm)', marginBottom: '14px' }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="modal-form">
              <FormSummary
                icon={<Users size={18} />}
                title={`${formData.firstName} ${formData.lastName}`.trim() || 'Nuevo usuario'}
                subtitle={formData.username ? `@${formData.username} · ${formData.email || 'Sin correo'}` : 'Cuenta institucional'}
                meta={[roleLabel(formData.roles[0] ?? 'ROLE_DOCENTE'), formData.department || 'Sin departamento']}
                progress={Math.round(([formData.firstName, formData.lastName, formData.username, formData.email, formData.password].filter((value) => String(value ?? '').trim()).length / 5) * 100)}
                progressLabel="5 campos clave"
              />
              <div className="form-section">Datos personales</div>
              {/* Foto de perfil */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {createAvatarPreview ? (
                  <img src={createAvatarPreview} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-light)' }} />
                ) : (
                  <span className="icon-tile" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                    <ImagePlus size={22} />
                  </span>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="ghost-btn" style={{ cursor: 'pointer' }}>
                    <ImagePlus size={15} /> Subir imagen
                    <input type="file" accept="image/*" onChange={handleCreateAvatarFile} style={{ display: 'none' }} />
                  </label>
                  {createAvatarPreview && (
                    <button
                      type="button"
                      className="link-action"
                      style={{ color: 'var(--status-down)' }}
                      onClick={() => { setCreateAvatarPreview(''); setFormData((f) => ({ ...f, avatar: '' })); }}
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="create-user-first-name">Nombre</label>
                  <input id="create-user-first-name" style={inputStyle} required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="create-user-last-name">Apellido</label>
                  <input id="create-user-last-name" style={inputStyle} required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="create-user-department">Departamento / Facultad</label>
                  <input id="create-user-department" style={inputStyle} placeholder="ej. Facultad de Ciencias" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                </div>
              </div>

              <div className="form-section">Acceso y seguridad</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="create-user-username">Nombre de usuario</label>
                  <input id="create-user-username" style={inputStyle} required placeholder="ej. maria.gonzalez" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="create-user-email">Correo institucional</label>
                  <input id="create-user-email" style={inputStyle} type="email" required placeholder="ej. maria.gonzalez@gestoracad.edu" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="create-user-password">Contraseña (mínimo 8 caracteres)</label>
                  <input id="create-user-password" style={inputStyle} type="password" required minLength={8} maxLength={PASSWORD_MAX_LENGTH} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  <PasswordRules value={formData.password} />
                </div>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="create-user-role">Rol institucional</label>
                  <select id="create-user-role" style={inputStyle} value={formData.roles[0]} onChange={(e) => setFormData({ ...formData, roles: [e.target.value] })}>
                    <option value="ROLE_UNIVERSIDAD">UNIVERSIDAD (Administración Central)</option>
                    <option value="ROLE_DOCENTE">DOCENTE (Cuerpo Académico)</option>
                    <option value="ROLE_ESTUDIANTE">ESTUDIANTE (Comunidad Universitaria)</option>
                  </select>
                </div>
              </div>
              <div className="modal-form-footer">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Guardar Usuario
                </Button>
              </div>
            </form>
        </Modal>
      )}
      {/* Modal Editar Usuario */}
      {editOpen && editingUser && (
        <Modal
          title="Editar Usuario"
          subtitle="Actualice los datos, el rol, la foto y opcionalmente la contraseña."
          icon={<Pencil size={20} />}
          maxWidth="560px"
          onClose={() => setEditOpen(false)}
        >
            {editError && (
              <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-down-bg)', color: 'var(--status-down)', fontSize: 'var(--text-sm)', marginBottom: '14px' }}>{editError}</div>
            )}

            <form onSubmit={handleSaveEdit} className="modal-form">
              <FormSummary
                icon={<Users size={18} />}
                title={`${editForm.firstName} ${editForm.lastName}`.trim() || editingUser.fullName}
                subtitle={`@${editForm.username} · ${editForm.email || 'Sin correo'}`}
                meta={[roleLabel(editForm.roles[0] ?? 'ROLE_DOCENTE'), editForm.department || 'Sin departamento']}
                progress={Math.round(([editForm.firstName, editForm.lastName, editForm.username, editForm.email].filter((value) => String(value ?? '').trim()).length / 4) * 100)}
                progressLabel="4 campos clave"
              />
              <div className="form-section">Datos personales</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-light)' }} />
                ) : (
                  <span className="icon-tile" style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '1.4rem' }}>
                    {editForm.firstName?.[0] || editingUser.username[0].toUpperCase()}
                  </span>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="ghost-btn" style={{ cursor: 'pointer' }}>
                    <ImagePlus size={15} /> Subir imagen
                    <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="link-action"
                      style={{ color: 'var(--status-down)' }}
                      onClick={() => { setAvatarPreview(''); setEditForm((f) => ({ ...f, avatar: '' })); }}
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '12px' }}>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="edit-user-first-name">Nombre</label>
                  <input id="edit-user-first-name" style={inputStyle} required value={editForm.firstName} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="edit-user-last-name">Apellido</label>
                  <input id="edit-user-last-name" style={inputStyle} required value={editForm.lastName} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '12px' }}>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="edit-user-phone">Teléfono</label>
                  <input id="edit-user-phone" style={inputStyle} value={editForm.phone ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label" style={labelStyle} htmlFor="edit-user-department">Departamento / Facultad</label>
                  <input id="edit-user-department" style={inputStyle} value={editForm.department ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))} />
                </div>
              </div>

              <div className="form-section">Acceso y seguridad</div>
              <div>
                <label className="field-label" style={labelStyle} htmlFor="edit-user-username">Nombre de usuario</label>
                <input id="edit-user-username" style={inputStyle} required value={editForm.username} onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))} />
              </div>

              <div>
                <label className="field-label" style={labelStyle} htmlFor="edit-user-email">Correo institucional</label>
                <input id="edit-user-email" style={inputStyle} type="email" required value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>

              <div>
                <label className="field-label" style={labelStyle} htmlFor="edit-user-role">Rol institucional</label>
                <select id="edit-user-role" style={inputStyle} value={editForm.roles[0]} onChange={(e) => setEditForm((f) => ({ ...f, roles: [e.target.value] }))}>
                  <option value="ROLE_UNIVERSIDAD">UNIVERSIDAD (Administración Central)</option>
                  <option value="ROLE_DOCENTE">DOCENTE (Cuerpo Académico)</option>
                  <option value="ROLE_ESTUDIANTE">ESTUDIANTE (Comunidad Universitaria)</option>
                </select>
              </div>

              <div>
                <label className="field-label" style={labelStyle} htmlFor="edit-user-new-password">Nueva contraseña (opcional)</label>
                <input id="edit-user-new-password" style={inputStyle} type="password" minLength={8} maxLength={PASSWORD_MAX_LENGTH} placeholder="Dejar vacío para no cambiar" value={editForm.newPassword ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, newPassword: e.target.value }))} />
                {editForm.newPassword ? <PasswordRules value={editForm.newPassword} /> : null}
              </div>

              <div className="modal-form-footer">
                <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" isLoading={editSubmitting}>Guardar cambios</Button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
};
