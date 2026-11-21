import api from './api';
import type { ApiResponse } from './healthService';

/** Métrica agregada con total y registros activos. */
export interface DashboardMetric {
  total: number;
  activos: number;
}

/** Conteo agrupado por etiqueta (facultad, carrera, ciclo, categoría o día). */
export interface DashboardCount {
  etiqueta: string;
  total: number;
}

export interface DashboardInstitution {
  nombre?: string | null;
  nombreCorto?: string | null;
  periodo?: string | null;
  estadoLicenciamiento?: string | null;
  sedesActivas?: number | null;
}

export interface DashboardAudit {
  eventosTotales: number;
  eventosPorDia: DashboardCount[];
}

/**
 * Resumen agregado del panel institucional.
 * Los bloques son `null` cuando el usuario no tiene el permiso del módulo;
 * el frontend debe omitirlos en ese caso.
 */
export interface DashboardSummary {
  institucion: DashboardInstitution;
  estudiantes?: DashboardMetric | null;
  docentes?: DashboardMetric | null;
  usuarios?: DashboardMetric | null;
  facultades?: number | null;
  carreras?: number | null;
  auditoria?: DashboardAudit | null;
  estudiantesPorCiclo?: DashboardCount[] | null;
  estudiantesPorFacultad?: DashboardCount[] | null;
  estudiantesPorCarrera?: DashboardCount[] | null;
  docentesPorCategoria?: DashboardCount[] | null;
  docentesPorFacultad?: DashboardCount[] | null;
  generadoEn: string;
}

export const dashboardService = {
  async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    const response = await api.get<ApiResponse<DashboardSummary>>('/v1/dashboard/summary');
    return response.data;
  },
};
