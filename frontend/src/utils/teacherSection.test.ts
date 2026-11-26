import { describe, expect, it } from 'vitest';
import type { AttendanceDto, EvaluationDto, GradeDto } from '../services/evaluationService';
import { attendanceHistorySummary, attendanceSummary, evaluationWeight, gradesSummary } from './teacherSection';

const attendance = (status: string): AttendanceDto => ({
  studentId: 1,
  studentCode: '2026-0001',
  studentName: 'Estudiante',
  status,
});

const grade = (score?: number | null): GradeDto => ({
  studentId: 1,
  studentCode: '2026-0001',
  studentName: 'Estudiante',
  score,
});

const evaluation = (weight: number): EvaluationDto => ({
  id: 1,
  sectionId: 1,
  name: 'Evaluación',
  type: 'PRACTICA',
  weight,
  maxScore: 20,
});

describe('utilidades de la sección docente', () => {
  it('resume la asistencia y calcula el porcentaje', () => {
    const records = [
      attendance('PRESENTE'),
      attendance('PRESENTE'),
      attendance('TARDANZA'),
      attendance('JUSTIFICADO'),
      attendance('AUSENTE'),
    ];

    expect(attendanceSummary(records)).toEqual({
      present: 2,
      absent: 1,
      late: 1,
      justified: 1,
      total: 5,
      rate: 80,
    });
    expect(attendanceSummary([]).rate).toBeNull();
  });

  it('resume las notas calificadas, pendientes y el promedio', () => {
    expect(gradesSummary([grade(15), grade(18), grade(null), grade()])).toEqual({
      graded: 2,
      pending: 2,
      total: 4,
      average: 16.5,
    });
    expect(gradesSummary([]).average).toBeNull();
  });

  it('calcula el peso acumulado de las evaluaciones', () => {
    expect(evaluationWeight([evaluation(40), evaluation(35), evaluation(25)])).toBe(100);
    expect(evaluationWeight([])).toBe(0);
  });

  it('resume el historial de asistencia por estudiante', () => {
    const records: AttendanceDto[] = [
      { ...attendance('PRESENTE'), studentId: 1, studentName: 'Ana Torres' },
      { ...attendance('AUSENTE'), studentId: 1, studentName: 'Ana Torres' },
      { ...attendance('TARDANZA'), studentId: 2, studentName: 'Luis Gómez' },
    ];

    expect(attendanceHistorySummary(records)).toEqual([
      {
        studentId: 1,
        studentCode: '2026-0001',
        studentName: 'Ana Torres',
        present: 1,
        absent: 1,
        late: 0,
        justified: 0,
        total: 2,
        rate: 50,
      },
      {
        studentId: 2,
        studentCode: '2026-0001',
        studentName: 'Luis Gómez',
        present: 0,
        absent: 0,
        late: 1,
        justified: 0,
        total: 1,
        rate: 100,
      },
    ]);
  });
});
