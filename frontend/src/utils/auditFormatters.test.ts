import { describe, expect, it } from 'vitest';
import {
  auditActionTone,
  auditDateKey,
  auditDayLabel,
  describeClientIp,
  describeUserAgent,
  formatAuditAction,
  formatAuditDate,
  formatAuditRelative,
  formatAuditResult,
  formatAuditTime,
} from './auditFormatters';

describe('auditFormatters', () => {
  it('traduce las acciones técnicas a etiquetas legibles', () => {
    expect(formatAuditAction('LOGIN')).toBe('Ingreso');
    expect(formatAuditAction('CREATE')).toBe('Creación');
    expect(formatAuditAction('DELETE')).toBe('Eliminación');
    expect(formatAuditAction('EXPORT')).toBe('Exportación');
    expect(formatAuditAction('OTRA')).toBe('OTRA');
    expect(formatAuditAction(null)).toBe('Sin acción');
  });

  it('asigna un tono visual coherente a cada acción', () => {
    expect(auditActionTone('CREATE')).toBe('success');
    expect(auditActionTone('UPDATE')).toBe('warning');
    expect(auditActionTone('DELETE')).toBe('danger');
    expect(auditActionTone('LOGIN')).toBe('role');
    expect(auditActionTone('VIEW')).toBe('info');
    expect(auditActionTone(null)).toBe('info');
  });

  it('describe el resultado de la operación', () => {
    expect(formatAuditResult('SUCCESS')).toEqual({ label: 'Éxito', ok: true });
    expect(formatAuditResult('FAILURE')).toEqual({ label: 'Falló', ok: false });
    expect(formatAuditResult(null)).toEqual({ label: 'Falló', ok: false });
  });

  it('convierte la marca UTC a fecha y hora de Lima con segundos', () => {
    expect(formatAuditDate('2026-10-28T17:17:58Z')).toBe('28 oct 2026');
    expect(formatAuditTime('2026-10-28T17:17:58Z')).toBe('12:17:58');
    expect(formatAuditDate('fecha-invalida')).toBe('—');
    expect(formatAuditTime(null)).toBe('—');
  });

  it('agrupa por día institucional y no por el día UTC', () => {
    expect(auditDateKey('2026-10-28T02:00:00Z')).toBe('2026-10-27');
    expect(auditDateKey('2026-10-28T17:00:00Z')).toBe('2026-10-28');
    expect(auditDateKey(null)).toBe('');
    expect(auditDayLabel(new Date('2026-10-28T17:00:00Z'))).toBe('28 oct');
  });

  it('describe el tiempo transcurrido respecto de una referencia', () => {
    const now = new Date('2026-10-28T17:20:00Z');
    expect(formatAuditRelative('2026-10-28T17:15:58Z', now)).toBe('hace 4 minutos');
    expect(formatAuditRelative(null, now)).toBe('sin fecha');
  });

  it('clasifica la IP y la red de origen', () => {
    expect(describeClientIp('127.0.0.1')).toEqual({ value: '127.0.0.1', network: 'equipo local' });
    expect(describeClientIp('172.23.0.5')).toEqual({ value: '172.23.0.5', network: 'red interna' });
    expect(describeClientIp('192.168.1.20')).toEqual({ value: '192.168.1.20', network: 'red interna' });
    expect(describeClientIp('8.8.8.8')).toEqual({ value: '8.8.8.8' });
    expect(describeClientIp('')).toEqual({ value: 'No registrada' });
  });

  it('resume navegador y sistema operativo del User-Agent', () => {
    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
      )
    ).toEqual({ browser: 'Chrome', os: 'Windows 10/11', label: 'Chrome · Windows 10/11' });

    expect(
      describeUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0'
      ).label
    ).toBe('Edge · Windows 10/11');

    expect(describeUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1').label)
      .toBe('Safari · iOS');
    expect(describeUserAgent('Mozilla/5.0 (Windows NT; Windows NT 10.0; es-MX) WindowsPowerShell/5.1').label)
      .toBe('PowerShell · Windows 10/11');
    expect(describeUserAgent('')).toEqual({ browser: 'Desconocido', os: '', label: 'Desconocido' });
  });
});
