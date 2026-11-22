import type { PermissionData } from '../services/roleService';

/**
 * Traducciones y utilidades de presentación del módulo de roles.
 * El backend conserva códigos técnicos (`ROLE_*`, `MODULO_ACCION`); la interfaz
 * los traduce a español y deja el código como referencia secundaria.
 */

const ROLE_LABELS: Record<string, string> = {
  ROLE_UNIVERSIDAD: 'Administrador institucional',
  ROLE_DOCENTE: 'Docente',
  ROLE_ESTUDIANTE: 'Estudiante',
  ROLE_SUPERVISOR: 'Supervisor',
  ROLE_SECRETARIA: 'Secretaría académica',
  ROLE_SECRETARIO: 'Secretaría académica',
  ROLE_DIRECTOR: 'Director de escuela',
  ROLE_COORDINADOR: 'Coordinador académico',
  ROLE_CAJA: 'Caja y tesorería',
};

const MODULE_LABELS: Record<string, string> = {
  USUARIO: 'Usuarios',
  ROL: 'Roles y permisos',
  AUDITORIA: 'Auditoría',
  UNIVERSIDAD: 'Universidad',
  SEDE: 'Sedes',
  AUTORIDAD: 'Autoridades',
  PARAMETRO: 'Parámetros',
  ACADEMICO: 'Académico',
  DOCENTE: 'Docentes',
  ESTUDIANTE: 'Estudiantes',
  ESPECIALIDAD: 'Especialidades',
  ADMISION: 'Admisión',
  ASIGNACION: 'Asignación',
  MATRICULADO: 'Matriculados',
  MATRICULA: 'Matrículas',
  CURSO: 'Cursos',
  NOTIFICACION: 'Notificaciones',
  SEGURIDAD: 'Seguridad',
  SISTEMA: 'Sistema',
};

const PREFIX_LABELS: Record<string, string> = {
  USUARIO: 'usuarios',
  ROL: 'roles',
  AUDITORIA: 'auditoría',
  UNIVERSIDAD: 'universidad',
  SEDE: 'sedes',
  AUTORIDAD: 'autoridades',
  PARAMETRO: 'parámetros',
  ACADEMICO: 'información académica',
  DOCENTE: 'docentes',
  ESTUDIANTE: 'estudiantes',
  ESPECIALIDAD: 'especialidades',
  ADMISION: 'admisiones',
  ASIGNACION: 'asignaciones',
  MATRICULADO: 'matriculados',
  MATRICULA: 'matrículas',
  CURSO: 'cursos',
  NOTIFICACION: 'notificaciones',
  SEGURIDAD: 'seguridad',
  SISTEMA: 'sistema',
  FICHA: 'ficha del estudiante',
};

const ACTION_LABELS: Record<string, string> = {
  VIEW: 'Consultar',
  READ: 'Consultar',
  CREATE: 'Registrar',
  EDIT: 'Editar',
  UPDATE: 'Editar',
  DELETE: 'Eliminar',
  EXPORT: 'Exportar',
  IMPORT: 'Importar',
  MANAGE: 'Administrar',
  ASSIGN: 'Asignar',
  CLOSE: 'Cerrar',
};

const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

/** Normaliza para búsquedas: minúsculas y sin tildes. */
export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Número con separador de miles en español. */
export const formatCount = (value: number): string => value.toLocaleString('es-PE');

/** Pluraliza sin duplicar sufijos (`1 permiso`, `2 permisos`). */
export const pluralize = (total: number, singular: string, plural: string): string =>
  `${formatCount(total)} ${total === 1 ? singular : plural}`;

/**
 * Nombre legible del rol. Los roles institucionales conocidos tienen una
 * etiqueta propia; los personalizados se derivan del código.
 */
export const formatRoleName = (name: string): string => {
  if (!name) return 'Rol sin nombre';
  if (ROLE_LABELS[name]) return ROLE_LABELS[name];

  const cleaned = name.replace(/^ROLE_/i, '').replace(/_/g, ' ').trim();
  if (!cleaned) return 'Rol sin nombre';

  return cleaned
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && CONNECTORS.has(lower)) return lower;
      return capitalize(word);
    })
    .join(' ');
};

/** Nombre legible del módulo (`USUARIO` → `Usuarios`). */
export const formatModuleName = (module: string): string => {
  if (!module) return 'Sin módulo';
  if (MODULE_LABELS[module]) return MODULE_LABELS[module];

  return module
    .replace(/_/g, ' ')
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && CONNECTORS.has(lower)) return lower;
      return capitalize(word);
    })
    .join(' ');
};

/** Acción legible del permiso (`CREATE` → `Registrar`). */
export const formatPermissionAction = (name: string): string => {
  const parts = name.split('_');
  const action = parts[parts.length - 1] ?? '';
  return ACTION_LABELS[action] ?? formatRoleName(name);
};

/**
 * Frase en español para un permiso técnico.
 * Ejemplos: `USUARIO_CREATE` → `Registrar usuarios`; `ROL_VIEW` → `Consultar roles`.
 */
export const formatPermissionName = (name: string): string => {
  if (!name) return 'Permiso sin nombre';

  const parts = name.split('_');
  const action = parts[parts.length - 1] ?? '';
  const prefix = parts.slice(0, -1).join('_');
  const actionLabel = ACTION_LABELS[action];

  if (!actionLabel || !prefix) return formatRoleName(name);

  const target = PREFIX_LABELS[prefix] ?? formatModuleName(prefix).toLowerCase();
  return `${actionLabel} ${target}`;
};

/** Iniciales para el avatar del rol (`Administrador institucional` → `AI`). */
export const roleInitials = (name: string): string => {
  const words = formatRoleName(name).split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? 'R';
  const second = words[1]?.charAt(0) ?? '';
  return `${first}${second}`.toUpperCase();
};

const ROLE_GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #4f46e5)',
  'linear-gradient(135deg, #0ea5e9, #2563eb)',
  'linear-gradient(135deg, #10b981, #0d9488)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #db2777)',
];

/** Gradiente estable por rol para reconocerlo de un vistazo. */
export const roleGradient = (name: string): string => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997;
  }
  return ROLE_GRADIENTS[hash % ROLE_GRADIENTS.length];
};

export interface ModuleGroup {
  module: string;
  label: string;
  total: number;
}

/** Agrupa permisos por módulo con la etiqueta en español y su conteo. */
export const groupPermissionsByModule = (permissions: PermissionData[]): ModuleGroup[] => {
  const totals = new Map<string, number>();
  permissions.forEach((permission) => {
    totals.set(permission.module, (totals.get(permission.module) ?? 0) + 1);
  });

  return Array.from(totals.entries())
    .map(([module, total]) => ({ module, label: formatModuleName(module), total }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
};

/** El rol base del sistema no se puede eliminar. */
export const isProtectedRole = (name: string): boolean => name === 'ROLE_UNIVERSIDAD';

/** Código técnico que se guardará al escribir un nombre natural. */
export const buildRoleCode = (value: string): string => {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/^ROLE_/, '');
  return `ROLE_${normalized || 'NUEVO_ROL'}`;
};
