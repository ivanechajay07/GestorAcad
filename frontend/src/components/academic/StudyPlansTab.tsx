import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useToast } from '../../contexts/ToastContext';
import { academicService } from '../../services/academicService';
import type { CourseDto, PlanCourseDto, StudyPlanDto } from '../../services/academicService';
import { universityService } from '../../services/universityService';
import type { CareerDto } from '../../services/universityService';
import {
  AcademicField,
  AcademicFormError,
  AcademicModal,
  academicErrMsg,
  academicInputStyle,
} from './AcademicUi';
import {
  AlignLeft,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Hash,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const emptyPlan = (): StudyPlanDto => ({
  careerId: 0,
  code: '',
  name: '',
  year: CURRENT_YEAR,
  description: '',
});

export const StudyPlansTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();

  const canCreate = hasPermission('PLAN_CREATE');
  const canEdit = hasPermission('PLAN_EDIT');
  const canDelete = hasPermission('PLAN_DELETE');

  const [plans, setPlans] = useState<StudyPlanDto[]>([]);
  const [careers, setCareers] = useState<CareerDto[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [planModal, setPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState<StudyPlanDto>(emptyPlan());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<StudyPlanDto | null>(null);
  const [planCourses, setPlanCourses] = useState<PlanCourseDto[]>([]);
  const [mallaLoading, setMallaLoading] = useState(false);
  const [courseToAdd, setCourseToAdd] = useState<number>(0);
  const [cycleToAdd, setCycleToAdd] = useState(1);
  const [mandatoryToAdd, setMandatoryToAdd] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const tasks: Promise<unknown>[] = [academicService.getPlans().then((res) => setPlans(res.data))];
    if (hasPermission('CARRERA_VIEW')) {
      tasks.push(universityService.getCareers().then((res) => setCareers(res.data)));
    }
    if (hasPermission('CURSO_VIEW')) {
      tasks.push(academicService.getCourses().then((res) => setCourses(res.data)));
    }
    try {
      const results = await Promise.allSettled(tasks);
      const failed = results.find((r) => r.status === 'rejected');
      if (failed && failed.status === 'rejected') {
        toast.error(academicErrMsg(failed.reason, 'No se pudieron cargar los planes de estudio'));
      }
    } finally {
      setLoading(false);
    }
  }, [hasPermission, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const availableCourses = useMemo(
    () => courses.filter((c) => c.active !== false && !planCourses.some((pc) => pc.courseId === c.id)),
    [courses, planCourses]
  );

  const openPlanModal = (plan?: StudyPlanDto) => {
    setFormError(null);
    setPlanForm(plan ? { ...plan } : emptyPlan());
    setPlanModal(true);
  };

  const handleSavePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (planForm.id) {
        await academicService.updatePlan(planForm.id, planForm);
      } else {
        await academicService.createPlan(planForm);
      }
      setPlanModal(false);
      toast.success(planForm.id ? 'Plan actualizado correctamente.' : 'Plan registrado correctamente.');
      await reload();
    } catch (err) {
      setFormError(academicErrMsg(err, 'No se pudo guardar el plan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (plan: StudyPlanDto) => {
    if (!plan.id) return;
    const ok = await confirm({
      title: 'Desactivar plan de estudios',
      message: `¿Desactivar el plan ${plan.code}? La malla dejará de estar disponible para nuevas secciones.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await academicService.deletePlan(plan.id);
      toast.success('Plan desactivado.');
      await reload();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo desactivar el plan'));
    }
  };

  const openMalla = async (plan: StudyPlanDto) => {
    if (!plan.id) return;
    setSelectedPlan(plan);
    setMallaLoading(true);
    setCourseToAdd(0);
    setCycleToAdd(1);
    setMandatoryToAdd(true);
    try {
      const res = await academicService.getPlanCourses(plan.id);
      setPlanCourses(res.data);
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo cargar la malla curricular'));
      setPlanCourses([]);
    } finally {
      setMallaLoading(false);
    }
  };

  const refreshMalla = async () => {
    if (!selectedPlan?.id) return;
    const res = await academicService.getPlanCourses(selectedPlan.id);
    setPlanCourses(res.data);
    await reload();
  };

  const handleAddCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlan?.id || !courseToAdd) return;
    try {
      await academicService.addPlanCourse(selectedPlan.id, {
        courseId: courseToAdd,
        cycle: cycleToAdd,
        mandatory: mandatoryToAdd,
      });
      toast.success('Curso agregado a la malla.');
      setCourseToAdd(0);
      await refreshMalla();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo agregar el curso'));
    }
  };

  const handleRemoveCourse = async (planCourse: PlanCourseDto) => {
    if (!selectedPlan?.id || !planCourse.id) return;
    const ok = await confirm({
      title: 'Retirar curso de la malla',
      message: `¿Retirar ${planCourse.courseCode} del plan ${selectedPlan.code}?`,
      confirmLabel: 'Retirar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await academicService.removePlanCourse(selectedPlan.id, planCourse.id);
      toast.success('Curso retirado de la malla.');
      await refreshMalla();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo retirar el curso'));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Consultando planes de estudio..." />;
  }

  return (
    <div className="glass-panel" style={{ padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <ClipboardList size={19} color="var(--primary)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Planes de estudio ({plans.length})</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={reload} leftIcon={<RefreshCw size={15} />}>Actualizar</Button>
          {canCreate && <Button size="sm" onClick={() => openPlanModal()} leftIcon={<Plus size={15} />}>Nuevo Plan</Button>}
        </div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table data-table--stack">
          <thead>
            <tr>
              <th>Código</th>
              <th>Plan</th>
              <th>Carrera</th>
              <th>Año</th>
              <th>Cursos</th>
              <th>Créditos</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td className="cell-strong cell-mono">{plan.code}</td>
                <td>{plan.name}</td>
                <td>{plan.careerName ?? '—'}</td>
                <td>{plan.year}</td>
                <td>{plan.courseCount ?? 0}</td>
                <td>{plan.totalCredits ?? 0}</td>
                <td><Badge variant={plan.active === false ? 'danger' : 'success'} size="sm" dot>{plan.active === false ? 'Inactivo' : 'Activo'}</Badge></td>
                <td>
                  <div className="action-group" style={{ justifyContent: 'center' }}>
                    <button type="button" className="action-btn primary" title="Malla curricular" aria-label={`Malla de ${plan.code}`} onClick={() => openMalla(plan)}>
                      <BookOpen size={15} />
                    </button>
                    {canEdit && (
                      <button type="button" className="action-btn primary" title="Editar" aria-label={`Editar ${plan.code}`} onClick={() => openPlanModal(plan)}>
                        <Pencil size={15} />
                      </button>
                    )}
                    {canDelete && plan.active !== false && (
                      <button type="button" className="action-btn danger" title="Desactivar" aria-label={`Desactivar ${plan.code}`} onClick={() => handleDelete(plan)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr><td colSpan={8} style={{ color: 'var(--text-muted)' }}>No hay planes de estudio registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {planModal && (
        <AcademicModal
          title={planForm.id ? 'Editar Plan' : 'Registrar Plan'}
          subtitle="Define la carrera, el año y el código del plan."
          icon={<ClipboardList size={20} color="var(--primary)" />}
          onClose={() => setPlanModal(false)}
        >
          <AcademicFormError message={formError} />
          <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-section">Identificación del plan</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
              <AcademicField label="Código" icon={<Hash size={13} />} hint="Formato recomendado: PLAN-IS-2026.">
                <input style={academicInputStyle} required value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} placeholder="Ej. PLAN-IS-2026" />
              </AcademicField>
              <AcademicField label="Nombre" icon={<FileText size={13} />}>
                <input style={academicInputStyle} required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Ej. Plan de Estudios 2026" />
              </AcademicField>
            </div>

            <div className="form-section">Adscripción académica</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
              <AcademicField label="Carrera" icon={<GraduationCap size={13} />}>
                <select style={academicInputStyle} required value={planForm.careerId || ''} onChange={(e) => setPlanForm({ ...planForm, careerId: Number(e.target.value) })}>
                  <option value="">— Seleccione una carrera —</option>
                  {careers.filter((c) => c.active !== false || c.id === planForm.careerId).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </AcademicField>
              <AcademicField label="Año" icon={<CalendarDays size={13} />}>
                <input style={academicInputStyle} type="number" min={2000} max={2100} required value={planForm.year} onChange={(e) => setPlanForm({ ...planForm, year: Number(e.target.value) })} placeholder="Ej. 2026" />
              </AcademicField>
            </div>
            <AcademicField label="Descripción" icon={<AlignLeft size={13} />} hint="Resume el enfoque o alcance de este plan de estudios.">
              <input style={academicInputStyle} value={planForm.description ?? ''} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Ej. Malla curricular orientada a desarrollo de software y ciencia de datos" />
            </AcademicField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => setPlanModal(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>{planForm.id ? 'Guardar cambios' : 'Registrar plan'}</Button>
            </div>
          </form>
        </AcademicModal>
      )}

      {selectedPlan && (
        <AcademicModal
          title={`Malla curricular · ${selectedPlan.code}`}
          subtitle={selectedPlan.name}
          icon={<BookOpen size={20} color="var(--accent-cyan)" />}
          maxWidth="820px"
          onClose={() => setSelectedPlan(null)}
        >
          {mallaLoading ? (
            <LoadingSpinner message="Cargando malla curricular..." />
          ) : (
            <>
              <div className="data-table-wrap" style={{ marginBottom: '16px' }}>
                <table className="data-table data-table--stack">
                  <thead>
                    <tr><th>Ciclo</th><th>Curso</th><th>Créditos</th><th>Obligatorio</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {planCourses.map((pc) => (
                      <tr key={pc.id}>
                        <td>{pc.cycle}</td>
                        <td><span className="cell-mono">{pc.courseCode}</span> · {pc.courseName}</td>
                        <td>{pc.credits}</td>
                        <td>{pc.mandatory ? 'Sí' : 'No'}</td>
                        <td>
                          {canEdit && (
                            <button type="button" className="action-btn danger" title="Retirar" aria-label={`Retirar ${pc.courseCode}`} onClick={() => handleRemoveCourse(pc)}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {planCourses.length === 0 && (
                      <tr><td colSpan={5} style={{ color: 'var(--text-muted)' }}>La malla aún no tiene cursos.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {canEdit && (
                <form onSubmit={handleAddCourse} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '10px', alignItems: 'end' }}>
                  <AcademicField label="Agregar curso">
                    <select style={academicInputStyle} value={courseToAdd || ''} onChange={(e) => setCourseToAdd(Number(e.target.value))}>
                      <option value="">— Seleccione un curso —</option>
                      {availableCourses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                    </select>
                  </AcademicField>
                  <AcademicField label="Ciclo">
                    <input style={academicInputStyle} type="number" min={1} max={20} value={cycleToAdd} onChange={(e) => setCycleToAdd(Number(e.target.value))} />
                  </AcademicField>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', paddingBottom: '8px' }}>
                    <input type="checkbox" checked={mandatoryToAdd} onChange={(e) => setMandatoryToAdd(e.target.checked)} />
                    Obligatorio
                  </label>
                  <Button type="submit" size="sm" disabled={!courseToAdd}>Agregar</Button>
                </form>
              )}
            </>
          )}
        </AcademicModal>
      )}
    </div>
  );
};
