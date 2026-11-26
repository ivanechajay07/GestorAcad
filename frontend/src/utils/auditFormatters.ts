import { formatRelativeTime } from './dashboardFormatters';

/**
 * Utilidades de presentación del módulo de auditoría.
 * <p>
 * La bitácora se almacena en UTC; la interfaz la muestra en la zona horaria
 * institucional (America/Lima) para que la fecha y la hora coincidan con el
 * reloj del campus y no dependan del equipo del visitante.
 */

export const AUDIT_TIME_ZONE = 'America/Lima';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  LOGIN: 'Ingreso',
  LOGOUT: 'Salida',
  VIEW: 'Consulta',
  EXPORT: 'Exportación',
  IMPORT: 'Importación',
};

export type AuditActionTone = 'success' | 'warning' | 'danger' | 'role' | 'info';

const ACTION_TONES: Record<string, AuditActionTone> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'danger',
  LOGIN: 'role',
  LOGOUT: 'role',
  VIEW: 'info',
};

/** Traduce la acción técnica a una etiqueta legible. */
export const formatAuditAction = (action?: string | null): string => {
  if (!action) return 'Sin acción';
  const key = action.toUpperCase();
  return ACTION_LABELS[key] ?? action;
};

/** Color del distintivo según la naturaleza de la acción. */
export const auditActionTone = (action?: string | null): AuditActionTone =>
  ACTION_TONES[action?.toUpperCase() ?? ''] ?? 'info';

/** Etiqueta e indicador visual del resultado de la operación. */
export const formatAuditResult = (result?: string | null): { label: string; ok: boolean } => {
  const ok = (result ?? '').toUpperCase() === 'SUCCESS';
  return { label: ok ? 'Éxito' : 'Falló', ok };
};

interface InstantParts {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  second: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: AUDIT_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: AUDIT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const part = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
  parts.find((item) => item.type === type)?.value ?? '';

const toDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const instantParts = (value?: string | Date | null): InstantParts | null => {
  const date = toDate(value);
  if (!date) return null;
  const parts = dateTimeFormatter.formatToParts(date);
  return {
    day: part(parts, 'day'),
    month: part(parts, 'month').replace(/\.$/, ''),
    year: part(parts, 'year'),
    hour: part(parts, 'hour'),
    minute: part(parts, 'minute'),
    second: part(parts, 'second'),
  };
};

/** Fecha exacta en la zona institucional, por ejemplo `28 oct 2026`. */
export const formatAuditDate = (value?: string | Date | null): string => {
  const parts = instantParts(value);
  return parts ? `${parts.day} ${parts.month} ${parts.year}` : '—';
};

/** Hora exacta con segundos en la zona institucional, por ejemplo `12:17:58`. */
export const formatAuditTime = (value?: string | Date | null): string => {
  const parts = instantParts(value);
  return parts ? `${parts.hour}:${parts.minute}:${parts.second}` : '—';
};

/** Texto relativo respecto de `now` (`hace 2 minutos`, `hace 1 hora`, …). */
export const formatAuditRelative = (value?: string | null, now: Date = new Date()): string => {
  if (!value) return 'sin fecha';
  return formatRelativeTime(value, now);
};

/** Clave `YYYY-MM-DD` en la zona institucional, útil para agrupar por día. */
export const auditDateKey = (value?: string | Date | null): string => {
  const date = toDate(value);
  return date ? dateKeyFormatter.format(date) : '';
};

/** Etiqueta corta de un día (`28 oct`) en la zona institucional. */
export const auditDayLabel = (value: string | Date): string => {
  const parts = instantParts(value);
  return parts ? `${parts.day} ${parts.month}` : '—';
};

/** IP y clasificación de red para la columna «Dispositivo / IP». */
export const describeClientIp = (ip?: string | null): { value: string; network?: string } => {
  const value = (ip ?? '').trim();
  if (!value) return { value: 'No registrada' };

  const normalized = value === '0:0:0:0:0:0:0:1' ? '::1' : value;
  if (normalized === '::1' || normalized === '127.0.0.1') {
    return { value: normalized, network: 'equipo local' };
  }
  if (/^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(normalized)
      || /^(fc|fd|fe80)/i.test(normalized)) {
    return { value: normalized, network: 'red interna' };
  }
  return { value: normalized };
};

export interface ClientDevice {
  browser: string;
  os: string;
  /** Texto compacto listo para la tabla, por ejemplo `Chrome · Windows 11`. */
  label: string;
}

/**
 * Resume el `User-Agent` en navegador y sistema operativo.
 * No usa librerías externas: los patrones cubren navegadores de escritorio,
 * móviles y clientes técnicos (Postman, cURL, PowerShell).
 */
export const describeUserAgent = (userAgent?: string | null): ClientDevice => {
  const value = (userAgent ?? '').trim();
  if (!value) {
    return { browser: 'Desconocido', os: '', label: 'Desconocido' };
  }

  let browser = 'Navegador';
  if (/Edg\//i.test(value)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(value)) browser = 'Opera';
  else if (/Chrome\//i.test(value)) browser = 'Chrome';
  else if (/Firefox\//i.test(value)) browser = 'Firefox';
  else if (/Safari\//i.test(value)) browser = 'Safari';
  else if (/PostmanRuntime/i.test(value)) browser = 'Postman';
  else if (/PowerShell/i.test(value)) browser = 'PowerShell';
  else if (/curl\//i.test(value)) browser = 'cURL';
  else if (/python-requests/i.test(value)) browser = 'Python';
  else if (/okhttp/i.test(value)) browser = 'OkHttp';
  else if (/Java\//i.test(value)) browser = 'Java';

  let os = '';
  if (/Windows NT 10/i.test(value)) os = 'Windows 10/11';
  else if (/Windows NT 6\.3/i.test(value)) os = 'Windows 8.1';
  else if (/Windows NT/i.test(value)) os = 'Windows';
  else if (/Android/i.test(value)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(value)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(value)) os = 'macOS';
  else if (/Linux/i.test(value)) os = 'Linux';

  return { browser, os, label: os ? `${browser} · ${os}` : browser };
};
