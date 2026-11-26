import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PortalCourseDto } from '../../services/portalService';
import { StudentEvaluationsPanel } from './StudentEvaluationsPanel';

const course: PortalCourseDto = {
  periodCode: '2026-II',
  courseCode: 'MAT-101',
  courseName: 'Matemática I',
  sectionCode: 'A',
  sectionId: 1,
  credits: 4,
  status: 'MATRICULADO',
  actaStatus: 'ABIERTA',
  average: null,
  approved: null,
  present: 0,
  absent: 0,
  late: 0,
  grades: [
    {
      evaluationName: 'Examen final',
      type: 'PRACTICA',
      weight: 100,
      score: 15,
      maxScore: 20,
      date: '2026-11-23',
    },
  ],
};

describe('StudentEvaluationsPanel', () => {
  it('muestra la fecha, el curso y la nota de una evaluación calificada', () => {
    const html = renderToStaticMarkup(<StudentEvaluationsPanel courses={[course]} />);

    expect(html).toContain('Examen final');
    expect(html).toContain('MAT-101');
    expect(html).toContain('Práctica');
    expect(html).toContain('100%');
    expect(html).toContain('15/20');
    expect(html).toContain('23 nov');
  });

  it('marca una evaluación futura como próxima y pendiente', () => {
    const html = renderToStaticMarkup(
      <StudentEvaluationsPanel
        courses={[{
          ...course,
          grades: [{
            ...course.grades[0],
            score: null,
            date: '2099-01-15',
          }],
        }]}
      />
    );

    expect(html).toContain('Próxima');
    expect(html).toContain('15 ene');
  });
});
