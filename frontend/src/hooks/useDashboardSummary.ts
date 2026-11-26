import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { DashboardSummary } from '../services/dashboardService';

interface DashboardState {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const INITIAL_STATE: DashboardState = {
  summary: null,
  loading: true,
  error: null,
  lastUpdated: null,
};

/**
 * Carga el resumen agregado del panel y permite reintentar sin recargar la página.
 * Conserva el último resumen válido si un reintento falla.
 */
export const useDashboardSummary = () => {
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    dashboardService
      .getSummary()
      .then((response) => {
        if (!active) return;
        if (!response.success || !response.data) {
          throw new Error(response.message || 'El servidor devolvió un resumen vacío');
        }
        setState({
          summary: response.data,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'No se pudo cargar el panel';
        setState((previous) => ({ ...previous, loading: false, error: message }));
      });

    return () => {
      active = false;
    };
  }, [requestId]);

  const reload = useCallback(() => setRequestId((value) => value + 1), []);

  return { ...state, reload };
};
