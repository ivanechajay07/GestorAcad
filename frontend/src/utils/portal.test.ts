import { describe, expect, it } from 'vitest';
import type { PortalCourseDto, PortalGradeDto } from '../services/portalService';
import {
  attendanceRate,
  conditionLabel,
  courseAverage,
  courseAverageStatus,
  evaluationTypeLabel,
  globalAttendance,
  gradeProgress,
  periodAverage,
  totalEvaluationWeight,
} from './portal';

const course = (overrides: Partial<PortalCourseDto> = {}): PortalCourseDto => ({
  periodCode: '2026-II',
  courseCode: 'MAT-101',
  courseName: 'Matemática I',
  sectionCode: 'A',
  credits: 4,
  status: 'MATRICULADO',
  actaStatus: 'ABIERTA',
  average: null,
  approved: null,
  present: 0,
  absent: 0,
  late: 0,
  grades: [],
  ...overrides,
});

const grade = (overrides: Partial<PortalGradeDto> = {}): PortalGradeDto => ({
  evaluationName: 'Examen final',
  type: 'PRACTICA',
  weight: 100,
  score: 15,
  maxScore: 20,
  ...overrides,
});

describe('utilidades del portal del estudiante', () => {
  it('traduce los tipos de evaluación y las condiciones académicas', () => {
    expect(evaluationTypeLabel('PRACTICA')).toBe('Práctica');
    expect(evaluationTypeLabel('parcial')).toBe('Parcial');
    expect(evaluationTypeLabel('FINAL')).toBe('Final');
    expect(evaluationTypeLabel('OTRO')).toBe('Otra');
    expect(evaluationTypeLabel('desconocido')).toBe('Desconocido');
    expect(evaluationTypeLabel('')).toBe('Evaluación');

    expect(conditionLabel('REGULAR')).toBe('Regular');
    expect(conditionLabel('observado')).toBe('Observado');
    expect(conditionLabel('TERCIO_SUPERIOR')).toBe('Tercio superior');
    expect(conditionLabel('QUINTO_SUPERIOR')).toBe('Quinto superior');
    expect(conditionLabel(null)).toBe('Sin condición');
  });

  it('calcula la asistencia contando presentes y tardanzas', () => {
    expect(attendanceRate({ present: 8, absent: 2, late: 0 })).toBe(80);
    expect(attendanceRate({ present: 1, absent: 1, late: 1 })).toBe(67);
    expect(attendanceRate({ present: 0, absent: 0, late: 0 })).toBeNull();
  });

  it('acumula la asistencia de todos los cursos y calcula el promedio del periodo', () => {
    const courses = [
      course({ present: 8, absent: 2, late: 0, average: 15 }),
      course({ courseCode: 'COM-101', present: 2, absent: 0, late: 0, average: 17 }),
    ];

    expect(globalAttendance(courses)).toBe(83);
    expect(globalAttendance([])).toBeNull();
    expect(periodAverage(courses)).toBe(16);
    expect(periodAverage([course()])).toBeNull();
    expect(
      periodAverage([course({ average: null, approved: null, grades: [grade({ score: 16 })] })])
    ).toBe(16);
  });

  it('calcula el progreso de una nota y el peso acumulado', () => {
    expect(gradeProgress(grade())).toBe(75);
    expect(gradeProgress(grade({ score: null }))).toBe(0);
    expect(gradeProgress(grade({ score: 25 }))).toBe(100);
    expect(totalEvaluationWeight([grade({ weight: 40 }), grade({ weight: 60 })])).toBe(100);
    expect(totalEvaluationWeight([])).toBe(0);
  });

  it('calcula el promedio parcial cuando el acta todavía está abierta', () => {
    const partial = course({ average: null, approved: null, grades: [grade()] });

    expect(courseAverage(partial)).toEqual({
      value: 15,
      kind: 'partial',
      gradedWeight: 100,
      totalWeight: 100,
    });
    expect(courseAverageStatus(partial)).toEqual({ label: 'Parcial', tone: 'partial' });
    expect(courseAverageStatus(course())).toEqual({ label: 'Sin notas', tone: 'muted' });
  });

  it('clasifica el promedio del curso con un tono visual', () => {
    expect(courseAverageStatus(course({ average: 15, approved: true }))).toEqual({
      label: 'Aprobado',
      tone: 'success',
    });
    expect(courseAverageStatus(course({ average: 8, approved: false }))).toEqual({
      label: 'Desaprobado',
      tone: 'danger',
    });
  });
});
