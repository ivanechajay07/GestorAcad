import React from 'react';
import { Key, Layers, Pencil, ShieldCheck, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { RoleData } from '../../services/roleService';
import {
  formatPermissionName,
  formatRoleName,
  groupPermissionsByModule,
  isProtectedRole,
  roleGradient,
  roleInitials,
} from '../../utils/roleFormatters';

interface RoleDetailPanelProps {
  role: RoleData;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (role: RoleData) => void;
}

/**
 * Detalle completo de un rol en un modal compartido.
 * Muestra identidad, métricas y permisos agrupados por módulo, con el código
 * técnico como referencia secundaria. El modal gestiona Escape, fondo y foco.
 */
export const RoleDetailPanel: React.FC<RoleDetailPanelProps> = ({
  role,
  canEdit,
  onClose,
  onEdit,
}) => {
  const permissions = role.permissions ?? [];
  const groups = groupPermissionsByModule(permissions).map((group) => ({
    ...group,
    permissions: permissions
      .filter((permission) => permission.module === group.module)
      .sort((a, b) => formatPermissionName(a.name).localeCompare(formatPermissionName(b.name), 'es')),
  }));
  const userCount = role.usuarios ?? 0;

  return (
    <Modal
      titleId="role-detail-title"
      title={formatRoleName(role.name)}
      subtitle={role.description || 'Sin descripción registrada.'}
      icon={<ShieldCheck size={21} />}
      maxWidth="720px"
      onClose={onClose}
    >
      <div className="role-detail">
        <div className="role-detail__summary">
          <span
            className="role-detail__avatar"
            style={{ background: roleGradient(role.name) }}
            aria-hidden="true"
          >
            {roleInitials(role.name)}
          </span>
          <div className="role-detail__identity">
            <span className="role-detail__eyebrow">
              {isProtectedRole(role.name) ? 'Rol base' : 'Rol personalizado'}
            </span>
            <code>{role.name}</code>
          </div>
          <div className="role-detail__stats">
            <span title="Permisos asignados">
              <Key size={14} aria-hidden="true" />
              <strong>{permissions.length}</strong>{' '}
              {permissions.length === 1 ? 'permiso' : 'permisos'}
            </span>
            <span title="Módulos cubiertos">
              <Layers size={14} aria-hidden="true" />
              <strong>{groups.length}</strong>{' '}
              {groups.length === 1 ? 'módulo' : 'módulos'}
            </span>
            <span title="Usuarios con este rol">
              <Users size={14} aria-hidden="true" />
              <strong>{userCount}</strong>{' '}
              {userCount === 1 ? 'usuario' : 'usuarios'}
            </span>
          </div>
        </div>

        <div className="role-detail__groups">
          {groups.length === 0 ? (
            <div className="role-detail__empty">
              <ShieldCheck size={22} aria-hidden="true" />
              <p>Este rol todavía no tiene permisos asignados.</p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.module} className="role-detail__group">
                <header>
                  <h3>{group.label}</h3>
                  <span className="role-detail__count" aria-label={`${group.permissions.length} permisos`}>
                    {group.permissions.length}
                  </span>
                </header>
                <ul>
                  {group.permissions.map((permission) => (
                    <li key={permission.id}>
                      <div className="role-detail__permission">
                        <strong>{formatPermissionName(permission.name)}</strong>
                        <code>{permission.name}</code>
                      </div>
                      <p>{permission.description}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className="role-detail__footer">
          <span className="role-detail__hint">
            Las cuentas con este rol heredan los permisos aquí listados.
          </span>
          <div className="role-detail__actions">
            {canEdit && (
              <Button leftIcon={<Pencil size={15} />} onClick={() => onEdit(role)}>
                Editar rol
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
