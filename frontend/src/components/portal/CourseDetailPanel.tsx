import { ClipboardCheck, Clock3, Download, UserRound } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import type { PortalCourseDto } from '../../services/portalService';
import {
  attendanceRate,
  courseAverage,
  courseAverageStatus,
  evaluationTypeLabel,
  gradeProgress,
  totalEvaluationWeight,
} from '../../utils/portal';

interface CourseDetailPanelProps {
  course: PortalCourseDto;
  onDownload?: () => void;
  downloading?: boolean;
}

/**
 * Detalle académico de un curso: resumen del acta, asistencia y evaluaciones.
 * Se usa tanto en la matrícula vigente como en el historial del estudiante.
 */
export const CourseDetailPanel = ({ course, onDownload, downloading = false }: CourseDetailPanelProps) => {
  const rate = attendanceRate(course);
  const summary = courseAverage(course);
  const status = courseAverageStatus(course, summary);
  const totalWeight = totalEvaluationWeight(course.grades);
  const closed = course.actaStatus === 'CERRADA';
  const averageHint = summary.kind === 'partial'
    ? `Parcial · ${summary.gradedWeight}% del peso`
    : status.label;

  return (
    <div className="course-detail">
      {(course.teacherName || course.schedule) && (
        <div className="course-detail__meta">
          {course.teacherName && (
            <span>
              <UserRound size={13} aria-hidden="true" />
              Docente: <strong>{course.teacherName}</strong>
            </span>
          )}
          {course.schedule && (
            <span>
              <Clock3 size={13} aria-hidden="true" />
              Horario: <strong>{course.schedule}</strong>
            </span>
          )}
        </div>
      )}

      <div className="course-detail__stats">
        <div className="course-detail__stat">
          <span className="course-detail__label">Promedio</span>
          <strong className={`course-detail__value is-${status.tone}`}>
            {summary.value == null ? '—' : summary.value}
          </strong>
          <span className={`course-detail__hint is-${status.tone}`}>{averageHint}</span>
        </div>

        <div className="course-detail__stat">
          <span className="course-detail__label">Asistencia</span>
          <strong className="course-detail__value">{rate == null ? '—' : `${rate}%`}</strong>
          <div
            className="course-detail__bar"
            role="progressbar"
            aria-label={`Asistencia de ${course.courseName}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={rate ?? 0}
            aria-valuetext={rate == null ? 'Sin registros de asistencia' : `${rate}% de asistencia`}
          >
            <span style={{ width: `${rate ?? 0}%` }} />
          </div>
          <span className="course-detail__hint">
            {course.present} P · {course.absent} A · {course.late} T
          </span>
        </div>

        <div className="course-detail__stat">
          <span className="course-detail__label">Créditos</span>
          <strong className="course-detail__value">{course.credits}</strong>
          <span className="course-detail__hint">Sección {course.sectionCode}</span>
        </div>

        <div className="course-detail__stat">
          <span className="course-detail__label">Acta</span>
          <Badge variant={closed ? 'success' : 'outline'} size="sm" dot>
            {closed ? 'Cerrada' : 'Abierta'}
          </Badge>
          <span className="course-detail__hint">{closed ? 'Notas definitivas' : 'En revisión'}</span>
        </div>
      </div>

      <p className={`course-detail__note${closed ? ' is-closed' : ' is-open'}`}>
        {closed
          ? 'Acta cerrada: las notas registradas son definitivas.'
          : 'Acta abierta: el docente aún puede actualizar las notas.'}
      </p>

      <div className="course-detail__head">
        <div>
          <h4 className="course-detail__title">Evaluaciones</h4>
          <p className="course-detail__subtitle">Notas registradas por el docente para esta sección.</p>
        </div>
        <Badge variant="outline" size="sm">
          {course.grades.length} {course.grades.length === 1 ? 'evaluación' : 'evaluaciones'}
        </Badge>
      </div>

      {course.grades.length === 0 ? (
        <EmptyState
          compact
          icon={<ClipboardCheck size={22} />}
          title="Sin evaluaciones registradas"
          description="El docente todavía no publicó evaluaciones para esta sección."
        />
      ) : (
        <ul className="grade-list">
          {course.grades.map((grade, index) => {
            const pending = grade.score == null;
            const progress = gradeProgress(grade);

            return (
              <li className="grade-item" key={`${grade.evaluationName}-${index}`}>
                <div className="grade-item__info">
                  <span className="grade-item__name">{grade.evaluationName}</span>
                  <span className="grade-item__meta">
                    <span>{evaluationTypeLabel(grade.type)}</span>
                    <span>Peso {grade.weight}%</span>
                  </span>
                </div>

                <div className="grade-item__score">
                  <span className="grade-item__value">{pending ? '—' : grade.score}</span>
                  <span className="grade-item__max">/ {grade.maxScore}</span>
                  <span className="grade-item__bar" aria-hidden="true">
                    <span style={{ width: `${progress}%` }} />
                  </span>
                </div>

                <Badge variant={pending ? 'outline' : 'primary'} size="sm">
                  {pending ? 'Pendiente' : 'Registrada'}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}

      <div className="course-detail__footer">
        <div className="course-detail__footer-info">
          <span>Peso acumulado: <strong>{totalWeight}%</strong></span>
          <span>
            {summary.kind === 'partial' ? 'Promedio parcial' : 'Promedio final'}:{' '}
            <strong>{summary.value == null ? 'En curso' : summary.value}</strong>
          </span>
        </div>
        {onDownload && (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download size={14} />}
            onClick={onDownload}
            isLoading={downloading}
            aria-label={`Constancia PDF de ${course.courseName}`}
          >
            Constancia PDF
          </Button>
        )}
      </div>
    </div>
  );
};
