import type { PortalScheduleBlockDto } from '../../services/portalService';

export interface StudentScheduleEntry extends PortalScheduleBlockDto {
  courseCode: string;
  courseName: string;
}

interface StudentSchedulePanelProps {
  entries: StudentScheduleEntry[];
}

const DAYS = [
  { key: 'LUNES', label: 'Lunes' },
  { key: 'MARTES', label: 'Martes' },
  { key: 'MIERCOLES', label: 'Miércoles' },
  { key: 'JUEVES', label: 'Jueves' },
  { key: 'VIERNES', label: 'Viernes' },
  { key: 'SABADO', label: 'Sábado' },
];

const normalizeDay = (value: string): string =>
  value
    .toLocaleUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** Horario semanal del estudiante a partir de los bloques estructurados. */
export const StudentSchedulePanel = ({ entries }: StudentSchedulePanelProps) => {
  if (entries.length === 0) {
    return (
      <p className="student-schedule-empty">
        Sin horario registrado para el periodo vigente.
      </p>
    );
  }

  return (
    <div className="student-schedule-grid">
      {DAYS
        .filter((day) => day.key !== 'SABADO'
          || entries.some((entry) => normalizeDay(entry.day) === 'SABADO'))
        .map((day) => {
          const blocks = entries
            .filter((entry) => normalizeDay(entry.day) === day.key)
            .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

          return (
            <section className="student-schedule-day" key={day.key} aria-label={day.label}>
              <h4 className="student-schedule-day__title">{day.label}</h4>
              {blocks.length === 0 ? (
                <span className="student-schedule-day__empty">Sin clases</span>
              ) : (
                blocks.map((block) => (
                  <article
                    className="student-schedule-block"
                    key={`${day.key}-${block.startTime}-${block.courseCode}`}
                    aria-label={`${block.courseCode} ${block.courseName}, ${block.startTime} a ${block.endTime}`}
                  >
                    <span className="student-schedule-block__time">
                      {block.startTime} - {block.endTime}
                    </span>
                    <strong className="student-schedule-block__code">{block.courseCode}</strong>
                    <span className="student-schedule-block__name">{block.courseName}</span>
                    {block.classroom && (
                      <small className="student-schedule-block__meta">
                        Aula {block.classroom}
                      </small>
                    )}
                  </article>
                ))
              )}
            </section>
          );
        })}
    </div>
  );
};
