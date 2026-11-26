import type { PortalCourseDto, PortalGradeDto } from '../services/portalService';

const EVALUATION_TYPE_LABELS: Record<string, string> = {
  PRACTICA: 'Práctica',
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  OTRO: 'Otra',
};

const CONDITION_LABELS: Record<string, string> = {
  REGULAR: 'Regular',
  OBSERVADO: 'Observado',
  RETIRADO: 'Retirado',
  INGRESANTE: 'Ingresante',
  TERCIO_SUPERIOR: 'Tercio superior',
  QUINTO_SUPERIOR: 'Quinto superior',
};

export type AverageTone = 'success' | 'danger' | 'muted' | 'partial';

export interface CourseAverageSummary {
  value: number | null;
  kind: 'final' | 'partial' | 'none';
  gradedWeight: number;
  totalWeight: number;
}

export interface PeriodAveragePoint {
  period: string;
  average: number;
}

const normalizeText = (value: string): string =>
  value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Traduce los códigos de evaluación del backend a etiquetas legibles. */
export const evaluationTypeLabel = (type: string): string => {
  const key = (type ?? '').trim().toUpperCase();
  if (EVALUATION_TYPE_LABELS[key]) return EVALUATION_TYPE_LABELS[key];
  if (!key) return 'Evaluación';
  return key.charAt(0) + key.slice(1).toLowerCase();
};

/** Traduce la condición académica del estudiante. */
export const conditionLabel = (condition?: string | null): string => {
  const key = (condition ?? '').trim().toUpperCase();
  if (CONDITION_LABELS[key]) return CONDITION_LABELS[key];
  if (!key) return 'Sin condición';
  return key
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/** Porcentaje de asistencia: presentes y tardanzas cuentan como asistencia. */
export const attendanceRate = (
  course: Pick<PortalCourseDto, 'present' | 'absent' | 'late'>
): number | null => {
  const present = Number.isFinite(course.present) ? course.present : 0;
  const absent = Number.isFinite(course.absent) ? course.absent : 0;
  const late = Number.isFinite(course.late) ? course.late : 0;
  const total = present + absent + late;
  if (total <= 0) return null;
  return Math.round(((present + late) / total) * 100);
};

/** Asistencia acumulada de todos los cursos del periodo. */
export const globalAttendance = (courses: PortalCourseDto[]): number | null =>
  attendanceRate(
    courses.reduce(
      (totals, course) => ({
        present: totals.present + (course.present ?? 0),
        absent: totals.absent + (course.absent ?? 0),
        late: totals.late + (course.late ?? 0),
      }),
      { present: 0, absent: 0, late: 0 }
    )
  );

/** Progreso de una nota sobre su máximo, entre 0 y 100. */
export const gradeProgress = (grade: PortalGradeDto): number => {
  if (grade.score == null || !Number.isFinite(grade.maxScore) || grade.maxScore <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((grade.score / grade.maxScore) * 100)));
};

/** Peso total de las evaluaciones registradas. */
export const totalEvaluationWeight = (grades: PortalGradeDto[]): number =>
  Math.round(
    grades.reduce((sum, grade) => sum + (Number.isFinite(grade.weight) ? grade.weight : 0), 0) * 100
  ) / 100;

/**
 * Promedio del curso. Si el acta está cerrada se usa la nota oficial; si está
 * abierta se calcula un promedio parcial con las evaluaciones ya calificadas.
 */
export const courseAverage = (course: PortalCourseDto): CourseAverageSummary => {
  const totalWeight = totalEvaluationWeight(course.grades);

  if (course.average != null) {
    return { value: course.average, kind: 'final', gradedWeight: totalWeight, totalWeight };
  }

  const graded = course.grades.filter(
    (grade) =>
      grade.score != null &&
      Number.isFinite(grade.maxScore) &&
      grade.maxScore > 0 &&
      Number.isFinite(grade.weight)
  );
  const gradedWeight = Math.round(graded.reduce((sum, grade) => sum + grade.weight, 0) * 100) / 100;

  if (graded.length === 0 || gradedWeight <= 0) {
    return { value: null, kind: 'none', gradedWeight: 0, totalWeight };
  }

  const weighted = graded.reduce(
    (sum, grade) => sum + ((grade.score as number) / grade.maxScore) * 20 * (grade.weight / 100),
    0
  );
  const value = Math.round((weighted / (gradedWeight / 100)) * 100) / 100;

  return { value, kind: 'partial', gradedWeight, totalWeight };
};

/** Estado del promedio del curso con un tono visual reutilizable. */
export const courseAverageStatus = (
  course: PortalCourseDto,
  summary: CourseAverageSummary = courseAverage(course)
): { label: string; tone: AverageTone } => {
  if (summary.kind === 'none') return { label: 'Sin notas', tone: 'muted' };
  if (summary.kind === 'partial') return { label: 'Parcial', tone: 'partial' };
  return course.approved
    ? { label: 'Aprobado', tone: 'success' }
    : { label: 'Desaprobado', tone: 'danger' };
};

/** Promedio de los cursos de un periodo que ya tienen nota final o parcial. */
export const periodAverage = (courses: PortalCourseDto[]): number | null => {
  const values = courses
    .map((course) => courseAverage(course).value)
    .filter((value): value is number => value != null && Number.isFinite(value));
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
};

/** Promedio proyectado con notas hipotéticas para las evaluaciones pendientes. */
export const projectedCourseAverage = (
  course: PortalCourseDto,
  hypothetical: Record<number, number | null>
): number | null => {
  let weighted = 0;
  let usedWeight = 0;

  course.grades.forEach((grade, index) => {
    const score = grade.score ?? hypothetical[index] ?? null;
    if (
      score == null
      || !Number.isFinite(grade.maxScore)
      || grade.maxScore <= 0
      || !Number.isFinite(grade.weight)
      || grade.weight <= 0
    ) {
      return;
    }
    const normalized = Math.min(Math.max(score, 0), grade.maxScore) / grade.maxScore;
    weighted += normalized * 20 * (grade.weight / 100);
    usedWeight += grade.weight;
  });

  if (usedWeight <= 0) return null;
  return Math.round((weighted / (usedWeight / 100)) * 100) / 100;
};

/** Nota promedio necesaria en las evaluaciones pendientes para alcanzar un objetivo. */
export const requiredPendingAverage = (
  course: PortalCourseDto,
  target: number
): number | null => {
  const pending = course.grades.filter(
    (grade) => grade.score == null && grade.weight > 0 && grade.maxScore > 0
  );
  if (pending.length === 0) {
    return null;
  }

  const totalWeight = course.grades.reduce((sum, grade) => sum + (grade.weight ?? 0), 0);
  if (totalWeight <= 0) return null;

  const currentContribution = course.grades.reduce((sum, grade) => {
    if (grade.score == null || grade.maxScore <= 0) return sum;
    return sum + (grade.score / grade.maxScore) * 20 * (grade.weight / 100);
  }, 0);
  const pendingWeight = pending.reduce((sum, grade) => sum + grade.weight, 0);
  if (pendingWeight <= 0) return null;

  const required = ((target * totalWeight) / 100 - currentContribution) / (pendingWeight / 100);
  return Math.round(required * 100) / 100;
};

/** Filtra el historial por periodo y por código o nombre del curso. */
export const filterHistory = (
  history: PortalCourseDto[],
  period: string,
  query: string
): PortalCourseDto[] => {
  const term = normalizeText(query.trim());
  return history.filter((course) => {
    const matchesPeriod = !period || period === 'ALL' || course.periodCode === period;
    const matchesQuery = !term
      || normalizeText(`${course.courseCode} ${course.courseName}`).includes(term);
    return matchesPeriod && matchesQuery;
  });
};

/** Serie de promedio por periodo para el gráfico de evolución. */
export const averageByPeriod = (history: PortalCourseDto[]): PeriodAveragePoint[] => {
  const groups = new Map<string, PortalCourseDto[]>();
  history.forEach((course) => {
    groups.set(course.periodCode, [...(groups.get(course.periodCode) ?? []), course]);
  });

  return Array.from(groups.entries())
    .map(([period, courses]) => ({ period, average: periodAverage(courses) }))
    .filter((point): point is PeriodAveragePoint => point.average != null)
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-8);
};
