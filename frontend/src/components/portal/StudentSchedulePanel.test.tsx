import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudentSchedulePanel } from './StudentSchedulePanel';

describe('StudentSchedulePanel', () => {
  it('organiza los bloques por día y muestra curso, hora y aula', () => {
    const html = renderToStaticMarkup(
      <StudentSchedulePanel
        entries={[
          {
            day: 'LUNES',
            startTime: '08:00',
            endTime: '10:00',
            classroom: 'A-201',
            courseCode: 'MAT-101',
            courseName: 'Matemática I',
          },
          {
            day: 'MIERCOLES',
            startTime: '14:00',
            endTime: '16:00',
            classroom: 'B-105',
            courseCode: 'SIS-201',
            courseName: 'Algoritmos',
          },
        ]}
      />
    );

    expect(html).toContain('Lunes');
    expect(html).toContain('Miércoles');
    expect(html).toContain('08:00 - 10:00');
    expect(html).toContain('MAT-101');
    expect(html).toContain('Aula A-201');
    expect(html).toContain('SIS-201');
    expect(html).not.toContain('Sin horario registrado');
  });

  it('muestra un aviso cuando no hay bloques', () => {
    const html = renderToStaticMarkup(<StudentSchedulePanel entries={[]} />);
    expect(html).toContain('Sin horario registrado');
  });
});
