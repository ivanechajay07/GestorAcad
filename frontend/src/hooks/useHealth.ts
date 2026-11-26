import { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/healthService';
import type { SystemHealthData } from '../services/healthService';

interface HealthState {
  data: SystemHealthData | null;
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
  pingResponse: string | null;
}

export const useHealth = () => {
  const [state, setState] = useState<HealthState>({
    data: null,
    loading: true,
    error: null,
    lastChecked: null,
    pingResponse: null,
  });

  const checkHealth = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [healthRes, pingRes] = await Promise.allSettled([
        healthService.getHealth(),
        healthService.ping(),
      ]);

      const data = healthRes.status === 'fulfilled' ? healthRes.value.data : null;
      const ping = pingRes.status === 'fulfilled' ? pingRes.value.data : null;
      const errorMsg = healthRes.status === 'rejected'
        ? (healthRes.reason?.message || 'Error al conectar con el Backend Spring Boot')
        : null;

      setState({
        data,
        loading: false,
        error: errorMsg,
        lastChecked: new Date(),
        pingResponse: ping,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      setState({
        data: null,
        loading: false,
        error: message,
        lastChecked: new Date(),
        pingResponse: null,
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { ...state, refetch: checkHealth };
};
