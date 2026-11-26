import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DistributionChart } from './DistributionChart';

describe('DistributionChart', () => {
  it('muestra la vista lineal por defecto con etiquetas completas', () => {
    const html = renderToStaticMarkup(
      <DistributionChart
        title="Docentes por facultad"
        subtitle="Claustro activo adscrito a cada facultad"
        icon={null}
        items={[
          { label: 'Fac. de Ingeniería', fullLabel: 'Facultad de Ingeniería', value: 3 },
          { label: 'Fac. de Salud', fullLabel: 'Facultad de Salud', value: 2 },
        ]}
        unit="doc."
        seriesName="Docentes"
        ariaLabel="Docentes activos por facultad"
      />
    );

    expect(html).toContain('class="line-chart"');
    expect(html).not.toContain('class="bar-chart"');
    expect(html).toContain('Línea');
    expect(html).toContain('Barras');
    expect(html).toContain('Facultad de Ingeniería');
    expect(html).toContain('3 doc.');
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-pressed="true"');
  });

  it('mantiene un mensaje vacío cuando no hay datos', () => {
    const html = renderToStaticMarkup(
      <DistributionChart
        title="Matrícula por ciclo"
        subtitle="Sin datos"
        icon={null}
        items={[]}
        unit="est."
        seriesName="Estudiantes"
        ariaLabel="Estudiantes activos por ciclo académico"
        emptyMessage="Sin estudiantes activos para graficar por ciclo."
      />
    );

    expect(html).toContain('Sin estudiantes activos para graficar por ciclo.');
    expect(html).not.toContain('role="group"');
  });
});
