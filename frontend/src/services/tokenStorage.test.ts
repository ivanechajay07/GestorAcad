import { beforeEach, describe, expect, it } from 'vitest';
import { CLAVES_SESION, tokenStorage } from './tokenStorage';

const usuario = {
  id: 1,
  username: 'admin.rectoria',
  email: 'admin@gestoracad.edu',
  fullName: 'Admin Rectoría',
  roles: ['ROLE_UNIVERSIDAD'],
  permissions: ['USUARIO_VIEW'],
};

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('guarda los tokens en localStorage cuando la sesión es persistente', () => {
    tokenStorage.saveTokens('acceso', 'refresco', true);

    expect(localStorage.getItem(CLAVES_SESION.accessToken)).toBe('acceso');
    expect(localStorage.getItem(CLAVES_SESION.refreshToken)).toBe('refresco');
    expect(sessionStorage.getItem(CLAVES_SESION.accessToken)).toBeNull();
    expect(tokenStorage.isPersistent()).toBe(true);
  });

  it('guarda los tokens en sessionStorage cuando no se recuerda la sesión', () => {
    tokenStorage.saveTokens('acceso', 'refresco', false);

    expect(sessionStorage.getItem(CLAVES_SESION.accessToken)).toBe('acceso');
    expect(sessionStorage.getItem(CLAVES_SESION.refreshToken)).toBe('refresco');
    expect(localStorage.getItem(CLAVES_SESION.accessToken)).toBeNull();
    expect(tokenStorage.isPersistent()).toBe(false);
  });

  it('elimina la copia anterior al cambiar de almacén', () => {
    tokenStorage.saveTokens('acceso-local', 'refresco-local', true);
    tokenStorage.saveTokens('acceso-sesion', 'refresco-sesion', false);

    expect(localStorage.getItem(CLAVES_SESION.accessToken)).toBeNull();
    expect(sessionStorage.getItem(CLAVES_SESION.accessToken)).toBe('acceso-sesion');
    expect(tokenStorage.getAccessToken()).toBe('acceso-sesion');
  });

  it('recupera los tokens desde cualquiera de los dos almacenes', () => {
    localStorage.setItem(CLAVES_SESION.accessToken, 'solo-local');

    expect(tokenStorage.getAccessToken()).toBe('solo-local');
  });

  it('clear elimina todos los datos de sesión de ambos almacenes', () => {
    tokenStorage.saveTokens('acceso', 'refresco', true);
    tokenStorage.saveUser(usuario, true);
    sessionStorage.setItem(CLAVES_SESION.user, JSON.stringify(usuario));

    tokenStorage.clear();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(tokenStorage.getUser()).toBeNull();
    expect(tokenStorage.isPersistent()).toBe(false);
  });

  it('saveUser y getUser conservan el perfil con roles y permisos', () => {
    tokenStorage.saveTokens('acceso', 'refresco', true);
    tokenStorage.saveUser(usuario);

    const recuperado = tokenStorage.getUser<{
      username: string;
      roles: string[];
      permissions: string[];
    }>();

    expect(recuperado?.username).toBe('admin.rectoria');
    expect(recuperado?.roles).toEqual(['ROLE_UNIVERSIDAD']);
    expect(recuperado?.permissions).toEqual(['USUARIO_VIEW']);
  });

  it('getUser devuelve null si el JSON almacenado es inválido', () => {
    localStorage.setItem(CLAVES_SESION.user, '{no-es-json');

    expect(tokenStorage.getUser()).toBeNull();
  });

  it('getUser devuelve null si el objeto no tiene username', () => {
    localStorage.setItem(CLAVES_SESION.user, JSON.stringify({ id: 5 }));

    expect(tokenStorage.getUser()).toBeNull();
  });
});
