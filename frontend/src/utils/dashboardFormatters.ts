/**
 * Utilidades puras de presentación del panel institucional.
 * Se mantienen separadas del componente para poder probarlas de forma aislada
 * (TDD) y evitar cálculos duplicados durante el render.
 */

const numberFormatter = new Intl.NumberFormat('es-PE');

/** Formatea un conteo con separador de miles; devuelve un guion si no hay dato. */
export const formatCount = (value?: number | null): string =>
  value == null ? '—' : numberFormatter.format(value);

/** Devuelve el periodo configurado o un texto explícito si no existe. */
export const formatPeriod = (period?: string | null): string => {
  const normalized = period?.trim();
  return normalized ? normalized : 'Periodo no configurado';
};

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Convierte una fecha ISO (`YYYY-MM-DD`) en una etiqueta corta legible.
 * El formateo es manual y en UTC para que el día no cambie según la zona
 * horaria del navegador ni según la versión de ICU del entorno.
 */
export const formatDayLabel = (isoDate?: string | null): string => {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;

  const [year, month, day] = parts.map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) return isoDate;
  if (month < 1 || month > 12 || day < 1 || day > 31) return isoDate;

  return `${String(day).padStart(2, '0')} ${MONTH_LABELS[month - 1]}`;
};

/** Describe cuánto tiempo pasó desde una marca ISO respecto de `now`. */
export const formatRelativeTime = (iso?: string | null, now: Date = new Date()): string => {
  if (!iso) return 'sin datos';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 'sin datos';

  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return 'hace unos segundos';
  if (minutes === 1) return 'hace 1 minuto';
  if (minutes < 60) return `hace ${minutes} minutos`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'hace 1 hora';
  if (hours < 24) return `hace ${hours} horas`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'hace 1 día';
  return `hace ${days} días`;
};

/** Porcentaje entero de `value` sobre `total`; 0 si el total no es válido. */
export const formatPercentage = (value: number, total: number): number =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const CATEGORY_LABELS: Record<string, string> = {
  PRINCIPAL: 'Principal',
  ASOCIADO: 'Asociado',
  AUXILIAR: 'Auxiliar',
  CONTRATADO: 'Contratado',
};

/** Traduce las categorías docentes del dominio a etiquetas legibles. */
export const formatCategoryLabel = (value: string): string =>
  CATEGORY_LABELS[value?.toUpperCase()] ?? value ?? '';

/** Etiqueta compacta para facultades y carreras largas. */
export const formatLongLabel = (value: string, max = 34): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
