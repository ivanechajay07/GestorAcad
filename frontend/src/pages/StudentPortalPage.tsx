import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  History,
  Layers,
  Search,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Select } from '../components/ui/Select';
import { CourseDetailPanel } from '../components/portal/CourseDetailPanel';
import { StudentAttendancePanel } from '../components/portal/StudentAttendancePanel';
import { StudentEvaluationsPanel } from '../components/portal/StudentEvaluationsPanel';
import { StudentPlanPanel } from '../components/portal/StudentPlanPanel';
import { StudentSchedulePanel } from '../components/portal/StudentSchedulePanel';
import type { StudentScheduleEntry } from '../components/portal/StudentSchedulePanel';
import { useToast } from '../contexts/ToastContext';
import { portalService } from '../services/portalService';
import { reportService } from '../services/reportService';
import { academicInputStyle } from '../components/academic/AcademicUi';
import { getApiErrorMessage } from '../utils/apiErrors';
import type { PortalAttendanceDto, PortalCourseDto, StudentPortalDto } from '../services/portalService';
import {
  attendanceRate,
  averageByPeriod,
  buildStudentAlerts,
  conditionLabel,
  courseAverage,
  courseAverageStatus,
  filterHistory,
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
  const [historyPeriod, setHistoryPeriod] = useState('ALL');
  const [historyQuery, setHistoryQuery] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [attendanceCourse, setAttendanceCourse] = useState<PortalCourseDto | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<PortalAttendanceDto[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [justifyRecord, setJustifyRecord] = useState<PortalAttendanceDto | null>(null);
  const [justifyReason, setJustifyReason] = useState('');
  const [justifyError, setJustifyError] = useState<string | null>(null);
  const [justifySaving, setJustifySaving] = useState(false);

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
  const alerts = useMemo(
    () => buildStudentAlerts(data?.courses ?? [], data?.minimumGrade ?? 12),
    [data]
  );

  const historyPeriods = useMemo(
    () => Array.from(new Set(history.map((course) => course.periodCode))).sort((a, b) => b.localeCompare(a)),
    [history]
  );

  const filteredHistory = useMemo(
    () => filterHistory(history, historyPeriod, historyQuery),
    [history, historyPeriod, historyQuery]
  );

  const historyByPeriod = useMemo(() => {
    const groups = new Map<string, PortalCourseDto[]>();
    filteredHistory.forEach((course) => {
      groups.set(course.periodCode, [...(groups.get(course.periodCode) ?? []), course]);
    });
    return Array.from(groups.entries());
  }, [filteredHistory]);

  const evolution = useMemo(() => averageByPeriod(history), [history]);

  const scheduleEntries = useMemo<StudentScheduleEntry[]>(() => {
    const entries: StudentScheduleEntry[] = [];
    (data?.courses ?? []).forEach((course) => {
      (course.scheduleBlocks ?? []).forEach((block) => {
        entries.push({
          ...block,
          courseCode: course.courseCode,
          courseName: course.courseName,
        });
      });
    });
    return entries;
  }, [data]);

  const downloadConstancia = async (course: PortalCourseDto) => {
    setDownloadingPdf(true);
    try {
      const filename = await reportService.exportStudentConstancia(course.sectionId);
      toast.success(`Constancia generada: ${filename}`);
    } catch {
      toast.error('No se pudo generar la constancia de notas.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const downloadReport = async () => {
    setDownloadingReport(true);
    try {
      const filename = await reportService.exportStudentReport();
      toast.success(`Reporte generado: ${filename}`);
    } catch {
      toast.error('No se pudo generar el reporte de avance.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const openAttendance = async (course: PortalCourseDto) => {
    setAttendanceCourse(course);
    setAttendanceRecords([]);
    setAttendanceLoading(true);
    try {
      const response = await portalService.getStudentAttendance(course.sectionId);
      setAttendanceRecords(response.data);
    } catch {
      toast.error('No se pudo cargar la asistencia del curso.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const openJustification = (record: PortalAttendanceDto) => {
    setJustifyRecord(record);
    setJustifyReason('');
    setJustifyError(null);
  };

  const submitJustification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!justifyRecord?.id) return;
    const reason = justifyReason.trim();
    if (reason.length < 10) {
      setJustifyError('Describe el motivo con al menos 10 caracteres.');
      return;
    }

    setJustifySaving(true);
    try {
      await portalService.requestAttendanceJustification(justifyRecord.id, reason);
      toast.success('Justificación enviada. El docente la revisará.');
      setJustifyRecord(null);
      if (attendanceCourse) {
        const response = await portalService.getStudentAttendance(attendanceCourse.sectionId);
        setAttendanceRecords(response.data);
      }
    } catch (err) {
      setJustifyError(getApiErrorMessage(err, 'No se pudo enviar la justificación.'));
    } finally {
      setJustifySaving(false);
    }
  };

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

  const evaluationCount = data.courses.reduce((sum, course) => sum + course.grades.length, 0);

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
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={15} />}
            isLoading={downloadingReport}
            onClick={downloadReport}
          >
            Reporte PDF
          </Button>
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

      {data.courses.length > 0 && (
        alerts.length > 0 ? (
          <section className="glass-panel student-panel" aria-label="Alertas académicas">
            <SectionHeader
              compact
              icon={<AlertTriangle size={18} />}
              eyebrow="Atención"
              title="Alertas académicas"
              description="Aspectos del periodo que conviene revisar."
              aside={
                <Badge
                  variant={alerts.some((alert) => alert.tone === 'danger')
                    ? 'danger'
                    : alerts.some((alert) => alert.tone === 'warning') ? 'warning' : 'info'}
                  size="sm"
                >
                  {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
                </Badge>
              }
            />
            <ul className="student-alert-list">
              {alerts.map((alert) => (
                <li className={`student-alert is-${alert.tone}`} key={alert.id}>
                  <strong>{alert.title}</strong>
                  <span>{alert.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="student-alert-success glass-panel">
            <CheckCircle2 size={20} aria-hidden="true" />
            <div>
              <strong>Sin alertas académicas</strong>
              <span>Tu promedio y asistencia están dentro de los parámetros esperados.</span>
            </div>
          </div>
        )
      )}

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
                      {(course.teacherName || course.schedule) && (
                        <p className="student-course-card__meta student-course-card__meta--muted">
                          {course.teacherName && <span>{course.teacherName}</span>}
                          {course.teacherName && course.schedule && <span aria-hidden="true">·</span>}
                          {course.schedule && <span>{course.schedule}</span>}
                        </p>
                      )}
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
                    <div className="student-course-card__actions">
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<CalendarDays size={14} />}
                        onClick={() => openAttendance(course)}
                        aria-label={`Ver asistencia de ${course.courseName}`}
                      >
                        Asistencia
                      </Button>
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
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="student-insights-grid">
        <section className="glass-panel student-panel" aria-label="Horario semanal">
          <SectionHeader
            compact
            icon={<CalendarDays size={18} />}
            eyebrow="Semana"
            title="Horario semanal"
            description="Clases programadas para el periodo vigente."
            aside={
              <Badge variant="outline" size="sm">
                {scheduleEntries.length} {scheduleEntries.length === 1 ? 'bloque' : 'bloques'}
              </Badge>
            }
          />
          <StudentSchedulePanel entries={scheduleEntries} />
        </section>

        <section className="glass-panel student-panel" aria-label="Evaluaciones del periodo">
          <SectionHeader
            compact
            icon={<ClipboardCheck size={18} />}
            eyebrow="Evaluaciones"
            title="Calendario de evaluaciones"
            description="Fechas, pesos y estado de las evaluaciones."
            aside={
              <Badge variant="outline" size="sm">
                {evaluationCount} {evaluationCount === 1 ? 'evaluación' : 'evaluaciones'}
              </Badge>
            }
          />
          <StudentEvaluationsPanel courses={data.courses} />
        </section>
      </div>

      {data.plan && (
        <section className="glass-panel student-panel" aria-label="Malla curricular">
          <SectionHeader
            compact
            icon={<Layers size={18} />}
            eyebrow="Plan de estudios"
            title="Malla curricular"
            description={data.plan.name}
            aside={<Badge variant="outline" size="sm">{data.plan.progressPercent}% de avance</Badge>}
          />
          <StudentPlanPanel plan={data.plan} />
        </section>
      )}

      {evolution.length > 0 && (
        <section className="glass-panel student-panel" aria-label="Evolución del promedio">
          <SectionHeader
            compact
            icon={<TrendingUp size={18} />}
            eyebrow="Rendimiento"
            title="Evolución del promedio"
            description="Promedio de los cursos con nota registrada en cada periodo."
            aside={<Badge variant="outline" size="sm">{evolution.length} {evolution.length === 1 ? 'periodo' : 'periodos'}</Badge>}
          />
          <div className="student-evolution" role="list">
            {evolution.map((point) => (
              <div className="student-evolution__item" role="listitem" key={point.period}>
                <span className="student-evolution__value">{point.average}</span>
                <div className="student-evolution__track" aria-hidden="true">
                  <span style={{ height: `${Math.min(100, (point.average / 20) * 100)}%` }} />
                </div>
                <span className="student-evolution__period">{point.period}</span>
              </div>
            ))}
          </div>
          <p className="student-evolution__caption">
            {evolution.length === 1
              ? 'Aún no hay periodos anteriores con nota para comparar.'
              : 'Escala de 0 a 20 · Se muestran los últimos periodos con nota.'}
          </p>
        </section>
      )}

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

        {history.length > 0 && (
          <div className="history-toolbar">
            <div className="search-box">
              <Search size={15} color="var(--text-muted)" aria-hidden="true" />
              <input
                type="search"
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Buscar por curso o código..."
                aria-label="Buscar curso en el historial"
              />
            </div>
            <Select
              className="field-select"
              aria-label="Filtrar historial por periodo"
              value={historyPeriod}
              onChange={(event) => setHistoryPeriod(event.target.value)}
            >
              <option value="ALL">Todos los periodos</option>
              {historyPeriods.map((period) => (
                <option key={period} value={period}>{period}</option>
              ))}
            </Select>
            {(historyPeriod !== 'ALL' || historyQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHistoryPeriod('ALL');
                  setHistoryQuery('');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}

        {historyLoading ? (
          <LoadingSpinner message="Consultando historial académico..." />
        ) : history.length === 0 ? (
          <div className="history-empty">
            <History size={22} aria-hidden="true" />
            <strong>Sin historial registrado</strong>
            <span>Aún no tienes matrículas en el sistema.</span>
          </div>
        ) : historyByPeriod.length === 0 ? (
          <div className="history-empty">
            <Search size={22} aria-hidden="true" />
            <strong>Sin coincidencias</strong>
            <span>Prueba con otro periodo o término de búsqueda.</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setHistoryPeriod('ALL');
                setHistoryQuery('');
              }}
            >
              Limpiar filtros
            </Button>
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
                      {courses.map((course) => {
                        const summary = courseAverage(course);
                        const status = courseAverageStatus(course, summary);

                        return (
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
                              {summary.value == null ? '—' : (
                                <Badge variant={status.tone === 'danger' ? 'danger' : status.tone === 'success' ? 'success' : 'primary'} size="sm">
                                  {summary.value} · {status.label}
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
                        );
                      })}
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
          <CourseDetailPanel
            course={selected}
            onDownload={() => downloadConstancia(selected)}
            downloading={downloadingPdf}
            minimumGrade={data.minimumGrade ?? 12}
          />
        </Modal>
      )}
      {attendanceCourse && (
        <Modal
          title={`Asistencia · ${attendanceCourse.courseName}`}
          subtitle={`${attendanceCourse.periodCode} · Sección ${attendanceCourse.sectionCode}`}
          icon={<CalendarDays size={20} />}
          maxWidth="640px"
          onClose={() => setAttendanceCourse(null)}
        >
          {attendanceLoading ? (
            <LoadingSpinner message="Consultando asistencia..." />
          ) : (
            <StudentAttendancePanel records={attendanceRecords} onJustify={openJustification} />
          )}
        </Modal>
      )}
      {justifyRecord && (
        <Modal
          title="Justificar inasistencia"
          subtitle={`${formatDate(justifyRecord.date)} · ${attendanceCourse?.courseName ?? 'Curso'}`}
          icon={<FileText size={20} />}
          maxWidth="520px"
          onClose={() => setJustifyRecord(null)}
        >
          <form className="modal-form" onSubmit={submitJustification}>
            <div className="field">
              <label className="field-label" htmlFor="justification-reason">Motivo de la justificación</label>
              <textarea
                id="justification-reason"
                style={{ ...academicInputStyle, minHeight: '110px', resize: 'vertical' }}
                value={justifyReason}
                onChange={(event) => setJustifyReason(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Explica brevemente por qué no pudiste asistir o llegaste tarde."
                data-autofocus
                required
              />
              <span className="field-hint">{justifyReason.length}/500 caracteres</span>
            </div>

            {justifyError && <p className="form-error" role="alert">{justifyError}</p>}

            <div className="modal-form-footer">
              <Button type="button" variant="secondary" onClick={() => setJustifyRecord(null)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={justifySaving}>
                Enviar justificación
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
