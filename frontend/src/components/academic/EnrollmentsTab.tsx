import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SearchableSelect } from '../ui/SearchableSelect';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useToast } from '../../contexts/ToastContext';
import { academicService } from '../../services/academicService';
import type { EnrollmentDto, SectionDto } from '../../services/academicService';
import { studentService } from '../../services/studentService';
import type { StudentDto } from '../../services/studentService';
import {
  AcademicField,
  AcademicModal,
  academicErrMsg,
  academicFormatDate,
  academicInputStyle,
} from './AcademicUi';
import { Pencil, Plus, RefreshCw, Trash2, UserCheck } from 'lucide-react';

const emptyEnrollment = (): EnrollmentDto => ({
  studentId: 0,
  sectionId: 0,
  observation: '',
});

export const EnrollmentsTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();

  const canCreate = hasPermission('MATRICULA_CREATE');
  const canEdit = hasPermission('MATRICULA_EDIT');
  const canDelete = hasPermission('MATRICULA_DELETE');

  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<EnrollmentDto>(emptyEnrollment());
  const [periodFilter, setPeriodFilter] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const tasks: Promise<unknown>[] = [
      academicService.getEnrollments().then((res) => setEnrollments(res.data)),
      academicService.getSections().then((res) => setSections(res.data)),
    ];
    if (hasPermission('ESTUDIANTE_VIEW')) {
      tasks.push(studentService.getActiveStudents().then((res) => setStudents(res.data)));
    }
    try {
      const results = await Promise.allSettled(tasks);
      const failed = results.find((r) => r.status === 'rejected');
      if (failed && failed.status === 'rejected') {
        toast.error(academicErrMsg(failed.reason, 'No se pudieron cargar las matrículas'));
      }
    } finally {
      setLoading(false);
    }
  }, [hasPermission, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const periods = useMemo(() => {
    const map = new Map<number, string>();
    sections.forEach((s) => map.set(s.periodId, s.periodCode ?? String(s.periodId)));
    return Array.from(map, ([id, code]) => ({ id, code }));
  }, [sections]);

  const availableSections = useMemo(
    () =>
      sections.filter(
        (s) =>
          s.active !== false &&
          (periodFilter === 0 || s.periodId === periodFilter) &&
          ((s.available ?? 0) > 0 || s.id === form.sectionId)
      ),
    [sections, periodFilter, form.sectionId]
  );

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === form.sectionId),
    [sections, form.sectionId]
  );

  const openModal = () => {
    setFormError(null);
    const firstPeriod = periods[0]?.id ?? 0;
    setPeriodFilter(firstPeriod);
    setForm({ ...emptyEnrollment(), sectionId: 0 });
    setModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.sectionId || !form.studentId) {
      setFormError('Selecciona una sección y un estudiante antes de registrar la matrícula.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await academicService.createEnrollment({
        studentId: form.studentId,
        sectionId: form.sectionId,
        observation: form.observation,
      });
      setModalOpen(false);
      toast.success('Matrícula registrada correctamente.');
      await reload();
    } catch (err) {
      setFormError(academicErrMsg(err, 'No se pudo registrar la matrícula'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeStatus = async (enrollment: EnrollmentDto, status: 'MATRICULADO' | 'RETIRADO') => {
    if (!enrollment.id) return;
    const ok = await confirm({
      title: status === 'RETIRADO' ? 'Retirar matrícula' : 'Reactivar matrícula',
      message: status === 'RETIRADO'
        ? `¿Retirar la matrícula de ${enrollment.studentName} en ${enrollment.courseCode}?`
        : `¿Reactivar la matrícula de ${enrollment.studentName} en ${enrollment.courseCode}?`,
      confirmLabel: status === 'RETIRADO' ? 'Retirar' : 'Reactivar',
      variant: status === 'RETIRADO' ? 'danger' : 'primary',
    });
    if (!ok) return;
    try {
      await academicService.updateEnrollmentStatus(enrollment.id, status);
      toast.success(status === 'RETIRADO' ? 'Matrícula retirada.' : 'Matrícula reactivada.');
      await reload();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo actualizar la matrícula'));
    }
  };

  const handleDelete = async (enrollment: EnrollmentDto) => {
    if (!enrollment.id) return;
    const ok = await confirm({
      title: 'Anular matrícula',
      message: `¿Anular definitivamente la matrícula de ${enrollment.studentName}?`,
      confirmLabel: 'Anular',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await academicService.deleteEnrollment(enrollment.id);
      toast.success('Matrícula anulada.');
      await reload();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo anular la matrícula'));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Consultando matrículas..." />;
  }

  const activeCount = enrollments.filter((e) => e.active !== false && e.status === 'MATRICULADO').length;

  return (
    <div className="glass-panel" style={{ padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <UserCheck size={19} color="var(--primary)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
            Matrículas · {activeCount} activas
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={reload} leftIcon={<RefreshCw size={15} />}>Actualizar</Button>
          {canCreate && <Button size="sm" onClick={openModal} leftIcon={<Plus size={15} />}>Nueva Matrícula</Button>}
        </div>
      </div>

      <div className="data-table-wrap">
        <table className="data-table data-table--stack">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Curso</th>
              <th>Sección</th>
              <th>Periodo</th>
              <th>Fecha</th>
              <th>Créditos</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td>{enrollment.studentName} <span className="cell-mono">({enrollment.studentCode})</span></td>
                <td><span className="cell-mono">{enrollment.courseCode}</span> · {enrollment.courseName}</td>
                <td>{enrollment.sectionCode}</td>
                <td className="cell-mono">{enrollment.periodCode}</td>
                <td>{academicFormatDate(enrollment.enrollmentDate)}</td>
                <td>{enrollment.credits}</td>
                <td>
                  <Badge variant={enrollment.active === false || enrollment.status === 'RETIRADO' ? 'danger' : 'success'} size="sm" dot>
                    {enrollment.status === 'RETIRADO' || enrollment.active === false ? 'Retirado' : 'Matriculado'}
                  </Badge>
                </td>
                <td>
                  <div className="action-group" style={{ justifyContent: 'center' }}>
                    {canEdit && (enrollment.active === false || enrollment.status === 'RETIRADO' ? (
                      <button type="button" className="action-btn primary" title="Reactivar" aria-label="Reactivar" onClick={() => changeStatus(enrollment, 'MATRICULADO')}>
                        <RefreshCw size={15} />
                      </button>
                    ) : (
                      <button type="button" className="action-btn primary" title="Retirar" aria-label="Retirar" onClick={() => changeStatus(enrollment, 'RETIRADO')}>
                        <Pencil size={15} />
                      </button>
                    ))}
                    {canDelete && (
                      <button type="button" className="action-btn danger" title="Anular" aria-label="Anular" onClick={() => handleDelete(enrollment)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr><td colSpan={8} style={{ color: 'var(--text-muted)' }}>No hay matrículas registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <AcademicModal
          title="Registrar Matrícula"
          subtitle="Selecciona periodo, sección y estudiante. El sistema valida cupo y créditos."
          icon={<UserCheck size={20} color="var(--primary)" />}
          maxWidth="680px"
          onClose={() => setModalOpen(false)}
        >
          {formError && <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-down-bg)', color: 'var(--status-down)', fontSize: 'var(--text-sm)', marginBottom: '12px' }}>{formError}</div>}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px' }}>
              <AcademicField label="Periodo">
                <select
                  style={academicInputStyle}
                  value={periodFilter || ''}
                  onChange={(e) => {
                    const periodId = Number(e.target.value);
                    setPeriodFilter(periodId);
                    setForm({ ...form, sectionId: 0 });
                  }}
                >
                  <option value="">— Seleccione —</option>
                  {periods.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
                </select>
              </AcademicField>
              <AcademicField label="Sección" htmlFor="enrollment-section">
                <SearchableSelect
                  id="enrollment-section"
                  value={form.sectionId ? String(form.sectionId) : ''}
                  onChange={(next) => setForm({ ...form, sectionId: Number(next) })}
                  placeholder="Buscar sección por curso o código"
                  searchPlaceholder="Buscar sección…"
                  emptyMessage="No hay secciones con cupo disponible."
                  invalid={!form.sectionId && !!formError}
                  ariaLabel="Sección"
                  options={availableSections.map((section) => ({
                    value: String(section.id),
                    label: `${section.courseCode} · Sección ${section.code}`,
                    description: `${section.courseName} · Cupo ${section.available ?? 0}/${section.capacity} · ${section.periodCode ?? ''}`,
                  }))}
                />
              </AcademicField>
              <AcademicField label="Estudiante" htmlFor="enrollment-student">
                <SearchableSelect
                  id="enrollment-student"
                  value={form.studentId ? String(form.studentId) : ''}
                  onChange={(next) => setForm({ ...form, studentId: Number(next) })}
                  placeholder="Buscar estudiante por código o nombre"
                  searchPlaceholder="Buscar estudiante…"
                  emptyMessage="No se encontraron estudiantes activos."
                  invalid={!form.studentId && !!formError}
                  ariaLabel="Estudiante"
                  options={students.map((student) => ({
                    value: String(student.id),
                    label: `${student.code} · ${student.firstName} ${student.lastName}`,
                    description: student.career ?? undefined,
                  }))}
                />
              </AcademicField>
            </div>

            {selectedSection && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <strong>{selectedSection.courseName}</strong> · {selectedSection.credits} créditos ·
                {' '}{selectedSection.periodCode} · Docente: {selectedSection.teacherName ?? 'sin asignar'} ·
                {' '}Cupo disponible: {selectedSection.available}/{selectedSection.capacity}
              </div>
            )}

            <AcademicField label="Observación" htmlFor="enrollment-observation" hint="Opcional. Puedes indicar una condición especial o una referencia administrativa.">
              <input
                id="enrollment-observation"
                style={academicInputStyle}
                value={form.observation ?? ''}
                onChange={(e) => setForm({ ...form, observation: e.target.value })}
                placeholder="Ej. matrícula regular, observación de secretaría académica"
              />
            </AcademicField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Registrar matrícula</Button>
            </div>
          </form>
        </AcademicModal>
      )}
    </div>
  );
};
