/**
 * Utilidades para interpretar los errores de la API.
 *
 * El backend responde con un mensaje general y, cuando falla la validación
 * de Bean Validation, con un mapa `errors` campo -> mensaje. Estas funciones
 * permiten mostrar el detalle por campo en lugar de un aviso genérico.
 */
export interface ApiErrorData {
  message?: string;
  errors?: Record<string, string>;
}

interface ApiErrorShape {
  response?: { data?: ApiErrorData };
}

const readErrorData = (err: unknown): ApiErrorData | undefined => {
  if (!err || typeof err !== 'object') return undefined;
  return (err as ApiErrorShape).response?.data;
};

/** Devuelve el mapa de errores por campo enviado por el backend. */
export const getApiFieldErrors = (err: unknown): Record<string, string> => {
  const errors = readErrorData(err)?.errors;
  if (!errors || typeof errors !== 'object') return {};

  return Object.entries(errors).reduce<Record<string, string>>((acc, [field, message]) => {
    if (typeof message === 'string' && message.trim()) acc[field] = message;
    return acc;
  }, {});
};

/**
 * Devuelve el mensaje más útil para el usuario:
 * 1. El primer error de validación por campo, si existe.
 * 2. El mensaje general de la API.
 * 3. El mensaje del error local o el texto de respaldo.
 */
export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const fieldErrors = getApiFieldErrors(err);
  const firstFieldMessage = Object.values(fieldErrors)[0];
  if (firstFieldMessage) return firstFieldMessage;

  const message = readErrorData(err)?.message;
  if (message) return message;

  return err instanceof Error ? err.message : fallback;
};
