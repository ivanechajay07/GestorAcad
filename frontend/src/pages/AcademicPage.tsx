import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { academicService } from '../services/academicService';
import type { AcademicPeriodDto, CourseDto } from '../services/academicService';
import { AcademicField, AcademicFormError, AcademicModal, academicErrMsg, academicFormatDate, academicInputStyle } from '../components/academic/AcademicUi';
import { StudyPlansTab } from '../components/academic/StudyPlansTab';
import { SectionsTab } from '../components/academic/SectionsTab';
import { EnrollmentsTab } from '../components/academic/EnrollmentsTab';
import { CoursePrerequisitesModal } from '../components/academic/CoursePrerequisitesModal';
import {
  AlignLeft,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  GitBranch,
  Grid3X3,
  Hash,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
} from 'lucide-react';

type TabKey = 'periods' | 'courses' | 'plans' | 'sections' | 'enrollments';

const COURSE_TYPES: { value: string; label: string }[] = [
  { value: 'GENERAL', label: 'Formación general' },
  { value: 'ESPECIFICO', label: 'Formación específica' },
  { value: 'ELECTIVO', label: 'Electivo' },
];

const inputStyle = academicInputStyle;
const errMsg = academicErrMsg;
const formatDate = academicFormatDate;
const Field = AcademicField;
const Modal = AcademicModal;

const emptyPeriod = (): AcademicPeriodDto => ({
  code: '',
  name: '',
  startDate: '',
  endDate: '',
  enrollmentStart: '',
  enrollmentEnd: '',
});

const emptyCourse = (): CourseDto => ({
  code: '',
  name: '',
  credits: 3,
  theoryHours: 2,
  practiceHours: 2,
  type: 'GENERAL',
  description: '',
});

export const AcademicPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();

  const canViewPeriods = hasPermission('PERIODO_VIEW');
  const canViewCourses = hasPermission('CURSO_VIEW');
  const canViewPlans = hasPermission('PLAN_VIEW');
  const canViewSections = hasPermission('SECCION_VIEW');
  const canViewEnrollments = hasPermission('MATRICULA_VIEW');
  const canCreatePeriod = hasPermission('PERIODO_CREATE');
  const canEditPeriod = hasPermission('PERIODO_EDIT');
  const canDeletePeriod = hasPermission('PERIODO_DELETE');
  const canCreateCourse = hasPermission('CURSO_CREATE');
  const canEditCourse = hasPermission('CURSO_EDIT');
  const canDeleteCourse = hasPermission('CURSO_DELETE');

  const initialTab: TabKey = canViewPeriods
    ? 'periods'
    : canViewCourses
      ? 'courses'
      : canViewPlans
        ? 'plans'
        : canViewSections
          ? 'sections'
          : 'enrollments';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [periods, setPeriods] = useState<AcademicPeriodDto[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [periodModal, setPeriodModal] = useState(false);
  const [periodForm, setPeriodForm] = useState<AcademicPeriodDto>(emptyPeriod());
  const [courseModal, setCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseDto>(emptyCourse());
  const [prereqCourse, setPrereqCourse] = useState<CourseDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const tasks: Promise<unknown>[] = [];
    if (canViewPeriods) {
      tasks.push(academicService.getPeriods().then((res) => setPeriods(res.data)));
    }
    if (canViewCourses) {
      tasks.push(academicService.getCourses().then((res) => setCourses(res.data)));
    }
    try {
      const results = await Promise.allSettled(tasks);
      const failed = results.find((r) => r.status === 'rejected');
      if (failed && failed.status === 'rejected') {
        toast.error(errMsg(failed.reason, 'No se pudo cargar la estructura académica'));
      }
    } finally {
      setLoading(false);
    }
  }, [canViewPeriods, canViewCourses, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const currentPeriod = useMemo(() => periods.find((p) => p.current && p.active !== false), [periods]);
  const totalCredits = useMemo(
    () => courses.filter((c) => c.active !== false).reduce((sum, c) => sum + c.credits, 0),
    [courses]
  );

  const flashSuccess = (message: string) => toast.success(message);

  const headerStats = [
    ...(canViewPeriods
      ? [
          { label: 'Periodos', value: periods.length },
          { label: 'Periodo vigente', value: currentPeriod?.code ?? '—' },
        ]
      : []),
    ...(canViewCourses
      ? [
          { label: 'Cursos', value: courses.length },
          { label: 'Créditos del catálogo', value: totalCredits },
        ]
      : []),
  ];

  const openPeriodModal = (period?: AcademicPeriodDto) => {
    setFormError(null);
    setPeriodForm(period ? { ...period } : emptyPeriod());
    setPeriodModal(true);
  };

  const openCourseModal = (course?: CourseDto) => {
    setFormError(null);
    setCourseForm(course ? { ...course } : emptyCourse());
    setCourseModal(true);
  };

  const handleSavePeriod = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload: AcademicPeriodDto = {
        ...periodForm,
        enrollmentStart: periodForm.enrollmentStart || undefined,
        enrollmentEnd: periodForm.enrollmentEnd || undefined,
      };
      if (periodForm.id) {
        await academicService.updatePeriod(periodForm.id, payload);
      } else {
        await academicService.createPeriod(payload);
      }
      setPeriodModal(false);
      flashSuccess(periodForm.id ? 'Periodo actualizado correctamente.' : 'Periodo registrado correctamente.');
      await reload();
    } catch (err) {
      setFormError(errMsg(err, 'No se pudo guardar el periodo'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (courseForm.id) {
        await academicService.updateCourse(courseForm.id, courseForm);
      } else {
        await academicService.createCourse(courseForm);
      }
      setCourseModal(false);
      flashSuccess(courseForm.id ? 'Curso actualizado correctamente.' : 'Curso registrado correctamente.');
      await reload();
    } catch (err) {
      setFormError(errMsg(err, 'No se pudo guardar el curso'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivatePeriod = async (period: AcademicPeriodDto) => {
    if (!period.id) return;
    const ok = await confirm({
      title: 'Activar periodo académico',
      message: `¿Marcar ${period.code} como periodo vigente? El Dashboard y las notificaciones usarán este periodo.`,
      confirmLabel: 'Activar',
    });
    if (!ok) return;
    try {
      await academicService.activatePeriod(period.id);
      flashSuccess(`Periodo ${period.code} activado.`);
      await reload();
    } catch (err) {
      toast.error(errMsg(err, 'No se pudo activar el periodo'));
    }
  };

  const handleDeletePeriod = async (period: AcademicPeriodDto) => {
    if (!period.id) return;
    const ok = await confirm({
      title: 'Desactivar periodo',
      message: `¿Desactivar el periodo ${period.code}? No podrá usarse en nuevas secciones o matrículas.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await academicService.deletePeriod(period.id);
      setPeriods((prev) => prev.map((p) => (p.id === period.id ? { ...p, active: false } : p)));
      flashSuccess('Periodo desactivado.');
    } catch (err) {
      toast.error(errMsg(err, 'No se pudo desactivar el periodo'));
    }
  };

  const handleDeleteCourse = async (course: CourseDto) => {
    if (!course.id) return;
    const ok = await confirm({
      title: 'Desactivar curso',
      message: `¿Desactivar el curso ${course.code}?`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await academicService.deleteCourse(course.id);
      setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, active: false } : c)));
      flashSuccess('Curso desactivado.');
    } catch (err) {
      toast.error(errMsg(err, 'No se pudo desactivar el curso'));
    }
  };

  const tabButton = (key: TabKey, label: string, icon: React.ReactNode) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={activeTab === key}
      className={`academic-tab${activeTab === key ? ' active' : ''}`}
      onClick={() => setActiveTab(key)}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="page-stack">
      <PageHeader
        title="Estructura Académica"
        subtitle={
          canViewPeriods
            ? 'Periodos, planes de estudio, secciones y matrícula en un solo lugar.'
            : 'Catálogo de cursos de la institución.'
        }
        icon={<Layers size={26} color="#ffffff" />}
        breadcrumbs={[{ label: 'Gestión Académica' }, { label: 'Estructura Académica' }]}
        stats={headerStats}
      />

      <div className="academic-tabs" role="tablist" aria-label="Secciones del módulo académico">
        {canViewPeriods && tabButton('periods', 'Periodos', <CalendarDays size={15} />)}
        {canViewCourses && tabButton('courses', 'Cursos', <BookOpen size={15} />)}
        {canViewPlans && tabButton('plans', 'Planes de estudio', <ClipboardList size={15} />)}
        {canViewSections && tabButton('sections', 'Secciones', <Grid3X3 size={15} />)}
        {canViewEnrollments && tabButton('enrollments', 'Matrículas', <UserCheck size={15} />)}
      </div>

      {loading ? (
        <LoadingSpinner message="Consultando la estructura académica..." />
      ) : (
        <>
          {activeTab === 'periods' && canViewPeriods && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <CalendarDays size={19} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                    Periodos académicos ({periods.length})
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button variant="secondary" size="sm" onClick={reload} leftIcon={<RefreshCw size={15} />}>
                    Actualizar
                  </Button>
                  {canCreatePeriod && (
                    <Button size="sm" onClick={() => openPeriodModal()} leftIcon={<Plus size={15} />}>
                      Nuevo Periodo
                    </Button>
                  )}
                </div>
              </div>

              <div className="data-table-wrap">
                <table className="data-table data-table--stack">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Inicio / Fin</th>
                      <th>Matrícula</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period.id}>
                        <td className="cell-strong cell-mono">{period.code}</td>
                        <td>{period.name}</td>
                        <td>{formatDate(period.startDate)} — {formatDate(period.endDate)}</td>
                        <td>{formatDate(period.enrollmentStart)} — {formatDate(period.enrollmentEnd)}</td>
                        <td>
                          {period.current && period.active !== false ? (
                            <Badge variant="success" size="sm" dot>Vigente</Badge>
                          ) : period.active === false ? (
                            <Badge variant="danger" size="sm" dot>Inactivo</Badge>
                          ) : (
                            <Badge variant="outline" size="sm">Disponible</Badge>
                          )}
                        </td>
                        <td>
                          <div className="action-group" style={{ justifyContent: 'center' }}>
                            {canEditPeriod && period.active !== false && !period.current && (
                              <button
                                type="button"
                                className="action-btn primary"
                                title="Activar periodo"
                                aria-label={`Activar ${period.code}`}
                                onClick={() => handleActivatePeriod(period)}
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}
                            {canEditPeriod && (
                              <button
                                type="button"
                                className="action-btn primary"
                                title="Editar"
                                aria-label={`Editar ${period.code}`}
                                onClick={() => openPeriodModal(period)}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {canDeletePeriod && period.active !== false && !period.current && (
                              <button
                                type="button"
                                className="action-btn danger"
                                title="Desactivar"
                                aria-label={`Desactivar ${period.code}`}
                                onClick={() => handleDeletePeriod(period)}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {periods.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ color: 'var(--text-muted)' }}>No hay periodos registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'courses' && canViewCourses && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <BookOpen size={19} color="var(--accent-cyan)" />
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                    Catálogo de cursos ({courses.length})
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button variant="secondary" size="sm" onClick={reload} leftIcon={<RefreshCw size={15} />}>
                    Actualizar
                  </Button>
                  {canCreateCourse && (
                    <Button size="sm" onClick={() => openCourseModal()} leftIcon={<Plus size={15} />}>
                      Nuevo Curso
                    </Button>
                  )}
                </div>
              </div>

              <div className="data-table-wrap">
                <table className="data-table data-table--stack">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Curso</th>
                      <th>Créditos</th>
                      <th>Horas (T / P / Total)</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td className="cell-strong cell-mono">{course.code}</td>
                        <td>{course.name}</td>
                        <td>{course.credits}</td>
                        <td>{course.theoryHours} / {course.practiceHours} / {course.totalHours ?? course.theoryHours + course.practiceHours}</td>
                        <td><Badge variant="role" size="sm">{COURSE_TYPES.find((t) => t.value === course.type)?.label ?? course.type}</Badge></td>
                        <td>
                          <Badge variant={course.active === false ? 'danger' : 'success'} size="sm" dot>
                            {course.active === false ? 'Inactivo' : 'Activo'}
                          </Badge>
                        </td>
                        <td>
                          <div className="action-group" style={{ justifyContent: 'center' }}>
                            {canEditCourse && (
                              <button
                                type="button"
                                className="action-btn primary"
                                title="Prerrequisitos"
                                aria-label={`Prerrequisitos de ${course.code}`}
                                onClick={() => setPrereqCourse(course)}
                              >
                                <GitBranch size={15} />
                              </button>
                            )}
                            {canEditCourse && (
                              <button
                                type="button"
                                className="action-btn primary"
                                title="Editar"
                                aria-label={`Editar ${course.code}`}
                                onClick={() => openCourseModal(course)}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {canDeleteCourse && course.active !== false && (
                              <button
                                type="button"
                                className="action-btn danger"
                                title="Desactivar"
                                aria-label={`Desactivar ${course.code}`}
                                onClick={() => handleDeleteCourse(course)}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ color: 'var(--text-muted)' }}>No hay cursos registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'plans' && canViewPlans && <StudyPlansTab />}
          {activeTab === 'sections' && canViewSections && <SectionsTab />}
          {activeTab === 'enrollments' && canViewEnrollments && <EnrollmentsTab />}
        </>
      )}

      {periodModal && (
        <Modal
          title={periodForm.id ? 'Editar Periodo' : 'Registrar Periodo'}
          subtitle="Define el calendario lectivo y la ventana de matrícula."
          icon={<CalendarDays size={20} color="var(--primary)" />}
          onClose={() => setPeriodModal(false)}
        >
          <AcademicFormError message={formError} />
          <form onSubmit={handleSavePeriod} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-section">Identificación del periodo</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
              <Field label="Código" icon={<Hash size={13} />} hint="Formato recomendado: AAAA-I o AAAA-II.">
                <input style={inputStyle} required value={periodForm.code} onChange={(e) => setPeriodForm({ ...periodForm, code: e.target.value })} placeholder="Ej. 2026-I" />
              </Field>
              <Field label="Nombre" icon={<FileText size={13} />}>
                <input style={inputStyle} required value={periodForm.name} onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })} placeholder="Ej. Periodo Académico 2026-I" />
              </Field>
            </div>

            <div className="form-section">Calendario de clases</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
              <Field label="Inicio de clases" icon={<CalendarDays size={13} />}>
                <input style={inputStyle} type="date" required value={periodForm.startDate} onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })} />
              </Field>
              <Field label="Fin de clases" icon={<CalendarDays size={13} />}>
                <input style={inputStyle} type="date" required value={periodForm.endDate} onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })} />
              </Field>
            </div>

            <div className="form-section">Ventana de matrícula</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
              <Field label="Inicio de matrícula" icon={<UserCheck size={13} />}>
                <input style={inputStyle} type="date" value={periodForm.enrollmentStart ?? ''} onChange={(e) => setPeriodForm({ ...periodForm, enrollmentStart: e.target.value })} />
              </Field>
              <Field label="Fin de matrícula" icon={<UserCheck size={13} />}>
                <input style={inputStyle} type="date" value={periodForm.enrollmentEnd ?? ''} onChange={(e) => setPeriodForm({ ...periodForm, enrollmentEnd: e.target.value })} />
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => setPeriodModal(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {periodForm.id ? 'Guardar cambios' : 'Registrar periodo'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {courseModal && (
        <Modal
          title={courseForm.id ? 'Editar Curso' : 'Registrar Curso'}
          subtitle="Datos del curso, créditos y carga horaria."
          icon={<BookOpen size={20} color="var(--accent-cyan)" />}
          onClose={() => setCourseModal(false)}
        >
          <AcademicFormError message={formError} />
          <form onSubmit={handleSaveCourse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-section">Identificación del curso</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap: '12px' }}>
              <Field label="Código" icon={<Hash size={13} />} hint="Formato recomendado: MAT-101.">
                <input style={inputStyle} required value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} placeholder="Ej. MAT-101" />
              </Field>
              <Field label="Nombre" icon={<BookOpen size={13} />}>
                <input style={inputStyle} required value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="Ej. Matemática I" />
              </Field>
              <Field label="Tipo" icon={<Layers size={13} />}>
                <select style={inputStyle} value={courseForm.type} onChange={(e) => setCourseForm({ ...courseForm, type: e.target.value })}>
                  {COURSE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </Field>
            </div>

            <div className="form-section">Créditos y carga horaria</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '12px' }}>
              <Field label="Créditos" icon={<Award size={13} />}>
                <input style={inputStyle} type="number" min={1} max={30} required value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: Number(e.target.value) })} placeholder="Ej. 3" />
              </Field>
              <Field label="Horas teóricas" icon={<Clock size={13} />}>
                <input style={inputStyle} type="number" min={0} max={40} value={courseForm.theoryHours} onChange={(e) => setCourseForm({ ...courseForm, theoryHours: Number(e.target.value) })} placeholder="Ej. 2" />
              </Field>
              <Field label="Horas prácticas" icon={<Clock size={13} />}>
                <input style={inputStyle} type="number" min={0} max={40} value={courseForm.practiceHours} onChange={(e) => setCourseForm({ ...courseForm, practiceHours: Number(e.target.value) })} placeholder="Ej. 2" />
              </Field>
            </div>
            <Field label="Descripción" icon={<AlignLeft size={13} />}>
              <input style={inputStyle} value={courseForm.description ?? ''} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Ej. Fundamentos de álgebra, funciones y cálculo diferencial" />
            </Field>
            <p className="field-hint">
              <Clock size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
              Horas totales: {courseForm.theoryHours + courseForm.practiceHours}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => setCourseModal(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {courseForm.id ? 'Guardar cambios' : 'Registrar curso'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {prereqCourse && (
        <CoursePrerequisitesModal course={prereqCourse} onClose={() => setPrereqCourse(null)} />
      )}
    </div>
  );
};
