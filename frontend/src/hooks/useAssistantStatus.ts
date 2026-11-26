import { useEffect, useState } from 'react';
import { knowledgeService } from '../services/knowledgeService';
import type { AssistantStatusDto } from '../services/knowledgeService';

/**
 * Obtiene el modo activo del asistente: búsqueda local o GPT con fuentes.
 * Si el endpoint no responde, la interfaz mantiene el modo local como seguro.
 */
export const useAssistantStatus = (): AssistantStatusDto | null => {
  const [status, setStatus] = useState<AssistantStatusDto | null>(null);

  useEffect(() => {
    let mounted = true;
    knowledgeService
      .status()
      .then((response) => {
        if (mounted) setStatus(response.data);
      })
      .catch(() => {
        if (mounted) setStatus(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return status;
};
