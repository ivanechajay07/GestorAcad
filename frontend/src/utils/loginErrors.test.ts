import { describe, expect, it } from 'vitest';
import { resolveLoginError } from './loginErrors';

describe('resolveLoginError', () => {
  it('prioriza el mensaje de negocio enviado por la API', () => {
    expect(
      resolveLoginError({
        response: { status: 401, data: { message: 'Credenciales inválidas o usuario inactivo' } },
      })
    ).toBe('Credenciales inválidas o usuario inactivo');
  });

  it('explica los intentos fallidos y el bloqueo temporal', () => {
    expect(resolveLoginError({ response: { status: 429 } })).toContain('Demasiados intentos');
    expect(resolveLoginError({ response: { status: 423 } })).toContain('bloqueada temporalmente');
  });

  it('informa credenciales incorrectas cuando no hay mensaje', () => {
    expect(resolveLoginError({ response: { status: 401 } })).toBe('Usuario o contraseña incorrectos.');
  });

  it('distingue un fallo de conexión de un error de credenciales', () => {
    expect(resolveLoginError(new Error('Network Error'))).toContain('No se pudo conectar con el servidor');
    expect(resolveLoginError(null)).toContain('No se pudo conectar con el servidor');
  });

  it('conserva el mensaje técnico como último recurso', () => {
    expect(resolveLoginError({ response: { status: 500 }, message: 'Error interno' })).toBe('Error interno');
  });
});
