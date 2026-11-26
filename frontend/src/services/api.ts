import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';

// Instancia base de Axios con interceptores configurados para JWT y manejo de errores
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

interface ConfiguracionReintentable extends InternalAxiosRequestConfig {
  _reintentado?: boolean;
}

interface RespuestaRefresh {
  success?: boolean;
  data?: {
    token?: string;
    refreshToken?: string;
  };
}

// Interceptor de Peticiones: inyecta el token Bearer vigente
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Una sola renovación simultánea (single-flight): evita múltiples refresh en paralelo
let renovacionEnCurso: Promise<string | null> | null = null;

/**
 * Renueva el token de acceso usando el token de refresco.
 * Devuelve el nuevo token o `null` si no fue posible renovarlo.
 */
export const renovarTokenAcceso = (): Promise<string | null> => {
  if (renovacionEnCurso) {
    return renovacionEnCurso;
  }

  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return Promise.resolve(null);
  }

  const peticion = axios
    // Se usa axios directo para no interceptar la propia llamada de refresh.
    .post<RespuestaRefresh>(`${API_BASE_URL}/v1/auth/refresh`, { refreshToken })
    .then((respuesta) => {
      const datos = respuesta.data?.data;
      if (!respuesta.data?.success || !datos?.token) {
        return null;
      }
      tokenStorage.saveTokens(datos.token, datos.refreshToken ?? refreshToken, tokenStorage.isPersistent());
      window.dispatchEvent(new CustomEvent('gestoracad:token-renovado', { detail: datos.token }));
      return datos.token;
    })
    .catch(() => null);

  renovacionEnCurso = peticion;
  void peticion.finally(() => {
    renovacionEnCurso = null;
  });
  return peticion;
};

const cerrarSesionLocal = (): void => {
  tokenStorage.clear();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
};

// Interceptor de Respuestas: ante un 401 intenta renovar una vez y reintenta;
// si la renovación falla, limpia la sesión y redirige al login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config as ConfiguracionReintentable | undefined;
    const url = original?.url ?? '';
    const esEndpointAutenticacion =
      url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    if (status === 401 && original && !esEndpointAutenticacion) {
      if (!original._reintentado) {
        original._reintentado = true;
        const nuevoToken = await renovarTokenAcceso();
        if (nuevoToken) {
          original.headers.Authorization = `Bearer ${nuevoToken}`;
          return api(original);
        }
      }
      cerrarSesionLocal();
    }

    return Promise.reject(error);
  }
);

export default api;
