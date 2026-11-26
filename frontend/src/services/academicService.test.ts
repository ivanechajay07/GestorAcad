import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./api', () => ({ default: mocks }));

import { academicService } from './academicService';

describe('academicService', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue({ data: { success: true, data: [] } });
    mocks.post.mockResolvedValue({ data: { success: true, data: null } });
    mocks.put.mockResolvedValue({ data: { success: true, data: null } });
    mocks.patch.mockResolvedValue({ data: { success: true, data: null } });
    mocks.delete.mockResolvedValue({ data: { success: true, data: null } });
  });

  it('lista periodos desde /v1/academic-periods', async () => {
    await academicService.getPeriods();
    expect(mocks.get).toHaveBeenCalledWith('/v1/academic-periods');
  });

  it('activa un periodo con PATCH y su identificador', async () => {
    await academicService.activatePeriod(7);
    expect(mocks.patch).toHaveBeenCalledWith('/v1/academic-periods/7/activate');
  });

  it('actualiza un curso por su identificador', async () => {
    const payload = {
      code: 'MAT-101',
      name: 'Matemática I',
      credits: 4,
      theoryHours: 3,
      practiceHours: 2,
      type: 'GENERAL',
    };
    await academicService.updateCourse(3, payload);
    expect(mocks.put).toHaveBeenCalledWith('/v1/courses/3', payload);
  });

  it('elimina lógicamente un periodo con DELETE', async () => {
    await academicService.deletePeriod(2);
    expect(mocks.delete).toHaveBeenCalledWith('/v1/academic-periods/2');
  });

  it('registra un curso en /v1/courses', async () => {
    const payload = {
      code: 'SIS-201',
      name: 'Algoritmos',
      credits: 4,
      theoryHours: 3,
      practiceHours: 2,
      type: 'ESPECIFICO',
    };
    await academicService.createCourse(payload);
    expect(mocks.post).toHaveBeenCalledWith('/v1/courses', payload);
  });

  it('lista planes y su malla curricular', async () => {
    await academicService.getPlans();
    await academicService.getPlanCourses(4);
    expect(mocks.get).toHaveBeenCalledWith('/v1/study-plans');
    expect(mocks.get).toHaveBeenCalledWith('/v1/study-plans/4/courses');
  });

  it('registra un curso dentro de un plan', async () => {
    const payload = { courseId: 2, cycle: 1, mandatory: true };
    await academicService.addPlanCourse(4, payload);
    expect(mocks.post).toHaveBeenCalledWith('/v1/study-plans/4/courses', payload);
  });

  it('registra una sección', async () => {
    const payload = {
      periodId: 2,
      courseId: 1,
      code: 'A',
      capacity: 30,
      shift: 'MAÑANA',
      schedule: 'LUN-MIE 08:00-10:00',
    };
    await academicService.createSection(payload);
    expect(mocks.post).toHaveBeenCalledWith('/v1/sections', payload);
  });

  it('registra una matrícula y actualiza su estado', async () => {
    const payload = { studentId: 1, sectionId: 3, observation: '' };
    await academicService.createEnrollment(payload);
    await academicService.updateEnrollmentStatus(9, 'RETIRADO');
    expect(mocks.post).toHaveBeenCalledWith('/v1/enrollments', payload);
    expect(mocks.patch).toHaveBeenCalledWith('/v1/enrollments/9/status', null, { params: { status: 'RETIRADO' } });
  });
});
