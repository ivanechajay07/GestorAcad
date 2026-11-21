import api from './api';
import type { ApiResponse } from './healthService';

export interface AuditLogItem {
  id: number;
  userId?: number;
  username: string;
  action: string;
  module: string;
  description: string;
  endpoint: string;
  httpMethod: string;
  clientIp: string;
  userAgent?: string | null;
  entityName?: string | null;
  entityId?: number | null;
  result: string;
  timestamp: string;
}

/** Conteo agrupado que devuelve el resumen de auditoría. */
export interface AuditCount {
  /** Clave estable: `YYYY-MM-DD` para días o código de acción. */
  clave: string;
  /** Etiqueta legible lista para mostrar. */
  etiqueta: string;
  total: number;
}

/** Resumen agregado de la actividad de auditoría para un periodo móvil. */
export interface AuditSummary {
  dias: number;
  desde: string;
  hasta: string;
  total: number;
  exitos: number;
  fallos: number;
  promedioDiario: number;
  diaMasActivo?: string | null;
  diaMasActivoFecha?: string | null;
  eventosDiaMasActivo: number;
  totalPeriodoAnterior?: number | null;
  variacionPorcentual?: number | null;
  porDia: AuditCount[];
  porAccion: AuditCount[];
  generadoEn: string;
}

export const auditService = {
  async getRecentLogs(): Promise<ApiResponse<AuditLogItem[]>> {
    const response = await api.get<ApiResponse<AuditLogItem[]>>('/v1/audit/recent');
    return response.data;
  },

  async getSummary(dias: number): Promise<ApiResponse<AuditSummary>> {
    const response = await api.get<ApiResponse<AuditSummary>>('/v1/audit/summary', {
      params: { dias },
    });
    return response.data;
  },
};
