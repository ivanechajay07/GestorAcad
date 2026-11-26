import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudentAttendancePanel } from './StudentAttendancePanel';

describe('StudentAttendancePanel', () => {
  it('resume los estados y lista los registros diarios', () => {
    const html = renderToStaticMarkup(
      <StudentAttendancePanel
        records={[
          { id: 1, date: '2026-11-20', status: 'PRESENTE', observation: '' },
          { id: 2, date: '2026-11-21', status: 'AUSENTE', observation: 'Falta justificada pendiente' },
          { id: 3, date: '2026-11-22', status: 'TARDANZA', observation: '' },
          { id: 4, date: '2026-11-23', status: 'JUSTIFICADO', observation: 'Cita médica' },
        ]}
      />
    );

    expect(html).toContain('75%');
    expect(html).toContain('Presente');
    expect(html).toContain('Ausente');
    expect(html).toContain('Tardanza');
    expect(html).toContain('Justificado');
    expect(html).toContain('Cita médica');
    expect(html).toContain('20 nov');
  });

  it('muestra un estado vacío sin registros', () => {
    const html = renderToStaticMarkup(<StudentAttendancePanel records={[]} />);
    expect(html).toContain('Sin registros de asistencia');
  });

  it('muestra la justificación y la acción para registros justificables', () => {
    const html = renderToStaticMarkup(
      <StudentAttendancePanel
        onJustify={() => undefined}
        records={[
          {
            id: 7,
            date: '2026-11-24',
            status: 'AUSENTE',
            observation: '',
            canJustify: true,
          },
          {
            id: 8,
            date: '2026-11-25',
            status: 'TARDANZA',
            observation: '',
            justificationStatus: 'APROBADA',
            justificationReason: 'Trámite personal',
            justificationResponse: 'Justificación validada',
          },
        ]}
      />
    );

    expect(html).toContain('Justificar');
    expect(html).toContain('Justificación aprobada');
    expect(html).toContain('Trámite personal');
    expect(html).toContain('Justificación validada');
  });
});
