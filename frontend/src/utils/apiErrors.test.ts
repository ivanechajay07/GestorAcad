import { describe, expect, it } from 'vitest';
import { getApiErrorMessage, getApiFieldErrors } from './apiErrors';

describe('apiErrors', () => {
  it('extrae el mapa de errores por campo', () => {
    const error = {
      response: {
        data: {
          message: 'Uno o más campos contienen valores inválidos',
          errors: { code: 'El código es obligatorio', email: 'Correo inválido' },
        },
      },
    };
    expect(getApiFieldErrors(error)).toEqual({
      code: 'El código es obligatorio',
      email: 'Correo inválido',
    });
  });

  it('prioriza el primer error de campo sobre el mensaje general', () => {
    const error = {
      response: {
        data: {
          message: 'Error de validación',
          errors: { code: 'El código es obligatorio' },
        },
      },
    };
    expect(getApiErrorMessage(error, 'Error')).toBe('El código es obligatorio');
  });

  it('usa el mensaje general cuando no hay errores por campo', () => {
    const error = { response: { data: { message: 'El rol ya existe' } } };
    expect(getApiErrorMessage(error, 'Error')).toBe('El rol ya existe');
  });

  it('devuelve el respaldo si el error no tiene respuesta', () => {
    expect(getApiFieldErrors(new Error('fallo de red'))).toEqual({});
    expect(getApiErrorMessage(new Error('fallo de red'), 'Respaldo')).toBe('fallo de red');
    expect(getApiErrorMessage(null, 'Respaldo')).toBe('Respaldo');
  });
});
