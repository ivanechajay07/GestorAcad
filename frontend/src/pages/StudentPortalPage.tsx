import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useToast } from '../contexts/ToastContext';
import { portalService } from '../services/portalService';
import type { PortalCourseDto, StudentPortalDto } from '../services/portalService';
import { BookOpen, ClipboardCheck, GraduationCap, History } from 'lucide-react';

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
      <div className="glass-panel" style={{ padding: '28px', color: 'var(--text-muted)' }}>
        No se encontró una ficha de estudiante vinculada a tu cuenta. Contacta al administrador.
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
        stats={[
          { label: 'Ciclo', value: data.currentCycle },
          { label: 'Créditos aprobados', value: data.approvedCredits },
          { label: 'Promedio', value: data.weightedAverage },
          { label: 'Cursos matriculados', value: data.courses.length },
        ]}
      />

      <div className="glass-panel" style={{ padding: '18px' }}>
        <SectionHeader
          compact
          icon={<BookOpen size={18} />}
          eyebrow="Matrícula vigente"
          title="Cursos y evaluaciones"
          description="Cursos matriculados, asistencia y estado del acta del periodo actual."
        />

        <p className="table-scroll-hint">Desliza para ver más columnas →</p>
        <div className="data-table-wrap">
          <table className="data-table data-table--stack">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Curso</th>
                <th>Sección</th>
                <th>Créditos</th>
                <th>Asistencia</th>
                <th>Acta</th>
                <th>Promedio</th>
                <th style={{ textAlign: 'center' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.courses.map((course) => (
                <tr key={`${course.periodCode}-${course.courseCode}-${course.sectionCode}`}>
                  <td className="cell-mono">{course.periodCode}</td>
                  <td><span className="cell-mono">{course.courseCode}</span> · {course.courseName}</td>
                  <td>{course.sectionCode}</td>
                  <td>{course.credits}</td>
                  <td>{course.present} P · {course.absent} A · {course.late} T</td>
                  <td>
                    <Badge variant={course.actaStatus === 'CERRADA' ? 'success' : 'warning'} size="sm" dot>
                      {course.actaStatus}
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
                    <button type="button" className="action-btn primary" title="Ver notas" aria-label={`Ver notas de ${course.courseCode}`} onClick={() => setSelected(course)}>
                      <ClipboardCheck size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.courses.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      compact
                      icon={<BookOpen size={22} />}
                      title="Sin cursos matriculados"
                      description="Cuando tengas una matrícula activa, aquí verás tus cursos, asistencia y promedio."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '18px' }}>
        <SectionHeader
          compact
          icon={<History size={18} />}
          eyebrow="Trayectoria"
          title="Historial académico"
          description="Matrículas de todos los periodos, incluidas las retiradas."
          aside={<Badge variant="outline" size="sm">{history.length} {history.length === 1 ? 'registro' : 'registros'}</Badge>}
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
          historyByPeriod.map(([period, courses]) => (
            <section key={period} className="history-period" aria-label={`Periodo ${period}`}>
              <div className="history-period__head">
                <span className="history-period__label">Periodo {period}</span>
                <span>{courses.length} curso(s)</span>
              </div>
              <p className="table-scroll-hint">Desliza para ver más columnas →</p>
          <div className="data-table-wrap">
                <table className="data-table data-table--stack">
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
                            {course.actaStatus}
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
                          <button type="button" className="action-btn primary" title="Ver notas" aria-label={`Ver notas de ${course.courseCode}`} onClick={() => setSelected(course)}>
                            <ClipboardCheck size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>

      {selected && (
        <Modal
          title={selected.courseName}
          subtitle={`${selected.periodCode} · Sección ${selected.sectionCode}`}
          icon={<ClipboardCheck size={20} />}
          maxWidth="720px"
          onClose={() => setSelected(null)}
        >
          <div className="data-table-wrap">
            <table className="data-table data-table--stack table--portal-grades">
              <colgroup>
                <col style={{ width: '32%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead><tr><th>Evaluación</th><th>Tipo</th><th>Peso</th><th>Nota</th><th>Máximo</th></tr></thead>
              <tbody>
                {selected.grades.map((grade, index) => (
                  <tr key={`${grade.evaluationName}-${index}`}>
                    <td>{grade.evaluationName}</td>
                    <td>{grade.type}</td>
                    <td>{grade.weight}%</td>
                    <td>{grade.score ?? '—'}</td>
                    <td>{grade.maxScore}</td>
                  </tr>
                ))}
                {selected.grades.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        compact
                        icon={<ClipboardCheck size={22} />}
                        title="Sin evaluaciones registradas"
                        description="El docente todavía no publicó evaluaciones para esta sección."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
};
