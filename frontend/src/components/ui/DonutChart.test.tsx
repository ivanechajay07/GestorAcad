import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DonutChart } from './DonutChart';

describe('DonutChart', () => {
  it('expone proporciones, porcentajes y leyenda accesible', () => {
    const html = renderToStaticMarkup(
      <DonutChart
        items={[
          { label: 'Facultad de Ingeniería', value: 3, color: 'var(--primary)' },
          { label: 'Facultad de Salud', value: 2, color: 'var(--accent-cyan)' },
        ]}
        unit="est."
        ariaLabel="Estudiantes activos por facultad"
        centerLabel="Composición"
        centerValue="100%"
      />
    );

    expect(html).toContain('role="group"');
    expect(html).toContain('Facultad de Ingeniería');
    expect(html).toContain('3 est.');
    expect(html).toContain('60%');
    expect(html).toContain('40%');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Facultad de Ingeniería: 3 est. (60%)"');
    expect(html).toContain('Composición');
    expect(html).toContain('100%');
  });

  it('muestra un estado vacío claro', () => {
    const html = renderToStaticMarkup(
      <DonutChart
        items={[]}
        unit="doc."
        ariaLabel="Docentes por categoría"
        emptyMessage="Sin docentes activos para graficar."
      />
    );

    expect(html).toContain('Sin docentes activos para graficar.');
    expect(html).not.toContain('role="group"');
  });
});
