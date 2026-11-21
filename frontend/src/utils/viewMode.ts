/**
 * Vista inicial de los listados: tabla en escritorio, tarjetas en móvil.
 * Se evalúa una sola vez al montar el componente.
 */
export type ListViewMode = 'cards' | 'table';

export const defaultListViewMode = (): ListViewMode => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'cards';
  }
  return window.matchMedia('(min-width: 1024px)').matches ? 'table' : 'cards';
};
