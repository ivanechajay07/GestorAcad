import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock('./api', () => ({ default: mocks }));

import { authService } from './authService';

describe('authService', () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.get.mockReset();
    mocks.put.mockReset();
    mocks.post.mockResolvedValue({ data: { success: true, data: null } });
  });

  it('envía el token de refresco al endpoint /v1/auth/refresh', async () => {
    mocks.post.mockResolvedValue({
      data: { success: true, data: { token: 'nuevo', refreshToken: 'nuevo-refresco' } },
    });

    const respuesta = await authService.refresh('refresco-actual');

    expect(mocks.post).toHaveBeenCalledWith('/v1/auth/refresh', { refreshToken: 'refresco-actual' });
    expect(respuesta.data?.token).toBe('nuevo');
  });

  it('incluye el token de refresco en el cuerpo del logout', async () => {
    await authService.logout('refresco-actual');

    expect(mocks.post).toHaveBeenCalledWith('/v1/auth/logout', { refreshToken: 'refresco-actual' });
  });

  it('no envía cuerpo en el logout si no hay token de refresco', async () => {
    await authService.logout();

    expect(mocks.post).toHaveBeenCalledWith('/v1/auth/logout', undefined);
  });

  it('publica el usernameOrEmail y la contraseña en el login', async () => {
    await authService.login({ usernameOrEmail: 'admin.rectoria', password: 'ClaveSegura2026!' });

    expect(mocks.post).toHaveBeenCalledWith('/v1/auth/login', {
      usernameOrEmail: 'admin.rectoria',
      password: 'ClaveSegura2026!',
    });
  });
});
