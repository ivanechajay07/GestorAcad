import React from 'react';
import { Copy, Eye, Key, Pencil, ShieldCheck, Trash2, Users } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import type { RoleData } from '../../services/roleService';
import {
  formatRoleName,
  groupPermissionsByModule,
  isProtectedRole,
  pluralize,
  roleGradient,
  roleInitials,
} from '../../utils/roleFormatters';

interface RoleCardProps {
  role: RoleData;
  canEdit: boolean;
  canDelete: boolean;
  onView: (role: RoleData) => void;
  onEdit: (role: RoleData) => void;
  onDuplicate: (role: RoleData) => void;
  onDelete: (role: RoleData) => void;
}

const MAX_VISIBLE_MODULES = 4;

/**
 * Tarjeta interactiva de un rol.
 * <p>
 * Resume el rol en lenguaje claro (nombre en español, código técnico, usuarios,
 * permisos y módulos) y ofrece las acciones de consultar, editar, duplicar y
 * eliminar. El botón de eliminar se deshabilita cuando el rol tiene usuarios
 * asignados, para evitar una operación que el backend rechazaría.
 */
export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const permissions = role.permissions ?? [];
  const modules = groupPermissionsByModule(permissions);
  const visibleModules = modules.slice(0, MAX_VISIBLE_MODULES);
  const remainingModules = modules.length - visibleModules.length;
  const protectedRole = isProtectedRole(role.name);
  const hasUsers = role.usuarios > 0;

  return (
    <Card interactive className="card-fill roles-card">
      <div className="entity-card-v2">
        <div className="entity-head">
          <span
            className="entity-avatar roles-card__avatar"
            style={{ background: roleGradient(role.name) }}
            aria-hidden="true"
          >
            {roleInitials(role.name)}
          </span>
          <div className="entity-id">
            <h4>{formatRoleName(role.name)}</h4>
            <span className="entity-code">{role.name}</span>
          </div>
          <div className="entity-badges">
            <Badge variant={protectedRole ? 'warning' : 'role'} size="sm">
              {protectedRole ? 'Rol base' : 'Personalizado'}
            </Badge>
          </div>
        </div>

        <p className="roles-card__description">{role.description || 'Sin descripción registrada.'}</p>

        <div className="roles-card__stats">
          <span title="Permisos asignados">
            <Key size={14} aria-hidden="true" />
            {pluralize(permissions.length, 'permiso', 'permisos')}
          </span>
          <span title="Usuarios con este rol">
            <Users size={14} aria-hidden="true" />
            {pluralize(role.usuarios ?? 0, 'usuario', 'usuarios')}
          </span>
          <span title="Módulos cubiertos">
            <ShieldCheck size={14} aria-hidden="true" />
            {pluralize(modules.length, 'módulo', 'módulos')}
          </span>
        </div>

        <div className="roles-card__modules">
          {visibleModules.map((module) => (
            <span key={module.module} className="roles-chip" title={`${module.total} permisos en ${module.label}`}>
              {module.label}
              <strong>{module.total}</strong>
            </span>
          ))}
          {remainingModules > 0 && (
            <span className="roles-chip roles-chip--more" title={modules.map((module) => module.label).join(', ')}>
              +{remainingModules} más
            </span>
          )}
          {modules.length === 0 && (
            <span className="roles-card__empty">Sin permisos asignados todavía</span>
          )}
        </div>

        <div className="entity-actions">
          <button type="button" className="ghost-btn info" onClick={() => onView(role)}>
            <Eye size={14} /> Ver detalle
          </button>
          {canEdit && (
            <button type="button" className="ghost-btn primary" onClick={() => onEdit(role)}>
              <Pencil size={14} /> Editar
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => onDuplicate(role)}
              title="Crear un rol nuevo a partir de este"
            >
              <Copy size={14} /> Duplicar
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="ghost-btn danger"
              onClick={() => onDelete(role)}
              disabled={protectedRole || hasUsers}
              title={
                protectedRole
                  ? 'El rol base del sistema no se puede eliminar'
                  : hasUsers
                    ? 'Reasigna a los usuarios antes de eliminar este rol'
                    : 'Eliminar rol'
              }
            >
              <Trash2 size={14} /> Eliminar
            </button>
          )}
        </div>

        {hasUsers && (
          <p className="roles-card__hint">
            <Users size={13} aria-hidden="true" />
            Este rol está asignado a {pluralize(role.usuarios, 'usuario', 'usuarios')}; para eliminarlo, reasígnalos primero.
          </p>
        )}
      </div>
    </Card>
  );
};
