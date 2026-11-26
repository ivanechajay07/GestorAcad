import type { AttendanceDto, EvaluationDto, GradeDto } from '../services/evaluationService';

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  justified: number;
  total: number;
  rate: number | null;
}

export interface GradesSummary {
  graded: number;
  pending: number;
  total: number;
  average: number | null;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/** Agrupa los estados de asistencia y calcula el porcentaje de asistencia. */
export const attendanceSummary = (records: AttendanceDto[]): AttendanceSummary => {
  const summary = { present: 0, absent: 0, late: 0, justified: 0 };
  records.forEach((record) => {
    switch (record.status) {
      case 'AUSENTE': summary.absent++; break;
      case 'TARDANZA': summary.late++; break;
      case 'JUSTIFICADO': summary.justified++; break;
      default: summary.present++; break;
    }
  });
  const total = records.length;
  const attended = summary.present + summary.late + summary.justified;
  return {
    ...summary,
    total,
    rate: total === 0 ? null : Math.round((attended / total) * 100),
  };
};

/** Resumen de notas de una evaluación: calificadas, pendientes y promedio. */
export const gradesSummary = (grades: GradeDto[]): GradesSummary => {
  const scored = grades.filter((grade) => grade.score != null);
  return {
    graded: scored.length,
    pending: grades.length - scored.length,
    total: grades.length,
    average: scored.length === 0
      ? null
      : round(scored.reduce((sum, grade) => sum + (grade.score as number), 0) / scored.length),
  };
};

/** Peso acumulado de las evaluaciones activas de la sección. */
export const evaluationWeight = (evaluations: EvaluationDto[]): number =>
  round(evaluations.reduce((sum, evaluation) => sum + (evaluation.weight ?? 0), 0));
