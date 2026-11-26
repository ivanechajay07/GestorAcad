/**
 * Persistencia local del estado "leído" de los avisos del encabezado.
 * Se aísla de React para poder probar el comportamiento con TDD.
 */

export const NOTIFICATION_READ_PREFIX = 'gestoracad:notificaciones-leidas:';

/** Clave de almacenamiento por usuario: evita mezclar avisos entre sesiones. */
export const notificationReadKey = (userId: number | string): string =>
  `${NOTIFICATION_READ_PREFIX}${userId}`;

/** Elimina duplicados y valores vacíos antes de persistir. */
export const normalizeReadIds = (ids: readonly string[]): string[] =>
  Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.trim().length > 0)));

const resolveStorage = (storage?: Storage): Storage | null => {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

export const loadReadNotificationIds = (
  userId: number | string,
  storage?: Storage
): string[] => {
  const target = resolveStorage(storage);
  if (!target) return [];
  try {
    const raw = target.getItem(notificationReadKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeReadIds(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return [];
  }
};

export const saveReadNotificationIds = (
  userId: number | string,
  ids: readonly string[],
  storage?: Storage
): void => {
  const target = resolveStorage(storage);
  if (!target) return;
  try {
    target.setItem(notificationReadKey(userId), JSON.stringify(normalizeReadIds(ids)));
  } catch {
    // El almacenamiento puede estar lleno o bloqueado; los avisos siguen funcionando.
  }
};
