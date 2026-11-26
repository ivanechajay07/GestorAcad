import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LayoutGrid,
  Pencil,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Select } from '../components/ui/Select';
import { useToast } from '../contexts/ToastContext';
import { portalService } from '../services/portalService';
import type { TeacherPortalDto } from '../services/portalService';
import { filterTeacherSections, teacherPeriods, teacherTotals } from '../utils/teacherPortal';

export const TeacherPortalPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<TeacherPortalDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    portalService
      .getTeacherSummary()
      .then((res) => setData(res.data))
      .catch(() => toast.error('No se pudo cargar tus secciones'))
      .finally(() => setLoading(false));
  }, [toast]);

  const sections = data?.sections;
  const periods = useMemo(() => teacherPeriods(sections ?? []), [sections]);
  const totals = useMemo(() => teacherTotals(sections ?? []), [sections]);
  const filtered = useMemo(
    () => filterTeacherSections(sections ?? [], { query, period, status }),
    [sections, query, period, status]
  );

  const clearFilters = () => {
    setQuery('');
    setPeriod('ALL');
    setStatus('ALL');
  };

  if (loading) {
    return <LoadingSpinner message="Consultando tus secciones..." />;
  }

  if (!data) {
    return (
      <div className="glass-panel teacher-panel">
        <EmptyState
          icon={<LayoutGrid size={26} />}
          title="Ficha docente no vinculada"
          description="No se encontró una ficha de docente asociada a tu cuenta. Contacta a la administración para completar el vínculo."
        />
      </div>
    );
  }

  const hasFilters = Boolean(query.trim()) || period !== 'ALL' || status !== 'ALL';
  const hasPending = totals.pendingActs > 0 || totals.withoutStudents > 0;

  return (
    <div className="page-stack">
      <PageHeader
        title="Mis secciones"
        subtitle={`${data.name} · ${data.faculty ?? 'Sin facultad asignada'}`}
        icon={<LayoutGrid size={26} color="#ffffff" />}
        breadcrumbs={[{ label: 'Mi espacio' }, { label: 'Mis secciones' }]}
        badges={
          <>
            <Badge variant="outline" size="sm">{data.code}</Badge>
            {data.faculty && <Badge variant="outline" size="sm">{data.faculty}</Badge>}
          </>
        }
        stats={[
          { label: data.sections.length === 1 ? 'Sección' : 'Secciones', value: data.sections.length },
          { label: totals.students === 1 ? 'Estudiante' : 'Estudiantes', value: totals.students },
          { label: totals.evaluations === 1 ? 'Evaluación' : 'Evaluaciones', value: totals.evaluations },
          {
            label: totals.pendingActs === 1 ? 'Acta pendiente' : 'Actas pendientes',
            value: totals.pendingActs,
          },
        ]}
      />

      {data.sections.length > 0 && (hasPending ? (
        <div className="teacher-insights">
          {totals.pendingActs > 0 && (
            <div className="teacher-insight is-warning">
              <span className="teacher-insight__value">{totals.pendingActs}</span>
              <div className="teacher-insight__copy">
                <strong>Actas por cerrar</strong>
                <span>Secciones con el acta abierta.</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setStatus('ABIERTA')}>
                Ver actas
              </Button>
            </div>
          )}
          {totals.withoutStudents > 0 && (
            <div className="teacher-insight">
              <span className="teacher-insight__value">{totals.withoutStudents}</span>
              <div className="teacher-insight__copy">
                <strong>Secciones sin estudiantes</strong>
                <span>Revisa la matrícula de estas secciones.</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="teacher-insight is-success">
          <CheckCircle2 size={22} aria-hidden="true" />
          <div className="teacher-insight__copy">
            <strong>Todo al día</strong>
            <span>No tienes actas pendientes ni secciones vacías.</span>
          </div>
        </div>
      ))}

      <section className="glass-panel teacher-panel" aria-label="Secciones asignadas">
        <SectionHeader
          compact
          icon={<BookOpen size={18} />}
          eyebrow="Carga lectiva"
          title="Secciones asignadas"
          description="Consulta estudiantes, evaluaciones, horarios y el estado del acta."
          aside={
            <Badge variant="outline" size="sm">
              {filtered.length} de {data.sections.length}
            </Badge>
          }
        />

        {data.sections.length > 0 && (
          <div className="teacher-toolbar">
            <div className="search-box">
              <Search size={15} color="var(--text-muted)" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por curso o código..."
                aria-label="Buscar sección por curso o código"
              />
            </div>
            <Select
              className="field-select"
              aria-label="Filtrar secciones por periodo"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value="ALL">Todos los periodos</option>
              {periods.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Select
              className="field-select"
              aria-label="Filtrar secciones por estado del acta"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="ALL">Todas las actas</option>
              <option value="ABIERTA">Acta abierta</option>
              <option value="CERRADA">Acta cerrada</option>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            compact
            icon={<BookOpen size={22} />}
            title={data.sections.length === 0 ? 'Sin secciones asignadas' : 'Sin coincidencias'}
            description={data.sections.length === 0
              ? 'Cuando la coordinación te asigne una sección, aparecerá aquí con sus acciones.'
              : 'Prueba con otro curso, periodo o estado del acta.'}
            action={data.sections.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar filtros</Button>
            ) : undefined}
          />
        ) : (
          <div className="teacher-section-grid">
            {filtered.map((section) => {
              const closed = section.actaStatus === 'CERRADA';
              const titleId = `teacher-section-${section.id}`;

              return (
                <article key={section.id} className="teacher-section-card" aria-labelledby={titleId}>
                  <div className="teacher-section-card__head">
                    <div className="teacher-section-card__identity">
                      <span className="teacher-section-card__code">{section.courseCode}</span>
                      <h3 className="teacher-section-card__title" id={titleId}>{section.courseName}</h3>
                      <p className="teacher-section-card__meta">
                        Periodo {section.periodCode} · Sección {section.sectionCode}
                      </p>
                    </div>
                    <Badge variant={closed ? 'success' : 'warning'} size="sm" dot>
                      {closed ? 'Acta cerrada' : 'Acta abierta'}
                    </Badge>
                  </div>

                  <div className="teacher-section-card__metrics">
                    <div className="teacher-section-card__metric">
                      <span className="teacher-section-card__metric-label">Estudiantes</span>
                      <strong><Users size={15} aria-hidden="true" /> {section.students}</strong>
                    </div>
                    <div className="teacher-section-card__metric">
                      <span className="teacher-section-card__metric-label">Evaluaciones</span>
                      <strong><ClipboardCheck size={15} aria-hidden="true" /> {section.evaluations}</strong>
                    </div>
                  </div>

                  <p className="teacher-section-card__schedule">
                    <Clock3 size={14} aria-hidden="true" />
                    {section.schedule || 'Horario por definir'}
                  </p>

                  <div className="teacher-section-card__actions">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Pencil size={14} />}
                      onClick={() => navigate(`/my-sections/${section.id}?tab=grades`)}
                    >
                      Notas
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<UserCheck size={14} />}
                      onClick={() => navigate(`/my-sections/${section.id}?tab=attendance`)}
                    >
                      Asistencia
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<CheckCircle2 size={14} />}
                      onClick={() => navigate(`/my-sections/${section.id}?tab=act`)}
                    >
                      Acta
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      rightIcon={<ArrowRight size={14} />}
                      onClick={() => navigate(`/my-sections/${section.id}`)}
                      aria-label={`Gestionar ${section.courseCode}-${section.sectionCode}`}
                    >
                      Gestionar
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
