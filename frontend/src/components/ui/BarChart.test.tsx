import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BarChart } from './BarChart';

describe('BarChart', () => {
  it('expone etiquetas y valores como texto accesible', () => {
    const html = renderToStaticMarkup(
      <BarChart
        items={[
          { label: 'Ciclo 1', value: 3 },
          { label: 'Ciclo 2', value: 5 },
        ]}
        unit="est."
        ariaLabel="Estudiantes por ciclo"
      />
    );

    expect(html).toContain('role="list"');
    expect(html).toContain('aria-label="Estudiantes por ciclo"');
    expect(html).toContain('Ciclo 1');
    expect(html).toContain('Ciclo 2');
    expect(html).toContain('3 est.');
    expect(html).toContain('5 est.');
  });

  it('muestra un mensaje cuando no hay datos', () => {
    const html = renderToStaticMarkup(
      <BarChart items={[]} ariaLabel="Sin datos" emptyMessage="Nada que graficar." />
    );

    expect(html).toContain('Nada que graficar.');
    expect(html).not.toContain('role="list"');
  });
});
