import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import type { AppNotification } from '../services/notificationService';
import {
  loadReadNotificationIds,
  saveReadNotificationIds,
} from '../utils/notificationReadState';

interface NotificationsState {
  notifications: AppNotification[];
  loading: boolean;
  error: string | null;
  readIds: string[];
  lastUpdated: Date | null;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Carga los avisos agregados del encabezado y conserva el estado "leído" por
 * usuario en el almacenamiento local. Si una actualización falla, mantiene el
 * último listado válido para no vaciar el panel.
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    loading: true,
    error: null,
    readIds: [],
    lastUpdated: null,
  });
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    setState((previous) => ({
      ...previous,
      readIds: userId == null ? [] : loadReadNotificationIds(userId),
    }));
  }, [userId]);

  useEffect(() => {
    if (userId == null) {
      setState((previous) => ({ ...previous, loading: false }));
      return;
    }

    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    notificationService
      .getNotifications()
      .then((response) => {
        if (!active) return;
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'El servidor devolvió avisos inválidos');
        }
        const notifications = response.data;
        setState((previous) => {
          const validIds = new Set(notifications.map((notification) => notification.id));
          const storedReadIds = loadReadNotificationIds(userId);
          const readIds = Array.from(new Set([...previous.readIds, ...storedReadIds]))
            .filter((id) => validIds.has(id));
          saveReadNotificationIds(userId, readIds);
          return {
            notifications,
            loading: false,
            error: null,
            readIds,
            lastUpdated: new Date(),
          };
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'No se pudieron cargar los avisos';
        setState((previous) => ({ ...previous, loading: false, error: message }));
      });

    return () => {
      active = false;
    };
  }, [userId, requestId]);

  useEffect(() => {
    if (userId == null) return;
    const timer = window.setInterval(() => setRequestId((value) => value + 1), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [userId]);

  const reload = useCallback(() => setRequestId((value) => value + 1), []);

  const markAsRead = useCallback(
    (id: string) => {
      if (!id) return;
      setState((previous) => {
        if (previous.readIds.includes(id)) return previous;
        const readIds = [...previous.readIds, id];
        if (userId != null) saveReadNotificationIds(userId, readIds);
        return { ...previous, readIds };
      });
    },
    [userId]
  );

  const markAllAsRead = useCallback(() => {
    setState((previous) => {
      const readIds = Array.from(new Set([
        ...previous.readIds,
        ...previous.notifications.map((notification) => notification.id),
      ]));
      if (userId != null) saveReadNotificationIds(userId, readIds);
      return { ...previous, readIds };
    });
  }, [userId]);

  const unreadCount = useMemo(
    () => state.notifications.filter((notification) => !state.readIds.includes(notification.id)).length,
    [state.notifications, state.readIds]
  );

  return {
    ...state,
    unreadCount,
    reload,
    markAsRead,
    markAllAsRead,
  };
};
