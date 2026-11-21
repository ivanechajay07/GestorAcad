/**
 * Almacenamiento unificado de la sesión en el navegador.
 *
 * Si el usuario marca "Mantener sesión activa" los tokens se guardan en
 * `localStorage` (persisten al cerrar el navegador). En caso contrario se usa
 * `sessionStorage`, de modo que la sesión desaparece al cerrar la pestaña.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */

const ACCESS_TOKEN_KEY = 'gestoracad_token';
const REFRESH_TOKEN_KEY = 'gestoracad_refresh_token';
const USER_KEY = 'gestoracad_user';
const REMEMBER_KEY = 'gestoracad_remember';

const almacenes = (): Storage[] => [localStorage, sessionStorage];

const leerDeAmbos = (clave: string): string | null => {
  for (const almacen of almacenes()) {
    const valor = almacen.getItem(clave);
    if (valor) return valor;
  }
  return null;
};

const eliminarDeAmbos = (clave: string): void => {
  for (const almacen of almacenes()) {
    almacen.removeItem(clave);
  }
};

const almacenPara = (persistente: boolean): Storage => (persistente ? localStorage : sessionStorage);

const esPersistente = (): boolean => leerDeAmbos(REMEMBER_KEY) === 'true';

export const tokenStorage = {
  /** Indica si la sesión se guardó de forma persistente. */
  isPersistent(): boolean {
    return esPersistente();
  },

  getAccessToken(): string | null {
    return leerDeAmbos(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return leerDeAmbos(REFRESH_TOKEN_KEY);
  },

  /** Guarda el par de tokens (acceso + refresco) en el almacén elegido. */
  saveTokens(accessToken: string, refreshToken: string | undefined, persistente: boolean): void {
    const almacen = almacenPara(persistente);
    eliminarDeAmbos(ACCESS_TOKEN_KEY);
    eliminarDeAmbos(REFRESH_TOKEN_KEY);
    almacen.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      almacen.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    almacen.setItem(REMEMBER_KEY, String(persistente));
  },

  getUser<T extends { username: string } = { username: string }>(): T | null {
    const guardado = leerDeAmbos(USER_KEY);
    if (!guardado) return null;
    try {
      const parseado = JSON.parse(guardado) as T | null;
      if (!parseado || typeof parseado.username !== 'string') return null;
      return parseado;
    } catch {
      return null;
    }
  },

  saveUser(user: { username: string } | null, persistente: boolean = esPersistente()): void {
    eliminarDeAmbos(USER_KEY);
    if (user) {
      almacenPara(persistente).setItem(USER_KEY, JSON.stringify(user));
    }
  },

  /** Elimina todos los datos de sesión de ambos almacenes. */
  clear(): void {
    eliminarDeAmbos(ACCESS_TOKEN_KEY);
    eliminarDeAmbos(REFRESH_TOKEN_KEY);
    eliminarDeAmbos(USER_KEY);
    eliminarDeAmbos(REMEMBER_KEY);
  },
};

export const CLAVES_SESION = {
  accessToken: ACCESS_TOKEN_KEY,
  refreshToken: REFRESH_TOKEN_KEY,
  user: USER_KEY,
  remember: REMEMBER_KEY,
} as const;
