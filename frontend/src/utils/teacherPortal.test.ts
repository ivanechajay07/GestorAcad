import { describe, expect, it } from 'vitest';
import type { TeacherSectionDto } from '../services/portalService';
import { filterTeacherSections, teacherPeriods, teacherTotals } from './teacherPortal';

const section = (overrides: Partial<TeacherSectionDto> = {}): TeacherSectionDto => ({
  id: 1,
  periodCode: '2026-II',
  courseCode: 'MAT-101',
  courseName: 'Matemática I',
  sectionCode: 'A',
  students: 12,
  evaluations: 2,
  actaStatus: 'ABIERTA',
  schedule: 'LUN-MIE 08:00-10:00',
  ...overrides,
});

describe('utilidades del portal docente', () => {
  it('lista los periodos de la carga lectiva sin duplicados', () => {
    const sections = [
      section({ periodCode: '2026-I' }),
      section({ id: 2, periodCode: '2026-II' }),
      section({ id: 3, periodCode: '2026-I' }),
    ];

    expect(teacherPeriods(sections)).toEqual(['2026-II', '2026-I']);
  });

  it('filtra por texto, periodo y estado del acta', () => {
    const sections = [
      section({ courseCode: 'MAT-101', courseName: 'Matemática I' }),
      section({ id: 2, courseCode: 'COM-101', courseName: 'Comunicación I', periodCode: '2026-I' }),
      section({ id: 3, courseCode: 'SIS-201', courseName: 'Algoritmos', actaStatus: 'CERRADA' }),
    ];

    expect(filterTeacherSections(sections, { query: 'matematica', period: 'ALL', status: 'ALL' })).toHaveLength(1);
    expect(filterTeacherSections(sections, { query: '', period: '2026-I', status: 'ALL' })).toHaveLength(1);
    expect(filterTeacherSections(sections, { query: '', period: 'ALL', status: 'CERRADA' })).toHaveLength(1);
    expect(filterTeacherSections(sections, { query: 'matematica', period: '2026-I', status: 'ALL' })).toHaveLength(0);
  });

  it('calcula los totales de estudiantes, evaluaciones y pendientes', () => {
    const sections = [
      section({ students: 12, evaluations: 2 }),
      section({ id: 2, students: 0, evaluations: 0, actaStatus: 'CERRADA' }),
    ];

    expect(teacherTotals(sections)).toEqual({
      students: 12,
      evaluations: 2,
      pendingActs: 1,
      withoutStudents: 1,
    });
  });
});
