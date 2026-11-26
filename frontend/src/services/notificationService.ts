import api from './api';
import type { ApiResponse } from './healthService';

/** Tono visual de un aviso del encabezado. */
export type NotificationTone = 'info' | 'exito' | 'advertencia';

/** Aviso agregado devuelto por el backend; nunca contiene datos personales. */
export interface AppNotification {
  id: string;
  tipo: NotificationTone;
  titulo: string;
  detalle: string;
  enlace?: string | null;
  fecha: string;
}

export const notificationService = {
  async getNotifications(): Promise<ApiResponse<AppNotification[]>> {
    const response = await api.get<ApiResponse<AppNotification[]>>('/v1/notifications');
    return response.data;
  },
};
