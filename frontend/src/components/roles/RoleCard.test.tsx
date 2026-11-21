import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RoleCard } from './RoleCard';
import type { RoleData } from '../../services/roleService';

const noop = vi.fn();

const docente: RoleData = {
  id: 2,
  name: 'ROLE_DOCENTE',
  description: 'Personal docente con acceso a la gestión académica.',
  usuarios: 4,
  permissions: [
    { id: 1, name: 'DOCENTE_VIEW', module: 'DOCENTE', description: 'Consultar docentes' },
    { id: 2, name: 'ACADEMICO_EDIT', module: 'ACADEMICO', description: 'Editar información académica' },
  ],
};

const base: RoleData = {
  id: 1,
  name: 'ROLE_UNIVERSIDAD',
  description: 'Administrador institucional.',
  usuarios: 0,
  permissions: [],
};

const render = (role: RoleData, overrides: Partial<React.ComponentProps<typeof RoleCard>> = {}) =>
  renderToStaticMarkup(
    <RoleCard
      role={role}
      canEdit
      canDelete
      onView={noop}
      onEdit={noop}
      onDuplicate={noop}
      onDelete={noop}
      {...overrides}
    />
  );

describe('RoleCard', () => {
  it('muestra el nombre en español, el código técnico, usuarios y módulos', () => {
    const html = render(docente);

    expect(html).toContain('Docente');
    expect(html).toContain('ROLE_DOCENTE');
    expect(html).toContain('4 usuarios');
    expect(html).toContain('2 permisos');
    expect(html).toContain('2 módulos');
    expect(html).toContain('Docentes');
    expect(html).toContain('Académico');
    expect(html).toContain('Personalizado');
  });

  it('ofrece las acciones interactivas en español', () => {
    const html = render(docente);

    expect(html).toContain('Ver detalle');
    expect(html).toContain('Editar');
    expect(html).toContain('Duplicar');
    expect(html).toContain('Eliminar');
  });

  it('deshabilita la eliminación cuando el rol tiene usuarios asignados', () => {
    const html = render(docente);

    expect(html).toContain('disabled');
    expect(html).toContain('Reasigna a los usuarios antes de eliminar este rol');
    expect(html).toContain('Este rol está asignado a 4 usuarios');
  });

  it('protege el rol base y lo marca como tal', () => {
    const html = render(base);

    expect(html).toContain('Rol base');
    expect(html).toContain('El rol base del sistema no se puede eliminar');
    expect(html).toContain('Sin permisos asignados todavía');
  });

  it('oculta las acciones de edición cuando el usuario no tiene permiso', () => {
    const html = render(base, { canEdit: false, canDelete: false });

    expect(html).toContain('Ver detalle');
    expect(html).not.toContain('Duplicar');
    expect(html).not.toContain('Eliminar');
  });

  it('resume los módulos restantes cuando hay muchos', () => {
    const many: RoleData = {
      ...docente,
      permissions: [
        { id: 1, name: 'USUARIO_VIEW', module: 'USUARIO', description: '' },
        { id: 2, name: 'ROL_VIEW', module: 'ROL', description: '' },
        { id: 3, name: 'DOCENTE_VIEW', module: 'DOCENTE', description: '' },
        { id: 4, name: 'ESTUDIANTE_VIEW', module: 'ESTUDIANTE', description: '' },
        { id: 5, name: 'AUDITORIA_VIEW', module: 'AUDITORIA', description: '' },
      ],
    };

    expect(render(many)).toContain('+1 más');
  });
});
