import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { portalService } from '../services/portalService';
import type { PortalCourseDto, StudentPortalDto } from '../services/portalService';
import { BookOpen, ClipboardCheck, GraduationCap, History, UserCheck } from 'lucide-react';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
          <BookOpen size={19} color="var(--primary)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Cursos y evaluaciones</h2>
        </div>

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
                <tr><td colSpan={8} style={{ color: 'var(--text-muted)' }}>No tienes cursos matriculados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '18px' }}>
        <div className="history-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <History size={19} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Historial académico</h2>
              <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Matrículas de todos los periodos, incluidas las retiradas.
              </p>
            </div>
          </div>
          <Badge variant="outline" size="sm">{history.length} {history.length === 1 ? 'registro' : 'registros'}</Badge>
        </div>

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
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="glass-panel modal-card animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label={`Notas de ${selected.courseName}`}
            style={{ width: '100%', maxWidth: '680px', padding: '24px', backgroundColor: 'var(--bg-surface)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <UserCheck size={20} color="var(--primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{selected.courseName}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{selected.periodCode} · Sección {selected.sectionCode}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <p className="table-scroll-hint">Desliza para ver más columnas →</p>
          <div className="data-table-wrap">
              <table className="data-table data-table--stack">
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
                    <tr><td colSpan={5} style={{ color: 'var(--text-muted)' }}>Aún no hay evaluaciones registradas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
