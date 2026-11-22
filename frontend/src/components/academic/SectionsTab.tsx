import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { SectionHeader } from '../ui/SectionHeader';
import { FormSummary } from '../ui/FormSummary';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useToast } from '../../contexts/ToastContext';
import { academicService } from '../../services/academicService';
import type { AcademicPeriodDto, CourseDto, SectionDto } from '../../services/academicService';
import { teacherService } from '../../services/teacherService';
import type { TeacherDto } from '../../services/teacherService';
import {
  AcademicField,
  AcademicFormError,
  AcademicModal,
  academicErrMsg,
  academicInputStyle,
} from './AcademicUi';
import { SectionScheduleModal } from './SectionScheduleModal';
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  Clock,
  DoorOpen,
  Grid3X3,
  Hash,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';

const emptySection = (): SectionDto => ({
  periodId: 0,
  courseId: 0,
  teacherId: undefined,
  code: 'A',
  capacity: 30,
  shift: 'MAÑANA',
  classroom: '',
  schedule: '',
});

export const SectionsTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();

  const canCreate = hasPermission('SECCION_CREATE');
  const canEdit = hasPermission('SECCION_EDIT');
  const canDelete = hasPermission('SECCION_DELETE');

  const [sections, setSections] = useState<SectionDto[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriodDto[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SectionDto>(emptySection());
  const [scheduleSection, setScheduleSection] = useState<SectionDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const tasks: Promise<unknown>[] = [academicService.getSections().then((res) => setSections(res.data))];
    if (hasPermission('PERIODO_VIEW')) {
      tasks.push(academicService.getPeriods().then((res) => setPeriods(res.data)));
    }
    if (hasPermission('CURSO_VIEW')) {
      tasks.push(academicService.getCourses().then((res) => setCourses(res.data)));
    }
    if (hasPermission('DOCENTE_VIEW')) {
      tasks.push(teacherService.getActiveTeachers().then((res) => setTeachers(res.data)));
    }
    try {
      const results = await Promise.allSettled(tasks);
      const failed = results.find((r) => r.status === 'rejected');
      if (failed && failed.status === 'rejected') {
        toast.error(academicErrMsg(failed.reason, 'No se pudieron cargar las secciones'));
      }
    } finally {
      setLoading(false);
    }
  }, [hasPermission, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const openModal = (section?: SectionDto) => {
    setFormError(null);
    setForm(section ? { ...section } : emptySection());
    setModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const payload: SectionDto = {
        ...form,
        teacherId: form.teacherId || undefined,
      };
      if (form.id) {
        await academicService.updateSection(form.id, payload);
      } else {
        await academicService.createSection(payload);
      }
      setModalOpen(false);
      toast.success(form.id ? 'Sección actualizada correctamente.' : 'Sección registrada correctamente.');
      await reload();
    } catch (err) {
      setFormError(academicErrMsg(err, 'No se pudo guardar la sección'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (section: SectionDto) => {
    if (!section.id) return;
    const ok = await confirm({
      title: 'Desactivar sección',
      message: `¿Desactivar la sección ${section.courseCode}-${section.code}? No debe tener matrículas activas.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await academicService.deleteSection(section.id);
      toast.success('Sección desactivada.');
      await reload();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo desactivar la sección'));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Consultando secciones..." />;
  }

  return (
    <div className="glass-panel" style={{ padding: '18px' }}>
      <SectionHeader
        compact
        icon={<Grid3X3 size={18} />}
        eyebrow="Oferta académica"
        title={`Secciones (${sections.length})`}
        description="Periodo, curso, docente, cupo y horario por sección."
        aside={
          <>
            <Button variant="secondary" size="sm" onClick={reload} leftIcon={<RefreshCw size={15} />}>Actualizar</Button>
            {canCreate && <Button size="sm" onClick={() => openModal()} leftIcon={<Plus size={15} />}>Nueva Sección</Button>}
          </>
        }
      />

      <div className="data-table-wrap">
        <table className="data-table data-table--stack">
          <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '19%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Curso</th>
              <th>Sección</th>
              <th>Docente</th>
              <th>Cupo</th>
              <th>Horario</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.id}>
                <td className="cell-mono">{section.periodCode}</td>
                <td><span className="cell-mono">{section.courseCode}</span> · {section.courseName}</td>
                <td>{section.code}</td>
                <td>{section.teacherName ?? 'Sin asignar'}</td>
                <td className="cell-nowrap">{section.enrolledCount ?? 0} / {section.capacity}</td>
                <td className="cell-nowrap">{section.schedule || '—'}</td>
                <td><Badge variant={section.active === false ? 'danger' : 'success'} size="sm" dot>{section.active === false ? 'Inactiva' : 'Activa'}</Badge></td>
                <td className="cell-nowrap">
                  <div className="action-group" style={{ justifyContent: 'center' }}>
                    {canEdit && (
                      <button type="button" className="action-btn primary" title="Horario" aria-label={`Horario de ${section.code}`} onClick={() => setScheduleSection(section)}>
                        <CalendarClock size={15} />
                      </button>
                    )}
                    {canEdit && (
                      <button type="button" className="action-btn primary" title="Editar" aria-label={`Editar ${section.code}`} onClick={() => openModal(section)}>
                        <Pencil size={15} />
                      </button>
                    )}
                    {canDelete && section.active !== false && (
                      <button type="button" className="action-btn danger" title="Desactivar" aria-label={`Desactivar ${section.code}`} onClick={() => handleDelete(section)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sections.length === 0 && (
              <tr>
              <td colSpan={8}>
                <EmptyState
                          compact
                  icon={<Grid3X3 size={22} />}
                  title="Sin secciones registradas"
                  description="Crea la primera sección para asignar docentes, horarios y cupos."
                />
              </td>
            </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <AcademicModal
          title={form.id ? 'Editar Sección' : 'Registrar Sección'}
          subtitle="Oferta académica por periodo, curso y docente."
          icon={<Grid3X3 size={20} color="var(--accent-cyan)" />}
          maxWidth="720px"
          onClose={() => setModalOpen(false)}
        >
          <AcademicFormError message={formError} />
          <form onSubmit={handleSave} className="modal-form">
            <FormSummary
              icon={<Grid3X3 size={18} />}
              title={courses.find((course) => course.id === form.courseId)?.name || 'Nueva sección'}
              subtitle={`Sección ${form.code.trim() || '—'} · ${periods.find((period) => period.id === form.periodId)?.code || 'Periodo por definir'}`}
              meta={[
                teachers.find((teacher) => teacher.id === form.teacherId)?.firstName
                  ? `${teachers.find((teacher) => teacher.id === form.teacherId)?.firstName} ${teachers.find((teacher) => teacher.id === form.teacherId)?.lastName}`
                  : 'Docente sin asignar',
                form.capacity ? `Cupo ${form.capacity}` : 'Cupo por definir',
              ]}
              progress={Math.round(([form.periodId, form.courseId, form.code, form.capacity].filter((value) => String(value ?? '').trim() && value !== 0).length / 4) * 100)}
              progressLabel="4 campos clave"
            />
            <div className="form-section">Oferta académica</div>
            <div className="modal-field-grid">
              <AcademicField label="Periodo" icon={<CalendarDays size={13} />}>
                <select style={academicInputStyle} required value={form.periodId || ''} onChange={(e) => setForm({ ...form, periodId: Number(e.target.value) })}>
                  <option value="">— Seleccione —</option>
                  {periods.filter((p) => p.active !== false || p.id === form.periodId).map((p) => (
                    <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                  ))}
                </select>
              </AcademicField>
              <AcademicField label="Curso" icon={<BookOpen size={13} />}>
                <select style={academicInputStyle} required value={form.courseId || ''} onChange={(e) => setForm({ ...form, courseId: Number(e.target.value) })}>
                  <option value="">— Seleccione —</option>
                  {courses.filter((c) => c.active !== false || c.id === form.courseId).map((c) => (
                    <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                  ))}
                </select>
              </AcademicField>
              <AcademicField label="Docente" icon={<UserRound size={13} />}>
                <select style={academicInputStyle} value={form.teacherId ?? ''} onChange={(e) => setForm({ ...form, teacherId: e.target.value ? Number(e.target.value) : undefined })}>
                  <option value="">— Sin asignar —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
              </AcademicField>
              <AcademicField label="Código de sección" icon={<Hash size={13} />}>
                <input style={academicInputStyle} required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ej. A" />
              </AcademicField>
            </div>

            <div className="form-section">Capacidad y modalidad</div>
            <div className="modal-field-grid">
              <AcademicField label="Capacidad" icon={<Users size={13} />}>
                <input style={academicInputStyle} type="number" min={1} max={200} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} placeholder="Ej. 30" />
              </AcademicField>
              <AcademicField label="Turno" icon={<Clock size={13} />}>
                <input style={academicInputStyle} value={form.shift ?? ''} onChange={(e) => setForm({ ...form, shift: e.target.value })} placeholder="Ej. MAÑANA" />
              </AcademicField>
              <AcademicField label="Aula" icon={<DoorOpen size={13} />}>
                <input style={academicInputStyle} value={form.classroom ?? ''} onChange={(e) => setForm({ ...form, classroom: e.target.value })} placeholder="Ej. Aula 204" />
              </AcademicField>
            </div>
            <p className="field-hint">
              Los bloques de día y hora se administran desde el botón <strong>Horario</strong> de la tabla.
            </p>
            <div className="modal-form-footer">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>{form.id ? 'Guardar cambios' : 'Registrar sección'}</Button>
            </div>
          </form>
        </AcademicModal>
      )}

      {scheduleSection && (
        <SectionScheduleModal
          section={scheduleSection}
          onClose={() => setScheduleSection(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
};
