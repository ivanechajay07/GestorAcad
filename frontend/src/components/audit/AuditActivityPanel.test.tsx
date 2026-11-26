import { describe, expect, it } from 'vitest';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuditActivityPanel } from './AuditActivityPanel';
import type { AuditSummary } from '../../services/auditService';

const summary: AuditSummary = {
  dias: 7,
  desde: '2026-10-22',
  hasta: '2026-10-28',
  total: 20,
  exitos: 19,
  fallos: 1,
  promedioDiario: 2.86,
  diaMasActivo: '28 oct',
  diaMasActivoFecha: '2026-10-28',
  eventosDiaMasActivo: 12,
  totalPeriodoAnterior: 10,
  variacionPorcentual: 100,
  porDia: [
    { clave: '2026-10-22', etiqueta: '22 oct', total: 0 },
    { clave: '2026-10-23', etiqueta: '23 oct', total: 1 },
    { clave: '2026-10-24', etiqueta: '24 oct', total: 2 },
    { clave: '2026-10-25', etiqueta: '25 oct', total: 0 },
    { clave: '2026-10-26', etiqueta: '26 oct', total: 3 },
    { clave: '2026-10-27', etiqueta: '27 oct', total: 2 },
    { clave: '2026-10-28', etiqueta: '28 oct', total: 12 },
  ],
  porAccion: [
    { clave: 'LOGIN', etiqueta: 'LOGIN', total: 15 },
    { clave: 'CREATE', etiqueta: 'CREATE', total: 5 },
  ],
  generadoEn: '2026-10-28T17:39:53Z',
};

const render = (overrides: Partial<ComponentProps<typeof AuditActivityPanel>> = {}) =>
  renderToStaticMarkup(
    <AuditActivityPanel
      summary={summary}
      loading={false}
      error={null}
      dias={7}
      onSelectDias={() => undefined}
      onReload={() => undefined}
      {...overrides}
    />
  );

describe('AuditActivityPanel', () => {
  it('muestra los indicadores del periodo y la comparación con el periodo anterior', () => {
    const html = render();

    expect(html).toContain('Tendencia de eventos');
    expect(html).toContain('7 días analizados');
    expect(html).toContain('20');
    expect(html).toContain('95 %');
    expect(html).toContain('19 éxitos · 1 fallos');
    expect(html).toContain('2,86');
    expect(html).toContain('28 oct');
    expect(html).toContain('12 eventos · 60 % del periodo');
    expect(html).toContain('+100 % vs. periodo anterior');
  });

  it('marca el periodo activo y ofrece los tres rangos', () => {
    const html = render();

    expect(html).toContain('7 días');
    expect(html).toContain('14 días');
    expect(html).toContain('30 días');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
  });

  it('describe cada barra para lectores de pantalla y teclado', () => {
    const html = render();

    expect(html).toContain('aria-label="28 oct: 12 eventos"');
    expect(html).toContain('aria-label="22 oct: 0 eventos"');
    expect(html).toContain('Eventos de auditoría por día');
    expect(html).toContain('Ingreso');
    expect(html).toContain('75 %');
  });

  it('mantiene el selector visible mientras carga y permite reintentar tras un error', () => {
    const loading = render({ summary: null, loading: true });
    expect(loading).toContain('Calculando indicadores del periodo');

    const error = render({ summary: null, loading: false, error: 'No se pudo cargar el resumen de actividad.' });
    expect(error).toContain('role="alert"');
    expect(error).toContain('Reintentar');
  });

  it('explica el estado vacío sin inventar series', () => {
    const html = render({
      summary: {
        ...summary,
        total: 0,
        exitos: 0,
        fallos: 0,
        promedioDiario: 0,
        diaMasActivo: null,
        diaMasActivoFecha: null,
        eventosDiaMasActivo: 0,
        totalPeriodoAnterior: 0,
        variacionPorcentual: null,
        porDia: summary.porDia.map((day) => ({ ...day, total: 0 })),
        porAccion: [],
      },
    });

    expect(html).toContain('No hay eventos de auditoría en este periodo.');
    expect(html).toContain('Sin actividad');
    expect(html).toContain('Sin actividad en el periodo anterior');
    expect(html).toContain('Sin acciones registradas en el periodo.');
  });
});
