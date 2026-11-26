import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { dashboardService } from './dashboardService';
import type { DashboardSummary } from './dashboardService';

vi.mock('./api', () => ({
  default: { get: vi.fn() },
}));

const summary: DashboardSummary = {
  institucion: {
    nombre: 'Universidad Nacional de Innovación & Tecnología',
    nombreCorto: 'UNINTEP',
    periodo: '2026-I',
    estadoLicenciamiento: 'LICENCIADA',
    sedesActivas: 3,
  },
  estudiantes: { total: 6, activos: 6 },
  docentes: { total: 5, activos: 5 },
  usuarios: { total: 3, activos: 3 },
  facultades: 4,
  carreras: 5,
  auditoria: {
    eventosTotales: 8,
    eventosPorDia: [{ etiqueta: '2026-10-28', total: 8 }],
  },
  estudiantesPorCiclo: [{ etiqueta: 'Ciclo 3', total: 1 }],
  estudiantesPorFacultad: [{ etiqueta: 'Facultad de Ingeniería', total: 2 }],
  estudiantesPorCarrera: [{ etiqueta: 'Ingeniería de Sistemas', total: 1 }],
  docentesPorCategoria: [{ etiqueta: 'PRINCIPAL', total: 3 }],
  docentesPorFacultad: [{ etiqueta: 'Facultad de Ingeniería', total: 2 }],
  generadoEn: '2026-10-28T16:00:00',
};

describe('dashboardService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('consulta el endpoint agregado del panel', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, message: 'ok', data: summary, timestamp: '2026-10-28T16:00:00' },
    } as never);

    const response = await dashboardService.getSummary();

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/v1/dashboard/summary');
    expect(response.success).toBe(true);
    expect(response.data.institucion.periodo).toBe('2026-I');
    expect(response.data.auditoria?.eventosTotales).toBe(8);
  });

  it('propaga el error cuando la petición falla', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network Error'));

    await expect(dashboardService.getSummary()).rejects.toThrow('Network Error');
  });
});
