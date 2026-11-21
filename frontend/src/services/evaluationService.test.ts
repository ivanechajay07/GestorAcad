import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./api', () => ({ default: mocks }));

import { evaluationService } from './evaluationService';

describe('evaluationService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue({ data: { success: true, data: [] } });
    mocks.post.mockResolvedValue({ data: { success: true, data: null } });
    mocks.put.mockResolvedValue({ data: { success: true, data: null } });
    mocks.delete.mockResolvedValue({ data: { success: true, data: null } });
  });

  it('lista evaluaciones de una sección', async () => {
    await evaluationService.getEvaluations(3);
    expect(mocks.get).toHaveBeenCalledWith('/v1/sections/3/evaluations');
  });

  it('guarda notas en lote', async () => {
    const grades = [{ studentId: 6, score: 16 }];
    await evaluationService.saveGrades(9, grades);
    expect(mocks.put).toHaveBeenCalledWith('/v1/evaluations/9/grades', grades);
  });

  it('consulta asistencia por fecha', async () => {
    await evaluationService.getAttendance(3, '2026-11-19');
    expect(mocks.get).toHaveBeenCalledWith('/v1/sections/3/attendance', {
      params: { date: '2026-11-19' },
    });
  });

  it('cierra el acta de una sección', async () => {
    await evaluationService.closeActa(3);
    expect(mocks.post).toHaveBeenCalledWith('/v1/sections/3/act/close');
  });
});
