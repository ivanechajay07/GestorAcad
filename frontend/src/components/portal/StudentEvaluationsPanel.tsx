import { CalendarDays } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import type { PortalCourseDto } from '../../services/portalService';
import { evaluationTypeLabel } from '../../utils/portal';

interface StudentEvaluationsPanelProps {
  courses: PortalCourseDto[];
}

interface EvaluationItem {
  key: string;
  courseCode: string;
  courseName: string;
  name: string;
  type: string;
  date?: string | null;
  weight: number;
  score: number | null;
  maxScore: number;
}

const formatDate = (value?: string | null): string => {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    .replace(/-/g, ' ')
    .replace(/\.$/, '');
};

const today = (): string => new Date().toISOString().slice(0, 10);

/** Calendario de evaluaciones de los cursos vigentes. */
export const StudentEvaluationsPanel = ({ courses }: StudentEvaluationsPanelProps) => {
  const items: EvaluationItem[] = courses.flatMap((course, courseIndex) =>
    course.grades.map((grade, gradeIndex) => ({
      key: `${course.periodCode}-${course.courseCode}-${grade.evaluationName}-${courseIndex}-${gradeIndex}`,
      courseCode: course.courseCode,
      courseName: course.courseName,
      name: grade.evaluationName,
      type: grade.type,
      date: grade.date,
      weight: grade.weight,
      score: grade.score,
      maxScore: grade.maxScore,
    }))
  );

  if (items.length === 0) {
    return (
      <EmptyState
        compact
        icon={<CalendarDays size={22} />}
        title="Sin evaluaciones registradas"
        description="Cuando el docente publique evaluaciones, aparecerán aquí con su fecha y peso."
      />
    );
  }

  const current = today();
  items.sort((a, b) => {
    const aUpcoming = Boolean(a.date && a.date >= current);
    const bUpcoming = Boolean(b.date && b.date >= current);
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    if (aUpcoming) return (a.date ?? '').localeCompare(b.date ?? '');
    const aPending = a.score == null;
    const bPending = b.score == null;
    if (aPending !== bPending) return aPending ? -1 : 1;
    return (b.date ?? '').localeCompare(a.date ?? '');
  });

  return (
    <ul className="student-eval-list">
      {items.slice(0, 8).map((item) => {
        const upcoming = Boolean(item.date && item.date >= current);
        const pending = item.score == null;
        return (
          <li className="student-eval-item" key={item.key}>
            <span className={`student-eval-item__date${upcoming ? ' is-upcoming' : ''}`}>
              {formatDate(item.date)}
            </span>
            <div className="student-eval-item__info">
              <strong>{item.name}</strong>
              <span>{item.courseCode} · {item.courseName}</span>
            </div>
            <div className="student-eval-item__meta">
              <span>{evaluationTypeLabel(item.type)}</span>
              <span>{item.weight}%</span>
            </div>
            {pending ? (
              <Badge variant={upcoming ? 'warning' : 'outline'} size="sm">
                {upcoming ? 'Próxima' : 'Pendiente'}
              </Badge>
            ) : (
              <Badge variant="outline" size="sm">
                {item.score}/{item.maxScore}
              </Badge>
            )}
          </li>
        );
      })}
    </ul>
  );
};
