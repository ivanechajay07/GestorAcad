import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LineChart } from './LineChart';

describe('LineChart', () => {
  it('incluye título, descripción y tabla equivalente accesible', () => {
    const html = renderToStaticMarkup(
      <LineChart
        labels={['27 oct', '28 oct']}
        series={[{ name: 'Eventos', color: 'var(--accent-emerald)', values: [2, 4] }]}
        suffix=" ev."
        title="Eventos de auditoría por día"
        description="Serie de los últimos 2 días."
      />
    );

    expect(html).toContain('aria-labelledby');
    expect(html).toContain('Eventos de auditoría por día');
    expect(html).toContain('Serie de los últimos 2 días.');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('<table>');
    expect(html).toContain('27 oct');
    expect(html).toContain('2 ev.');
    expect(html).toContain('4 ev.');
  });

  it('muestra el mensaje vacío cuando no hay serie', () => {
    const html = renderToStaticMarkup(
      <LineChart labels={[]} series={[]} emptyMessage="Aún no hay eventos." />
    );

    expect(html).toContain('Aún no hay eventos.');
  });
});
