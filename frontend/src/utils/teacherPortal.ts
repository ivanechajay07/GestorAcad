import type { TeacherSectionDto } from '../services/portalService';

export interface TeacherSectionFilters {
  query: string;
  period: string;
  status: string;
}

export interface TeacherTotals {
  students: number;
  evaluations: number;
  pendingActs: number;
  withoutStudents: number;
}

const normalizeText = (value: string): string =>
  value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Periodos presentes en la carga lectiva, del más reciente al más antiguo. */
export const teacherPeriods = (sections: TeacherSectionDto[]): string[] =>
  Array.from(new Set(sections.map((section) => section.periodCode)))
    .sort((a, b) => b.localeCompare(a));

/** Filtra las secciones por texto, periodo y estado del acta. */
export const filterTeacherSections = (
  sections: TeacherSectionDto[],
  filters: TeacherSectionFilters
): TeacherSectionDto[] => {
  const term = normalizeText(filters.query.trim());
  return sections.filter((section) => {
    const matchesQuery = !term
      || normalizeText(`${section.courseCode} ${section.courseName}`).includes(term);
    const matchesPeriod = !filters.period || filters.period === 'ALL'
      || section.periodCode === filters.period;
    const matchesStatus = !filters.status || filters.status === 'ALL'
      || section.actaStatus === filters.status;
    return matchesQuery && matchesPeriod && matchesStatus;
  });
};

/** Totales de la carga lectiva para el resumen del docente. */
export const teacherTotals = (sections: TeacherSectionDto[]): TeacherTotals => ({
  students: sections.reduce((sum, section) => sum + section.students, 0),
  evaluations: sections.reduce((sum, section) => sum + section.evaluations, 0),
  pendingActs: sections.filter((section) => section.actaStatus !== 'CERRADA').length,
  withoutStudents: sections.filter((section) => section.students === 0).length,
});
