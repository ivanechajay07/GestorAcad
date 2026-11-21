import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PageSkeleton } from './PageSkeleton';

describe('PageSkeleton', () => {
  it('anuncia la carga y mantiene la estructura de página', () => {
    const html = renderToStaticMarkup(<PageSkeleton />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Cargando módulo');
    expect(html).toContain('page-skeleton__header');
    expect(html).toContain('page-skeleton__cards');
    expect(html).toContain('page-skeleton__panel');
  });
});
