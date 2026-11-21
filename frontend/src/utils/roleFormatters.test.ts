import { describe, expect, it } from 'vitest';
import {
  buildRoleCode,
  formatCount,
  formatModuleName,
  formatPermissionAction,
  formatPermissionName,
  formatRoleName,
  groupPermissionsByModule,
  isProtectedRole,
  normalizeText,
  pluralize,
  roleGradient,
  roleInitials,
} from './roleFormatters';

describe('roleFormatters', () => {
  it('traduce los roles institucionales y deriva los personalizados', () => {
    expect(formatRoleName('ROLE_UNIVERSIDAD')).toBe('Administrador institucional');
    expect(formatRoleName('ROLE_DOCENTE')).toBe('Docente');
    expect(formatRoleName('ROLE_ESTUDIANTE')).toBe('Estudiante');
    expect(formatRoleName('ROLE_JEFE_DE_LABORATORIO')).toBe('Jefe de Laboratorio');
    expect(formatRoleName('')).toBe('Rol sin nombre');
  });

  it('traduce los módulos al español', () => {
    expect(formatModuleName('USUARIO')).toBe('Usuarios');
    expect(formatModuleName('ROL')).toBe('Roles y permisos');
    expect(formatModuleName('AUDITORIA')).toBe('Auditoría');
    expect(formatModuleName('')).toBe('Sin módulo');
  });

  it('convierte los permisos técnicos en frases en español', () => {
    expect(formatPermissionName('USUARIO_CREATE')).toBe('Registrar usuarios');
    expect(formatPermissionName('ROL_VIEW')).toBe('Consultar roles');
    expect(formatPermissionName('AUDITORIA_EXPORT')).toBe('Exportar auditoría');
    expect(formatPermissionAction('USUARIO_DELETE')).toBe('Eliminar');
  });

  it('normaliza la búsqueda sin tildes ni mayúsculas', () => {
    expect(normalizeText('  Auditoría  ')).toBe('auditoria');
    expect(normalizeText('MATRÍCULA')).toBe('matricula');
  });

  it('formatea conteos y pluraliza correctamente', () => {
    expect(formatCount(1234)).toBe('1,234');
    expect(pluralize(1, 'usuario', 'usuarios')).toBe('1 usuario');
    expect(pluralize(0, 'usuario', 'usuarios')).toBe('0 usuarios');
    expect(pluralize(3, 'permiso', 'permisos')).toBe('3 permisos');
  });

  it('agrupa los permisos por módulo con etiqueta y conteo', () => {
    const groups = groupPermissionsByModule([
      { id: 1, name: 'USUARIO_VIEW', module: 'USUARIO', description: '' },
      { id: 2, name: 'USUARIO_CREATE', module: 'USUARIO', description: '' },
      { id: 3, name: 'ROL_VIEW', module: 'ROL', description: '' },
    ]);

    expect(groups).toHaveLength(2);
    const usuarios = groups.find((group) => group.module === 'USUARIO');
    expect(usuarios?.label).toBe('Usuarios');
    expect(usuarios?.total).toBe(2);
  });

  it('genera iniciales y gradientes estables', () => {
    expect(roleInitials('ROLE_UNIVERSIDAD')).toBe('AI');
    expect(roleInitials('ROLE_DOCENTE')).toBe('D');
    expect(roleGradient('ROLE_DOCENTE')).toBe(roleGradient('ROLE_DOCENTE'));
  });

  it('protege el rol base y construye el código técnico', () => {
    expect(isProtectedRole('ROLE_UNIVERSIDAD')).toBe(true);
    expect(isProtectedRole('ROLE_DOCENTE')).toBe(false);
    expect(buildRoleCode('supervisor de sede')).toBe('ROLE_SUPERVISOR_DE_SEDE');
    expect(buildRoleCode('ROLE_AUXILIAR')).toBe('ROLE_AUXILIAR');
    expect(buildRoleCode('   ')).toBe('ROLE_NUEVO_ROL');
  });
});
