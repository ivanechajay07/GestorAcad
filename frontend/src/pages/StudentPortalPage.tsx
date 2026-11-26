import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ClipboardCheck, GraduationCap, History } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { CourseDetailPanel } from '../components/portal/CourseDetailPanel';
import { useToast } from '../contexts/ToastContext';
import { portalService } from '../services/portalService';
import type { PortalCourseDto, StudentPortalDto } from '../services/portalService';
import {
  attendanceRate,
  conditionLabel,
  courseAverage,
  courseAverageStatus,
  globalAttendance,
  periodAverage,
} from '../utils/portal';

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const StudentPortalPage: React.FC = () => {
  const toast = useToast();
  const [data, setData] = useState<StudentPortalDto | null>(null);
  const [history, setHistory] = useState<PortalCourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selected, setSelected] = useState<PortalCourseDto | null>(null);

  useEffect(() => {
    portalService
      .getStudentSummary()
      .then((res) => setData(res.data))
      .catch(() => toast.error('No se pudo cargar tu avance académico'))
      .finally(() => setLoading(false));

    portalService
      .getStudentHistory()
      .then((res) => setHistory(res.data))
      .catch(() => toast.error('No se pudo cargar tu historial académico'))
      .finally(() => setHistoryLoading(false));
  }, [toast]);

  const currentAttendance = useMemo(() => globalAttendance(data?.courses ?? []), [data]);

  const historyByPeriod = useMemo(() => {
    const groups = new Map<string, PortalCourseDto[]>();
    history.forEach((course) => {
      groups.set(course.periodCode, [...(groups.get(course.periodCode) ?? []), course]);
    });
    return Array.from(groups.entries());
  }, [history]);

  if (loading) {
    return <LoadingSpinner message="Consultando tu avance académico..." />;
  }

  if (!data) {
    return (
      <div className="glass-panel student-panel">
        <EmptyState
          icon={<GraduationCap size={26} />}
          title="Ficha estudiantil no vinculada"
          description="No se encontró una ficha de estudiante asociada a tu cuenta. Contacta a la administración para completar el vínculo."
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Mi avance académico"
        subtitle={`${data.firstName} ${data.lastName} · ${data.career ?? 'Sin carrera asignada'}`}
        icon={<GraduationCap size={26} color="#ffffff" />}
        breadcrumbs={[{ label: 'Mi espacio' }, { label: 'Avance académico' }]}
        badges={
          <>
            <Badge variant="outline" size="sm">{data.code}</Badge>
            <Badge variant="outline" size="sm">Ciclo {data.currentCycle}</Badge>
            <Badge variant={data.condition === 'REGULAR' ? 'success' : 'warning'} size="sm" dot>
              {conditionLabel(data.condition)}
            </Badge>
          </>
        }
        stats={[
          { label: 'Promedio ponderado', value: data.weightedAverage },
          { label: 'Créditos aprobados', value: data.approvedCredits },
          {
            label: data.courses.length === 1 ? 'Curso matriculado' : 'Cursos matriculados',
            value: data.courses.length,
          },
          {
            label: 'Asistencia global',
            value: currentAttendance == null ? '—' : `${currentAttendance}%`,
          },
        ]}
      />

      <section className="glass-panel student-panel" aria-label="Cursos del periodo">
        <SectionHeader
          compact
          icon={<BookOpen size={18} />}
          eyebrow="Matrícula vigente"
          title="Cursos del periodo"
          description="Consulta el promedio, la asistencia y las evaluaciones de cada curso."
          aside={
            <Badge variant="outline" size="sm">
              {data.courses.length} {data.courses.length === 1 ? 'curso' : 'cursos'}
            </Badge>
          }
        />

        {data.courses.length === 0 ? (
          <EmptyState
            compact
            icon={<BookOpen size={22} />}
            title="Sin cursos matriculados"
            description="Cuando tengas una matrícula activa, aquí verás tus cursos, asistencia y promedio."
          />
        ) : (
          <div className="student-course-grid">
            {data.courses.map((course, index) => {
              const rate = attendanceRate(course);
              const summary = courseAverage(course);
              const status = courseAverageStatus(course, summary);
              const averageHint = summary.kind === 'partial'
                ? `Parcial · ${summary.gradedWeight}% del peso`
                : status.label;
              const closed = course.actaStatus === 'CERRADA';
              const cardId = `student-course-${index}`;

              return (
                <article
                  key={`${course.periodCode}-${course.courseCode}-${course.sectionCode}`}
                  className="student-course-card"
                  aria-labelledby={cardId}
                >
                  <div className="student-course-card__head">
                    <div className="student-course-card__identity">
                      <span className="student-course-card__code">{course.courseCode}</span>
                      <h3 className="student-course-card__title" id={cardId}>{course.courseName}</h3>
                      <p className="student-course-card__meta">
                        Sección {course.sectionCode} · {course.credits} créditos
                      </p>
                    </div>
                    <Badge variant={closed ? 'success' : 'warning'} size="sm" dot>
                      {closed ? 'Acta cerrada' : 'Acta abierta'}
                    </Badge>
                  </div>

                  <div className="student-course-card__metrics">
                    <div className="student-course-card__metric">
                      <span className="student-course-card__metric-label">Promedio</span>
                      <strong className={`student-course-card__metric-value is-${status.tone}`}>
                        {summary.value == null ? '—' : summary.value}
                      </strong>
                      <span className={`student-course-card__metric-hint is-${status.tone}`}>
                        {averageHint}
                      </span>
                    </div>
                    <div className="student-course-card__metric">
                      <span className="student-course-card__metric-label">Asistencia</span>
                      <strong className="student-course-card__metric-value">
                        {rate == null ? '—' : `${rate}%`}
                      </strong>
                      <span className="student-course-card__metric-hint">
                        {course.present} P · {course.absent} A · {course.late} T
                      </span>
                    </div>
                  </div>

                  <div
                    className="student-course-card__bar"
                    role="progressbar"
                    aria-label={`Asistencia de ${course.courseName}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={rate ?? 0}
                    aria-valuetext={rate == null ? 'Sin registros de asistencia' : `${rate}% de asistencia`}
                  >
                    <span style={{ width: `${rate ?? 0}%` }} />
                  </div>

                  <div className="student-course-card__footer">
                    <span className="student-course-card__count">
                      {course.grades.length} {course.grades.length === 1 ? 'evaluación' : 'evaluaciones'}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<ClipboardCheck size={14} />}
                      onClick={() => setSelected(course)}
                      aria-label={`Ver evaluaciones de ${course.courseName}`}
                    >
                      Ver evaluaciones
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="glass-panel student-panel" aria-label="Historial académico">
        <SectionHeader
          compact
          icon={<History size={18} />}
          eyebrow="Trayectoria"
          title="Historial académico"
          description="Matrículas de todos los periodos, incluidas las retiradas."
          aside={
            <Badge variant="outline" size="sm">
              {history.length} {history.length === 1 ? 'registro' : 'registros'}
            </Badge>
          }
        />

        {historyLoading ? (
          <LoadingSpinner message="Consultando historial académico..." />
        ) : historyByPeriod.length === 0 ? (
          <div className="history-empty">
            <History size={22} aria-hidden="true" />
            <strong>Sin historial registrado</strong>
            <span>Aún no tienes matrículas en el sistema.</span>
          </div>
        ) : (
          historyByPeriod.map(([period, courses]) => {
            const average = periodAverage(courses);
            const credits = courses.reduce((sum, course) => sum + (course.credits ?? 0), 0);

            return (
              <section key={period} className="history-period" aria-label={`Periodo ${period}`}>
                <div className="history-period__head">
                  <div className="history-period__title">
                    <span className="history-period__label">Periodo {period}</span>
                    <span className="history-period__meta">
                      {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
                    </span>
                  </div>
                  <div className="history-period__summary">
                    <span>Promedio <strong>{average == null ? '—' : average}</strong></span>
                    <span>Créditos <strong>{credits}</strong></span>
                  </div>
                </div>

                <p className="table-scroll-hint">Desliza para ver más columnas →</p>
                <div className="data-table-wrap">
                  <table className="data-table data-table--stack">
                    <colgroup>
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '7%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '16%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Curso</th>
                        <th>Sección</th>
                        <th>Matrícula</th>
                        <th>Créditos</th>
                        <th>Estado</th>
                        <th>Acta</th>
                        <th>Promedio</th>
                        <th style={{ textAlign: 'center' }}>Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={`${course.periodCode}-${course.courseCode}-${course.sectionCode}-${course.status}`}>
                          <td><span className="cell-mono">{course.courseCode}</span> · {course.courseName}</td>
                          <td>{course.sectionCode}</td>
                          <td>{formatDate(course.enrollmentDate)}</td>
                          <td>{course.credits}</td>
                          <td>
                            <Badge variant={course.status === 'MATRICULADO' ? 'success' : 'outline'} size="sm">
                              {course.status === 'MATRICULADO' ? 'Matriculado' : 'Retirado'}
                            </Badge>
                          </td>
                          <td>
                            <Badge variant={course.actaStatus === 'CERRADA' ? 'success' : 'warning'} size="sm" dot>
                              {course.actaStatus === 'CERRADA' ? 'Cerrada' : 'Abierta'}
                            </Badge>
                          </td>
                          <td>
                            {course.average == null ? '—' : (
                              <Badge variant={course.approved ? 'success' : 'danger'} size="sm">
                                {course.average} · {course.approved ? 'Aprobado' : 'Desaprobado'}
                              </Badge>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="action-btn primary"
                              title="Ver notas"
                              aria-label={`Ver notas de ${course.courseCode}`}
                              onClick={() => setSelected(course)}
                            >
                              <ClipboardCheck size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })
        )}
      </section>

      {selected && (
        <Modal
          title={selected.courseName}
          subtitle={`${selected.periodCode} · Sección ${selected.sectionCode} · ${selected.credits} créditos`}
          icon={<ClipboardCheck size={20} />}
          maxWidth="780px"
          onClose={() => setSelected(null)}
        >
          <CourseDetailPanel course={selected} />
        </Modal>
      )}
    </div>
  );
};
