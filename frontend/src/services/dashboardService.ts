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

/** Pendientes accionables calculados por el servidor. */
export interface DashboardManagement {
  estudiantesSinCuenta?: number | null;
  docentesSinCuenta?: number | null;
  estudiantesSinFoto?: number | null;
  docentesSinFoto?: number | null;
  cuentasBloqueadas?: number | null;
  estudiantesObservados?: number | null;
  estudiantesBajoPromedio?: number | null;
}

/** Estado operativo del periodo académico actual. */
export interface DashboardPeriod {
  codigo?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  secciones?: number | null;
  capacidad?: number | null;
  matriculas?: number | null;
  cuposDisponibles?: number | null;
  estudiantesSinMatricula?: number | null;
  seccionesSinDocente?: number | null;
  avance?: number | null;
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
  gestion?: DashboardManagement | null;
  periodo?: DashboardPeriod | null;
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
