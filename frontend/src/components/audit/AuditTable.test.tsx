import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuditTable } from './AuditTable';
import type { AuditLogItem } from '../../services/auditService';

const log: AuditLogItem = {
  id: 21,
  username: 'admin.rectoria',
  action: 'LOGIN',
  module: 'SEGURIDAD',
  description: 'Inicio de sesión exitoso',
  endpoint: '/api/v1/auth/login',
  httpMethod: 'POST',
  clientIp: '172.23.0.5',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  entityName: 'tb_usuarios',
  entityId: 7,
  result: 'SUCCESS',
  timestamp: '2026-10-28T17:15:58Z',
};

const render = (logs: AuditLogItem[]) =>
  renderToStaticMarkup(<AuditTable logs={logs} now={new Date('2026-10-28T17:17:58Z')} />);

describe('AuditTable', () => {
  it('muestra las cinco columnas solicitadas en el orden esperado', () => {
    const html = render([log]);
    const headers = ['Acción', 'Usuario', 'Dispositivo / IP', 'Detalle', 'Fecha y hora'];
    const positions = headers.map((header) => html.indexOf(`>${header}</th>`));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).not.toContain('Endpoint / método');
    expect(html).not.toContain('Resultado</th>');
  });

  it('presenta acción, usuario, dispositivo, detalle y fecha con hora comprensible', () => {
    const html = render([log]);

    expect(html).toContain('Ingreso');
    expect(html).toContain('SEGURIDAD');
    expect(html).toContain('admin.rectoria');
    expect(html).toContain('Éxito');
    expect(html).toContain('Chrome · Windows 10/11');
    expect(html).toContain('172.23.0.5');
    expect(html).toContain('red interna');
    expect(html).toContain('Inicio de sesión exitoso');
    expect(html).not.toContain('tb_usuarios');
    expect(html).not.toContain('POST /api/v1/auth/login');
    expect(html).not.toContain('audit-detail__meta');
    expect(html).toContain('28 oct 2026');
    expect(html).toContain('12:15:58');
    expect(html).toContain('hace 2 minutos');
    expect(html).toContain('<caption class="sr-only">');
    expect(html).toContain('dateTime="2026-10-28T17:15:58Z"');
  });

  it('marca los fallos y tolera datos ausentes', () => {
    const html = render([
      {
        ...log,
        id: 22,
        username: '',
        action: 'DELETE',
        result: 'FAILURE',
        clientIp: '',
        userAgent: null,
        description: '',
        entityName: null,
        entityId: null,
        timestamp: 'fecha-invalida',
      },
    ]);

    expect(html).toContain('Eliminación');
    expect(html).toContain('Falló');
    expect(html).toContain('ANONIMO');
    expect(html).toContain('Desconocido');
    expect(html).toContain('No registrada');
    expect(html).toContain('Sin detalle registrado');
    expect(html).toContain('—');
  });
});
