import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { notificationService } from './notificationService';
import type { AppNotification } from './notificationService';

vi.mock('./api', () => ({
  default: { get: vi.fn() },
}));

const notifications: AppNotification[] = [
  {
    id: 'periodo-2026-i',
    tipo: 'info',
    titulo: 'Periodo 2026-I activo',
    detalle: 'El periodo académico vigente se encuentra configurado en el sistema.',
    enlace: '/university',
    fecha: '2026-10-28T16:00:00',
  },
];

describe('notificationService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('consulta el endpoint agregado de avisos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, message: 'ok', data: notifications, timestamp: '2026-10-28T16:00:00' },
    } as never);

    const response = await notificationService.getNotifications();

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/v1/notifications');
    expect(response.success).toBe(true);
    expect(response.data[0].titulo).toBe('Periodo 2026-I activo');
    expect(response.data[0].enlace).toBe('/university');
  });

  it('propaga el error cuando la petición falla', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network Error'));

    await expect(notificationService.getNotifications()).rejects.toThrow('Network Error');
  });
});
