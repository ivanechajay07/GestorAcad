interface LoginErrorShape {
  response?: { status?: number; data?: { message?: string } };
  message?: string;
}

/**
 * Traduce los errores del servicio de autenticación a mensajes claros para el
 * usuario, sin exponer detalles técnicos de la petición.
 */
export const resolveLoginError = (err: unknown): string => {
  const apiError = err as LoginErrorShape;
  if (!apiError || !apiError.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
  }
  const message = apiError.response.data?.message;
  if (message) return message;
  switch (apiError.response.status) {
    case 401:
      return 'Usuario o contraseña incorrectos.';
    case 423:
      return 'La cuenta está bloqueada temporalmente por intentos fallidos.';
    case 429:
      return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
    default:
      return apiError.message || 'No se pudo iniciar sesión. Inténtalo nuevamente.';
  }
};
