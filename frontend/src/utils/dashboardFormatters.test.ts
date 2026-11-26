import { describe, expect, it } from 'vitest';
import {
  formatCategoryLabel,
  formatCount,
  formatDayLabel,
  formatLongLabel,
  formatPercentage,
  formatPeriod,
  formatRelativeTime,
} from './dashboardFormatters';

describe('dashboardFormatters', () => {
  it('formatea conteos y valores ausentes', () => {
    expect(formatCount(3560)).toBe('3,560');
    expect(formatCount(0)).toBe('0');
    expect(formatCount(null)).toBe('—');
    expect(formatCount(undefined)).toBe('—');
  });

  it('usa el periodo configurado o un texto explícito', () => {
    expect(formatPeriod('2026-I')).toBe('2026-I');
    expect(formatPeriod('  ')).toBe('Periodo no configurado');
    expect(formatPeriod(null)).toBe('Periodo no configurado');
  });

  it('etiqueta los días sin desfase de zona horaria', () => {
    expect(formatDayLabel('2026-10-28')).toBe('28 oct');
    expect(formatDayLabel('2026-01-01')).toBe('01 ene');
    expect(formatDayLabel('fecha-invalida')).toBe('fecha-invalida');
    expect(formatDayLabel(null)).toBe('—');
  });

  it('describe el tiempo transcurrido en minutos, horas y días', () => {
    const now = new Date('2026-10-28T12:00:00Z');
    expect(formatRelativeTime(null, now)).toBe('sin datos');
    expect(formatRelativeTime('2026-10-28T11:59:40Z', now)).toBe('hace unos segundos');
    expect(formatRelativeTime('2026-10-28T11:59:00Z', now)).toBe('hace 1 minuto');
    expect(formatRelativeTime('2026-10-28T11:30:00Z', now)).toBe('hace 30 minutos');
    expect(formatRelativeTime('2026-10-28T10:00:00Z', now)).toBe('hace 2 horas');
    expect(formatRelativeTime('2026-10-27T11:00:00Z', now)).toBe('hace 1 día');
    expect(formatRelativeTime('2026-10-24T12:00:00Z', now)).toBe('hace 4 días');
  });

  it('calcula porcentajes sin dividir por cero', () => {
    expect(formatPercentage(2, 8)).toBe(25);
    expect(formatPercentage(0, 0)).toBe(0);
    expect(formatPercentage(5, -1)).toBe(0);
  });

  it('traduce categorías docentes y recorta etiquetas largas', () => {
    expect(formatCategoryLabel('PRINCIPAL')).toBe('Principal');
    expect(formatCategoryLabel('contratado')).toBe('Contratado');
    expect(formatCategoryLabel('OTRA')).toBe('OTRA');
    expect(formatLongLabel('Facultad de Ingeniería y Arquitectura', 20)).toBe('Facultad de Ingenie…');
    expect(formatLongLabel('Corta', 20)).toBe('Corta');
  });
});
