import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PortalCourseDto } from '../../services/portalService';
import { CourseDetailPanel } from './CourseDetailPanel';

const baseCourse: PortalCourseDto = {
  periodCode: '2026-II',
  courseCode: 'MAT-101',
  courseName: 'Matemática I',
  sectionCode: 'A',
  sectionId: 3,
  teacherName: 'Carlos Santana',
  schedule: 'LUN-MIE 08:00-10:00',
  credits: 4,
  status: 'MATRICULADO',
  actaStatus: 'CERRADA',
  average: 15,
  approved: true,
  present: 8,
  absent: 2,
  late: 0,
  grades: [
    {
      evaluationName: 'Examen final',
      type: 'PRACTICA',
      weight: 100,
      score: 15,
      maxScore: 20,
      observation: 'Buen desempeño en el examen final.',
    },
  ],
};

describe('CourseDetailPanel', () => {
  it('muestra el resumen del acta y las notas con etiquetas legibles', () => {
    const html = renderToStaticMarkup(<CourseDetailPanel course={baseCourse} />);

    expect(html).toContain('Matemática I');
    expect(html).toContain('Carlos Santana');
    expect(html).toContain('LUN-MIE 08:00-10:00');
    expect(html).toContain('Examen final');
    expect(html).toContain('Práctica');
    expect(html).not.toContain('PRACTICA');
    expect(html).toContain('Peso 100%');
    expect(html).toContain('/ 20');
    expect(html).toContain('80%');
    expect(html).toContain('Aprobado');
    expect(html).toContain('Acta cerrada: las notas registradas son definitivas.');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="80"');
    expect(html).toContain('Registrada');
    expect(html).toContain('<strong>100%</strong>');
    expect(html).toContain('Simulador de nota');
    expect(html).toContain('Buen desempeño en el examen final.');
  });

  it('muestra el botón de descarga de constancia cuando está disponible', () => {
    const html = renderToStaticMarkup(
      <CourseDetailPanel course={baseCourse} onDownload={() => undefined} />
    );

    expect(html).toContain('Constancia PDF');
    expect(html).toContain('Constancia PDF de Matemática I');
  });

  it('calcula y muestra el promedio parcial cuando el acta está abierta', () => {
    const html = renderToStaticMarkup(
      <CourseDetailPanel
        course={{ ...baseCourse, actaStatus: 'ABIERTA', average: null, approved: null }}
      />
    );

    expect(html).toContain('Parcial · 100% del peso');
    expect(html).toContain('Promedio parcial');
    expect(html).toContain('15');
  });

  it('señala las evaluaciones pendientes y el acta abierta', () => {
    const html = renderToStaticMarkup(
      <CourseDetailPanel
        course={{
          ...baseCourse,
          actaStatus: 'ABIERTA',
          average: null,
          approved: null,
          grades: [{ ...baseCourse.grades[0], score: null }],
        }}
      />
    );

    expect(html).toContain('Pendiente');
    expect(html).toContain('Acta abierta: el docente aún puede actualizar las notas.');
    expect(html).toContain('En curso');
  });

  it('muestra un estado vacío cuando todavía no hay evaluaciones', () => {
    const html = renderToStaticMarkup(
      <CourseDetailPanel course={{ ...baseCourse, grades: [] }} />
    );

    expect(html).toContain('Sin evaluaciones registradas');
    expect(html).toContain('0 evaluaciones');
    expect(html).toContain('<strong>0%</strong>');
  });
});
