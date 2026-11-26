import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PortalPlanDto } from '../../services/portalService';
import { StudentPlanPanel } from './StudentPlanPanel';

const plan: PortalPlanDto = {
  code: 'PLAN-IS-2026',
  name: 'Plan de Estudios Ingeniería de Sistemas 2026',
  totalCredits: 11,
  approvedCredits: 7,
  progressPercent: 64,
  courses: [
    {
      courseCode: 'MAT-101',
      courseName: 'Matemática I',
      cycle: 1,
      credits: 4,
      mandatory: true,
      status: 'APROBADO',
    },
    {
      courseCode: 'COM-101',
      courseName: 'Comunicación I',
      cycle: 1,
      credits: 3,
      mandatory: true,
      status: 'PENDIENTE',
    },
  ],
};

describe('StudentPlanPanel', () => {
  it('muestra el avance, los ciclos y el estado de cada curso', () => {
    const html = renderToStaticMarkup(<StudentPlanPanel plan={plan} />);

    expect(html).toContain('64%');
    expect(html).toContain('7 de 11 créditos aprobados');
    expect(html).toContain('Ciclo 1');
    expect(html).toContain('MAT-101');
    expect(html).toContain('Aprobado');
    expect(html).toContain('Comunicación I');
    expect(html).toContain('Pendiente');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="64"');
  });
});
