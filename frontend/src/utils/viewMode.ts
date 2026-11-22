/**
 * Vista inicial de los listados: tabla solo cuando hay ancho suficiente
 * para que todas las columnas respiren; tarjetas en tablet y portátiles.
 * Se evalúa una sola vez al montar el componente.
 */
export type ListViewMode = 'cards' | 'table';

export const defaultListViewMode = (): ListViewMode => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'cards';
  }
  return window.matchMedia('(min-width: 1400px)').matches ? 'table' : 'cards';
};
