import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { LineChart } from '../components/ui/LineChart';
import { BarChart } from '../components/ui/BarChart';
import { DonutChart } from '../components/ui/DonutChart';
import { KpiCard } from '../components/dashboard/KpiCard';
import { PageHeader } from '../components/ui/PageHeader';
import {
  formatCategoryLabel,
  formatCount,
  formatDayLabel,
  formatLongLabel,
  formatPeriod,
  formatRelativeTime,
} from '../utils/dashboardFormatters';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  GraduationCap,
  Layers,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

type TeacherView = 'categoria' | 'facultad';
type BreakdownMode = 'facultad' | 'carrera';
type AuditMode = 'diario' | 'acumulado';
type AnalyticsTab = 'poblacion' | 'claustro' | 'auditoria';

interface ManagementItem {
  key: string;
  label: string;
  hint: string;
  value: number;
  to: string;
  icon: React.ReactNode;
  tone: 'warn' | 'info' | 'danger';
}
type CycleMode = 'linea' | 'barras';

const refreshLabel = (lastUpdated: Date | null, now: number): string =>
  lastUpdated ? `Actualizado ${formatRelativeTime(lastUpdated.toISOString(), new Date(now))}` : 'Sin actualizar';

const greetingFor = (hour: number): string => {
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const DONUT_COLORS = [
  '#1d4ed8',
  '#3b82f6',
  '#0e7490',
  '#60a5fa',
  '#64748b',
  '#94a3b8',
];

/**
 * Panel institucional.
 * Consume un único resumen agregado por permisos. Todas las cifras provienen
 * de la base institucional; no hay datos de demostración ni comparaciones
 * inventadas.
 */
export const DashboardPage: React.FC = () => {
  const { user, role, hasPermission } = useAuth();
  const { summary, loading, error, lastUpdated, reload } = useDashboardSummary();
  const [teacherView, setTeacherView] = useState<TeacherView>('categoria');
  const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>('facultad');
  const [auditMode, setAuditMode] = useState<AuditMode>('diario');
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('poblacion');
  const [cycleMode, setCycleMode] = useState<CycleMode>('linea');
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const institution = summary?.institucion ?? null;
  const students = summary?.estudiantes ?? null;
  const teachers = summary?.docentes ?? null;
  const users = summary?.usuarios ?? null;
  const audit = summary?.auditoria ?? null;
  const management = summary?.gestion ?? null;
  const initialLoading = loading && !summary;
  const isStudent = role === 'ESTUDIANTE';
  const isTeacher = role === 'DOCENTE';
  const isRolePortal = isStudent || isTeacher;

  const managementItems = useMemo<ManagementItem[]>(() => {
    if (!management) return [];
    const items: ManagementItem[] = [
      {
        key: 'students-account',
        label: 'Estudiantes sin cuenta',
        hint: 'No podrán ingresar al portal',
        value: management.estudiantesSinCuenta ?? 0,
        to: '/students',
        icon: <Users size={17} aria-hidden="true" />,
        tone: 'warn',
      },
      {
        key: 'teachers-account',
        label: 'Docentes sin cuenta',
        hint: 'Fichas sin acceso al portal',
        value: management.docentesSinCuenta ?? 0,
        to: '/teachers',
        icon: <GraduationCap size={17} aria-hidden="true" />,
        tone: 'warn',
      },
      {
        key: 'students-photo',
        label: 'Estudiantes sin foto',
        hint: 'Avatar pendiente en su ficha',
        value: management.estudiantesSinFoto ?? 0,
        to: '/students',
        icon: <Camera size={17} aria-hidden="true" />,
        tone: 'info',
      },
      {
        key: 'teachers-photo',
        label: 'Docentes sin foto',
        hint: 'Avatar pendiente en su ficha',
        value: management.docentesSinFoto ?? 0,
        to: '/teachers',
        icon: <Camera size={17} aria-hidden="true" />,
        tone: 'info',
      },
      {
        key: 'locked-users',
        label: 'Cuentas bloqueadas',
        hint: 'Por intentos fallidos de acceso',
        value: management.cuentasBloqueadas ?? 0,
        to: '/users',
        icon: <Lock size={17} aria-hidden="true" />,
        tone: 'danger',
      },
      {
        key: 'observed-students',
        label: 'Estudiantes observados',
        hint: 'Requieren seguimiento académico',
        value: management.estudiantesObservados ?? 0,
        to: '/students',
        icon: <AlertTriangle size={17} aria-hidden="true" />,
        tone: 'danger',
      },
      {
        key: 'low-average',
        label: 'Promedio menor a 13',
        hint: 'Posible riesgo de desaprobar',
        value: management.estudiantesBajoPromedio ?? 0,
        to: '/students',
        icon: <Activity size={17} aria-hidden="true" />,
        tone: 'danger',
      },
    ];
    return items.filter((item) => item.value > 0);
  }, [management]);

  const managementTotal = managementItems.reduce((total, item) => total + item.value, 0);

  const auditDays = summary?.auditoria?.eventosPorDia ?? [];
  const auditHasTrend = auditDays.filter((day) => day.total > 0).length >= 3;
  const auditChart = useMemo(() => {
    const days = summary?.auditoria?.eventosPorDia ?? [];
    return {
      labels: days.map((day) => formatDayLabel(day.etiqueta)),
      values: days.map((day) => day.total),
    };
  }, [summary?.auditoria]);
  const auditWeekTotal = useMemo(
    () => (summary?.auditoria?.eventosPorDia ?? []).reduce((total, day) => total + day.total, 0),
    [summary?.auditoria]
  );
  const auditAverage = auditDays.length > 0 ? Math.round(auditWeekTotal / auditDays.length) : 0;
  const auditPeak = useMemo(() => {
    const days = summary?.auditoria?.eventosPorDia ?? [];
    if (days.length === 0) return null;
    return days.reduce((peak, day) => (day.total > peak.total ? day : peak), days[0]);
  }, [summary?.auditoria]);
  const auditPeakShare = auditPeak && auditWeekTotal > 0
    ? Math.round((auditPeak.total / auditWeekTotal) * 100)
    : 0;
  const auditValues = useMemo(() => {
    const values = summary?.auditoria?.eventosPorDia?.map((day) => day.total) ?? [];
    if (auditMode === 'diario') return values;
    let running = 0;
    return values.map((value) => {
      running += value;
      return running;
    });
  }, [auditMode, summary?.auditoria]);

  const cycleData = summary?.estudiantesPorCiclo;
  const cycleItems = useMemo(
    () => (cycleData ?? []).map((item) => ({
      label: formatLongLabel(item.etiqueta, 12),
      fullLabel: item.etiqueta,
      value: item.total,
    })),
    [cycleData]
  );
  const cycleTotal = cycleItems.reduce((total, item) => total + item.value, 0);

  const teacherCategoryItems = useMemo(
    () => (summary?.docentesPorCategoria ?? []).map((item) => {
      const label = formatCategoryLabel(item.etiqueta);
      return { label, fullLabel: label, value: item.total };
    }),
    [summary?.docentesPorCategoria]
  );
  const teacherFacultyItems = useMemo(
    () => (summary?.docentesPorFacultad ?? []).map((item) => ({
      label: formatLongLabel(item.etiqueta, 18),
      fullLabel: item.etiqueta,
      value: item.total,
    })),
    [summary?.docentesPorFacultad]
  );

  const teacherViews = useMemo<Array<{ key: TeacherView; label: string }>>(() => {
    const views: Array<{ key: TeacherView; label: string }> = [];
    if (summary?.docentesPorCategoria != null) views.push({ key: 'categoria', label: 'Categoría' });
    if (summary?.docentesPorFacultad != null) views.push({ key: 'facultad', label: 'Facultad' });
    return views;
  }, [summary?.docentesPorCategoria, summary?.docentesPorFacultad]);

  const effectiveTeacherView: TeacherView = teacherViews.some((view) => view.key === teacherView)
    ? teacherView
    : teacherViews[0]?.key ?? 'categoria';
  const teacherItems = effectiveTeacherView === 'categoria' ? teacherCategoryItems : teacherFacultyItems;

  const facultyData = summary?.estudiantesPorFacultad;
  const careerData = summary?.estudiantesPorCarrera;
  const facultyBreakdown = useMemo(
    () => (facultyData ?? []).map((item) => ({
      label: formatLongLabel(item.etiqueta, 48),
      value: item.total,
    })),
    [facultyData]
  );
  const careerBreakdown = useMemo(
    () => (careerData ?? []).map((item) => ({
      label: formatLongLabel(item.etiqueta, 48),
      value: item.total,
    })),
    [careerData]
  );
  const availableBreakdownModes: BreakdownMode[] = [];
  if (facultyData != null) availableBreakdownModes.push('facultad');
  if (careerData != null) availableBreakdownModes.push('carrera');
  const effectiveBreakdownMode: BreakdownMode = availableBreakdownModes.includes(breakdownMode)
    ? breakdownMode
    : availableBreakdownModes[0] ?? 'facultad';
  const breakdownItems = effectiveBreakdownMode === 'facultad' ? facultyBreakdown : careerBreakdown;

  const kpis: React.ReactNode[] = [];

  if (students) {
    const inactive = Math.max(students.total - students.activos, 0);
    kpis.push(
      <KpiCard
        key="estudiantes"
        label="Estudiantes"
        value={formatCount(students.total)}
        hint={`${formatCount(students.activos)} activos · ${formatCount(inactive)} inactivos`}
        icon={<Users size={18} />}
        accent="var(--primary)"
        to="/students"
        loading={loading}
        meter={students.total > 0 ? {
          value: students.activos,
          max: students.total,
          label: 'Activos',
        } : undefined}
      />
    );
  }

  if (teachers) {
    kpis.push(
      <KpiCard
        key="docentes"
        label="Docentes"
        value={formatCount(teachers.total)}
        hint={`${formatCount(teachers.activos)} docentes activos`}
        icon={<GraduationCap size={18} />}
        accent="var(--accent-violet)"
        to="/teachers"
        loading={loading}
        meter={teachers.total > 0 ? {
          value: teachers.activos,
          max: teachers.total,
          label: 'Activos',
        } : undefined}
      />
    );
  }

  if (users) {
    kpis.push(
      <KpiCard
        key="usuarios"
        label="Usuarios"
        value={formatCount(users.total)}
        hint={`${formatCount(users.activos)} cuentas activas`}
        icon={<ShieldCheck size={18} />}
        accent="var(--accent-cyan)"
        to="/users"
        loading={loading}
        meter={users.total > 0 ? {
          value: users.activos,
          max: users.total,
          label: 'Activas',
        } : undefined}
      />
    );
  }

  if (audit) {
    kpis.push(
      <KpiCard
        key="auditoria"
        label="Eventos 7d"
        value={formatCount(auditWeekTotal)}
        hint={`Total histórico: ${formatCount(audit.eventosTotales)}`}
        icon={<Activity size={18} />}
        accent="var(--accent-emerald)"
        to="/audit"
        loading={loading}
      />
    );
  }

  if (summary?.facultades != null) {
    kpis.push(
      <KpiCard
        key="facultades"
        label="Facultades"
        value={formatCount(summary.facultades)}
        hint="Con matrícula activa"
        icon={<Building2 size={18} />}
        accent="var(--accent-amber)"
        loading={loading}
      />
    );
  }

  if (summary?.carreras != null) {
    kpis.push(
      <KpiCard
        key="carreras"
        label="Carreras"
        value={formatCount(summary.carreras)}
        hint="Con estudiantes activos"
        icon={<Layers size={18} />}
        accent="var(--accent-rose)"
        loading={loading}
      />
    );
  }

  const firstName = user?.fullName?.split(' ')[0] ?? user?.username ?? 'usuario';
  const userInitials = (
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.trim()
    || (user?.fullName ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
    || user?.username?.slice(0, 2)
    || 'GA'
  ).toUpperCase();
  const greeting = greetingFor(new Date(now).getHours());
  const hasStudentsDistribution = availableBreakdownModes.length > 0;
  const hasTeacherDistribution = teacherViews.length > 0;
  const teacherTotal = teacherItems.reduce((total, item) => total + item.value, 0);
  const teacherColor = 'var(--primary)';

  const analyticsTabs: Array<{ key: AnalyticsTab; label: string; icon: React.ReactNode }> = [
    { key: 'poblacion', label: 'Población estudiantil', icon: <Users size={15} aria-hidden="true" /> },
  ];
  if (hasTeacherDistribution) {
    analyticsTabs.push({ key: 'claustro', label: 'Claustro docente', icon: <GraduationCap size={15} aria-hidden="true" /> });
  }
  if (audit) {
    analyticsTabs.push({ key: 'auditoria', label: 'Actividad de auditoría', icon: <TrendingUp size={15} aria-hidden="true" /> });
  }
  const effectiveAnalyticsTab: AnalyticsTab = analyticsTabs.some((tab) => tab.key === analyticsTab)
    ? analyticsTab
    : analyticsTabs[0].key;

  const primaryAction = isStudent
    ? { to: '/my-progress', label: 'Mi avance académico', icon: <GraduationCap size={16} /> }
    : isTeacher
      ? { to: '/my-sections', label: 'Mis secciones', icon: <BookOpen size={16} /> }
      : hasPermission('ESTUDIANTE_VIEW')
        ? { to: '/students', label: 'Padrón estudiantil', icon: <Users size={16} /> }
        : hasPermission('UNIVERSIDAD_VIEW')
          ? { to: '/university', label: 'Institución', icon: <Building2 size={16} /> }
          : { to: '/assistant', label: 'Asistente académico', icon: <Sparkles size={16} /> };

  const subtitle = isStudent
    ? 'Revisa tus cursos matriculados, calificaciones y el avance de tus créditos.'
    : isTeacher
      ? 'Accede a tus secciones para registrar notas, asistencia y cerrar actas.'
      : `${institution?.nombre ?? 'Gestor Académico Virtual'}${institution?.nombreCorto ? ` · ${institution.nombreCorto}` : ''}`;

  return (
    <div className="dash-stack" aria-busy={initialLoading}>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={subtitle}
        icon={
          user?.avatar
            ? <img src={user.avatar} alt="" className="page-header__avatar" />
            : <span className="page-header__avatar-initials">{userInitials}</span>
        }
        iconVariant="avatar"
        accent="var(--primary)"
        eyebrow={
          <>
            <span className="hero-dot" aria-hidden="true" />
            Panel institucional
            <span className="hero-sep" aria-hidden="true">·</span>
            <Calendar size={13} aria-hidden="true" />
            {formatPeriod(institution?.periodo)}
          </>
        }
        badges={
          <>
            <Badge variant="outline">{role ?? 'SIN ROL'}</Badge>
            <span className="page-header__updated">
              <RefreshCw size={12} aria-hidden="true" />
              {refreshLabel(lastUpdated, now)}
            </span>
          </>
        }
        actions={
          <>
            <Link to={primaryAction.to} className="link-clean">
              <Button
                variant="primary"
                size="sm"
                leftIcon={primaryAction.icon}
                rightIcon={<ArrowRight size={15} />}
              >
                {primaryAction.label}
              </Button>
            </Link>
            {primaryAction.to !== '/assistant' && (
              <Link to="/assistant" className="link-clean">
                <Button variant="secondary" size="sm" leftIcon={<Sparkles size={15} />}>
                  Asistente
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={reload}
              isLoading={loading}
              leftIcon={<RefreshCw size={15} aria-hidden="true" />}
            >
              Actualizar
            </Button>
          </>
        }
      />

      {error && summary && (
        <div className="dash-alert" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          <span><strong>No se pudo actualizar el panel.</strong> {error}</span>
          <Button variant="outline" size="sm" onClick={reload}>Reintentar</Button>
        </div>
      )}

      {!isRolePortal && (
        <>
          <section className="dash-section" aria-labelledby="dash-kpis-title">
            <SectionHeader
              id="dash-kpis-title"
              eyebrow="Resumen"
              title="Indicadores institucionales"
              description="Cifras agregadas de la base institucional."
              icon={<Activity size={18} />}
            />

            {error && !summary ? (
              <Card className="dash-state-card">
                <EmptyState
                  icon={<AlertTriangle size={24} />}
                  title="No se pudo cargar el panel"
                  description={error}
                  action={<Button onClick={reload} leftIcon={<RefreshCw size={16} />}>Reintentar</Button>}
                />
              </Card>
            ) : initialLoading ? (
              <>
                <div className="dash-kpi-grid" aria-hidden="true">
                  {Array.from({ length: 6 }, (_, index) => (
                    <div className="dash-skeleton dash-skeleton--kpi" key={index} />
                  ))}
                </div>
                <span className="sr-only" role="status">Cargando indicadores del panel…</span>
              </>
            ) : kpis.length > 0 ? (
              <div className="dash-kpi-band">{kpis}</div>
            ) : (
              <Card className="dash-state-card">
                <EmptyState
                  title="Sin indicadores visibles"
                  description="Tu perfil no tiene permisos de consulta sobre los módulos del panel."
                />
              </Card>
            )}
          </section>

          {summary && management && (
            <section className="dash-section" aria-labelledby="dash-management-title">
              <SectionHeader
                id="dash-management-title"
                eyebrow="Atención"
                title="Pendientes de gestión"
                description="Fichas, accesos y casos académicos que requieren una acción concreta."
                icon={<AlertTriangle size={18} />}
                aside={
                  <Badge variant={managementTotal > 0 ? 'warning' : 'success'} size="sm" dot>
                    {managementTotal > 0 ? `${managementTotal} pendientes` : 'Todo en orden'}
                  </Badge>
                }
              />
              {managementTotal > 0 ? (
                <div className="dash-management-grid">
                  {managementItems.map((item) => (
                    <Link key={item.key} to={item.to} className={`dash-management-card dash-management-card--${item.tone}`}>
                      <span className="dash-management-card__icon">{item.icon}</span>
                      <div className="dash-management-card__copy">
                        <strong>{formatCount(item.value)}</strong>
                        <span>{item.label}</span>
                        <small>{item.hint}</small>
                      </div>
                      <ArrowRight size={15} className="dash-management-card__arrow" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="dash-management-empty">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <div>
                    <strong>Sin pendientes críticos</strong>
                    <span>Las cuentas, fotos y casos académicos visibles están al día.</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {initialLoading && (
            <section className="dash-section" aria-hidden="true">
              <div className="dash-skeleton dash-skeleton--heading" />
              <div className="dash-skeleton dash-skeleton--console" />
              <div className="dash-skeleton dash-skeleton--coverage" />
            </section>
          )}

          {summary && (
            <>
              <section className="dash-section" aria-labelledby="dash-analytics-title">
                <SectionHeader
                  id="dash-analytics-title"
                  eyebrow="Analítica"
                  title="Estado académico e institucional"
                  description="Explora la población estudiantil, el claustro docente y la actividad registrada."
                  icon={<TrendingUp size={18} />}
                />

                <div className="dash-console glass-panel">
                  <div className="dash-console__toolbar">
                    <div className="dash-console__tabs" role="tablist" aria-label="Vistas analíticas del panel">
                      {analyticsTabs.map((tab) => (
                        <button
                          key={tab.key}
                          id={`dash-tab-${tab.key}`}
                          type="button"
                          role="tab"
                          aria-selected={effectiveAnalyticsTab === tab.key}
                          aria-controls={`dash-panel-${tab.key}`}
                          className={`dash-console__tab${effectiveAnalyticsTab === tab.key ? ' is-active' : ''}`}
                          onClick={() => setAnalyticsTab(tab.key)}
                        >
                          {tab.icon}
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>

                  </div>

                  <div
                    id={`dash-panel-${effectiveAnalyticsTab}`}
                    role="tabpanel"
                    aria-labelledby={`dash-tab-${effectiveAnalyticsTab}`}
                    className="dash-console__body"
                  >
                    {effectiveAnalyticsTab === 'poblacion' && (
                      <>
                        {hasStudentsDistribution || cycleData != null ? (
                          <div className="dash-console__grid">
                            <div className="dash-console__pane">
                              <div className="dash-console__pane-head">
                                <div>
                                  <span className="dash-console__kicker">Proporción</span>
                                  <h4>Distribución por {effectiveBreakdownMode === 'facultad' ? 'facultad' : 'carrera'}</h4>
                                  <p>Participación porcentual sobre el total de estudiantes activos.</p>
                                </div>
                                {availableBreakdownModes.length > 1 && (
                                  <div className="dash-console__pane-actions">
                                    <div className="segmented" role="group" aria-label="Agrupar la matrícula por">
                                      <button
                                        type="button"
                                        className={effectiveBreakdownMode === 'facultad' ? 'active' : ''}
                                        aria-pressed={effectiveBreakdownMode === 'facultad'}
                                        onClick={() => setBreakdownMode('facultad')}
                                      >
                                        Facultad
                                      </button>
                                      <button
                                        type="button"
                                        className={effectiveBreakdownMode === 'carrera' ? 'active' : ''}
                                        aria-pressed={effectiveBreakdownMode === 'carrera'}
                                        onClick={() => setBreakdownMode('carrera')}
                                      >
                                        Carrera
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {hasStudentsDistribution ? (
                                <DonutChart
                                  items={breakdownItems.map((item, index) => ({
                                    label: item.label,
                                    value: item.value,
                                    color: DONUT_COLORS[index % DONUT_COLORS.length],
                                  }))}
                                  unit="est."
                                  ariaLabel={`Estudiantes activos por ${effectiveBreakdownMode}`}
                                  description={`Distribución porcentual de estudiantes activos por ${effectiveBreakdownMode}.`}
                                  emptyMessage={`Sin estudiantes activos por ${effectiveBreakdownMode}.`}
                                  centerLabel="Composición"
                                  centerValue="100%"
                                />
                              ) : (
                                <EmptyState
                                  icon={<Layers size={22} />}
                                  title="Sin acceso al padrón"
                                  description="Tu perfil no tiene el permiso ESTUDIANTE_VIEW necesario para ver esta distribución."
                                />
                              )}
                            </div>

                            <div className="dash-console__pane">
                              <div className="dash-console__pane-head">
                                <div>
                                  <span className="dash-console__kicker">Trayectoria curricular</span>
                                  <h4>Matrícula por ciclo</h4>
                                  <p>Evolución de estudiantes activos a lo largo de los ciclos académicos.</p>
                                </div>
                                {cycleData != null && cycleItems.length > 0 && (
                                  <div className="dash-console__pane-actions">
                                    <div className="segmented" role="group" aria-label="Tipo de gráfico para matrícula por ciclo">
                                      <button
                                        type="button"
                                        className={cycleMode === 'linea' ? 'active' : ''}
                                        aria-pressed={cycleMode === 'linea'}
                                        onClick={() => setCycleMode('linea')}
                                      >
                                        Línea
                                      </button>
                                      <button
                                        type="button"
                                        className={cycleMode === 'barras' ? 'active' : ''}
                                        aria-pressed={cycleMode === 'barras'}
                                        onClick={() => setCycleMode('barras')}
                                      >
                                        Barras
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {cycleData != null ? (
                                cycleMode === 'linea' ? (
                                  <LineChart
                                    labels={cycleItems.map((item) => item.label)}
                                    tooltipLabels={cycleItems.map((item) => item.fullLabel ?? item.label)}
                                    series={[{
                                      name: 'Estudiantes',
                                      color: 'var(--primary)',
                                      values: cycleItems.map((item) => item.value),
                                    }]}
                                    suffix=" est."
                                    height={210}
                                    title="Estudiantes activos por ciclo académico"
                                    description="Evolución de estudiantes activos según su ciclo académico."
                                    emptyMessage="Sin estudiantes activos para graficar por ciclo."
                                  />
                                ) : (
                                  <BarChart
                                    items={cycleItems.map((item) => ({
                                      label: item.fullLabel ?? item.label,
                                      value: item.value,
                                    }))}
                                    unit="est."
                                    ariaLabel="Estudiantes activos por ciclo académico"
                                    emptyMessage="Sin estudiantes activos para graficar por ciclo."
                                    total={cycleTotal}
                                    showPercentage
                                  />
                                )
                              ) : (
                                <div className="chart-empty">Sin acceso a la serie de ciclos.</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <EmptyState
                            icon={<Layers size={22} />}
                            title="Sin acceso al padrón"
                            description="Tu perfil no tiene el permiso ESTUDIANTE_VIEW necesario para ver esta información."
                          />
                        )}

                        <div className="dash-console__footer">
                          <span>Datos agregados del padrón estudiantil.</span>
                          {hasPermission('ESTUDIANTE_VIEW') && (
                            <Link to="/students" className="dash-text-link">
                              Ver padrón estudiantil <ArrowRight size={13} aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </>
                    )}

                    {effectiveAnalyticsTab === 'claustro' && (
                      <>
                        <div className="dash-console__grid">
                          <div className="dash-console__pane">
                            <div className="dash-console__pane-head">
                              <div>
                                <span className="dash-console__kicker">Proporción</span>
                                <h4>Composición por {effectiveTeacherView === 'categoria' ? 'categoría' : 'facultad'}</h4>
                                <p>Participación porcentual sobre el claustro activo.</p>
                              </div>
                              {teacherViews.length > 1 && (
                                <div className="dash-console__pane-actions">
                                  <div className="segmented" role="group" aria-label="Agrupar el claustro por">
                                    {teacherViews.map((view) => (
                                      <button
                                        key={view.key}
                                        type="button"
                                        className={effectiveTeacherView === view.key ? 'active' : ''}
                                        aria-pressed={effectiveTeacherView === view.key}
                                        onClick={() => setTeacherView(view.key)}
                                      >
                                        {view.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <DonutChart
                              items={teacherItems.map((item, index) => ({
                                label: item.fullLabel ?? item.label,
                                value: item.value,
                                color: DONUT_COLORS[index % DONUT_COLORS.length],
                              }))}
                              unit="doc."
                              ariaLabel={`Docentes activos por ${effectiveTeacherView}`}
                              description={`Distribución porcentual del claustro activo por ${effectiveTeacherView}.`}
                              emptyMessage={`Sin docentes activos por ${effectiveTeacherView}.`}
                              centerLabel="Composición"
                              centerValue="100%"
                            />
                          </div>

                          <div className="dash-console__pane">
                            <div className="dash-console__pane-head">
                              <div>
                                <span className="dash-console__kicker">Comparación</span>
                                <h4>Detalle del claustro</h4>
                                <p>Docentes activos y peso relativo en cada {effectiveTeacherView === 'categoria' ? 'categoría' : 'facultad'}.</p>
                              </div>
                            </div>
                            <BarChart
                              items={teacherItems.map((item) => ({
                                label: item.fullLabel ?? item.label,
                                value: item.value,
                              }))}
                              unit="doc."
                              color={teacherColor}
                              ariaLabel={`Comparación de docentes activos por ${effectiveTeacherView}`}
                              emptyMessage={`Sin docentes activos por ${effectiveTeacherView}.`}
                              total={teacherTotal}
                              showPercentage
                            />
                          </div>
                        </div>

                        <div className="dash-console__footer">
                          <span>Distribución por {effectiveTeacherView === 'categoria' ? 'categoría' : 'facultad'} del claustro activo.</span>
                          {hasPermission('DOCENTE_VIEW') && (
                            <Link to="/teachers" className="dash-text-link">
                              Ver claustro docente <ArrowRight size={13} aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </>
                    )}

                    {effectiveAnalyticsTab === 'auditoria' && audit && (
                      <>
                        <div className="dash-console__single">
                          <div className="dash-console__pane-head">
                            <div>
                              <span className="dash-console__kicker">Trazabilidad</span>
                              <h4>{auditMode === 'diario' ? 'Eventos registrados por día' : 'Eventos acumulados en 7 días'}</h4>
                              <p>Serie temporal de operaciones registradas en la bitácora.</p>
                            </div>
                            <div className="dash-console__pane-actions">
                              {!auditHasTrend && auditWeekTotal > 0 && (
                                <span className="dash-console__badge">Concentrada en un solo día</span>
                              )}
                              <div className="segmented" role="group" aria-label="Vista de la actividad de auditoría">
                                <button
                                  type="button"
                                  className={auditMode === 'diario' ? 'active' : ''}
                                  aria-pressed={auditMode === 'diario'}
                                  onClick={() => setAuditMode('diario')}
                                >
                                  Diario
                                </button>
                                <button
                                  type="button"
                                  className={auditMode === 'acumulado' ? 'active' : ''}
                                  aria-pressed={auditMode === 'acumulado'}
                                  onClick={() => setAuditMode('acumulado')}
                                >
                                  Acumulado
                                </button>
                              </div>
                            </div>
                          </div>

                          {auditWeekTotal > 0 ? (
                            <LineChart
                              labels={auditChart.labels}
                              series={[{
                                name: auditMode === 'acumulado' ? 'Acumulado' : 'Eventos',
                                color: 'var(--accent-emerald)',
                                values: auditValues,
                              }]}
                              suffix=" ev."
                              height={220}
                              title={auditMode === 'acumulado'
                                ? 'Eventos de auditoría acumulados'
                                : 'Eventos de auditoría por día'}
                              description={`Serie de los últimos ${auditChart.values.length} días en vista ${auditMode === 'acumulado' ? 'acumulada' : 'diaria'}.`}
                              emptyMessage="Aún no hay eventos de auditoría para graficar."
                            />
                          ) : (
                            <div className="chart-empty">Sin eventos de auditoría en los últimos 7 días.</div>
                          )}
                        </div>

                        <div className="dash-console__footer">
                          <span>
                            Promedio diario: <strong>{formatCount(auditAverage)}</strong> eventos
                            {auditPeak && auditPeak.total > 0 && (
                              <> · Mayor actividad: <strong>{formatDayLabel(auditPeak.etiqueta)}</strong> ({auditPeakShare}% de los eventos)</>
                            )}
                          </span>
                          {hasPermission('AUDITORIA_VIEW') && (
                            <Link to="/audit" className="dash-text-link">
                              Ver bitácora <ArrowRight size={13} aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>

              <section className="dash-section" aria-labelledby="dash-coverage-title">
                <SectionHeader
                  id="dash-coverage-title"
                  eyebrow="Gobernanza"
                  title="Cobertura institucional"
                  description="Identidad, licenciamiento y sedes configuradas."
                  icon={<ShieldCheck size={18} />}
                  aside={hasPermission('UNIVERSIDAD_VIEW') ? (
                    <Link to="/university" className="dash-text-link">
                      Ver institución <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  ) : undefined}
                />
                <div className="dash-coverage-card">
                  <div className="dash-coverage-brand">
                    <span className="dash-coverage-logo" aria-hidden="true">
                      <Building2 size={24} />
                    </span>
                    <div className="dash-coverage-copy">
                      <span className="dash-coverage-kicker">Institución</span>
                      <strong>{institution?.nombre ?? 'No configurada'}</strong>
                      <small>
                        {institution?.nombreCorto
                          ? `${institution.nombreCorto} · Panel institucional`
                          : 'Configura la identidad en el módulo Universidad'}
                      </small>
                    </div>
                  </div>

                  <div className="dash-coverage-metrics">
                    <div className="dash-coverage-metric" title={institution?.estadoLicenciamiento ?? 'No registrado'}>
                      <span className="dash-coverage-metric__head">
                        <ShieldCheck size={15} aria-hidden="true" /> Licenciamiento
                      </span>
                      <Badge
                        variant={
                          (institution?.estadoLicenciamiento ?? '').toUpperCase().includes('LICENCIAD')
                            ? 'success'
                            : 'outline'
                        }
                        size="sm"
                        dot
                      >
                        {institution?.estadoLicenciamiento ?? 'No registrado'}
                      </Badge>
                    </div>
                    {institution?.sedesActivas != null && (
                      <div className="dash-coverage-metric">
                        <span className="dash-coverage-metric__head">
                          <MapPin size={15} aria-hidden="true" /> Sedes activas
                        </span>
                        <strong>{formatCount(institution.sedesActivas)}</strong>
                      </div>
                    )}
                  </div>

                  <p className="dash-note">
                    El panel muestra información agregada. No se transfieren datos personales de estudiantes
                    ni docentes al navegador.
                  </p>
                </div>
              </section>
            </>
          )}
        </>
      )}

      <p className="dash-footnote">
        {isRolePortal
          ? 'Los accesos y datos visibles dependen de tu rol y de los permisos asignados a tu cuenta.'
          : 'Cifras calculadas en el servidor sobre la base institucional y filtradas según tus permisos.'}
      </p>
    </div>
  );
};
