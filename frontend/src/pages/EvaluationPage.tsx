import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { academicService } from '../services/academicService';
import type { SectionDto } from '../services/academicService';
import { evaluationService } from '../services/evaluationService';
import type {
  ActaDto,
  AttendanceDto,
  EvaluationDto,
  GradeDto,
} from '../services/evaluationService';
import {
  AcademicField,
  AcademicFormError,
  AcademicModal,
  academicErrMsg,
  academicFormatDate,
  academicInputStyle,
} from '../components/academic/AcademicUi';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Layers,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
} from 'lucide-react';

type TabKey = 'evaluations' | 'grades' | 'attendance' | 'act';

const TODAY = new Date().toISOString().slice(0, 10);
const EVALUATION_TYPES = [
  { value: 'PRACTICA', label: 'Práctica' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'FINAL', label: 'Final' },
  { value: 'OTRO', label: 'Otro' },
];
const ATTENDANCE_STATUS = [
  { value: 'PRESENTE', label: 'Presente' },
  { value: 'AUSENTE', label: 'Ausente' },
  { value: 'TARDANZA', label: 'Tardanza' },
  { value: 'JUSTIFICADO', label: 'Justificado' },
];

const emptyEvaluation = (): EvaluationDto => ({
  sectionId: 0,
  name: '',
  type: 'PRACTICA',
  weight: 0,
  maxScore: 20,
  date: TODAY,
});

export const EvaluationPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();

  const canViewEvaluations = hasPermission('EVALUACION_VIEW');
  const canEditEvaluations = hasPermission('EVALUACION_EDIT');
  const canViewGrades = hasPermission('NOTA_VIEW');
  const canEditGrades = hasPermission('NOTA_EDIT');
  const canViewAttendance = hasPermission('ASISTENCIA_VIEW');
  const canEditAttendance = hasPermission('ASISTENCIA_EDIT');
  const canViewActa = hasPermission('ACTA_VIEW');
  const canCloseActa = hasPermission('ACTA_CLOSE');

  const initialTab: TabKey = canViewEvaluations
    ? 'evaluations'
    : canViewGrades
      ? 'grades'
      : canViewAttendance
        ? 'attendance'
        : 'act';

  const [sections, setSections] = useState<SectionDto[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number>(0);
  const [loadingSections, setLoadingSections] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const [evaluations, setEvaluations] = useState<EvaluationDto[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number>(0);
  const [grades, setGrades] = useState<GradeDto[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDto[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(TODAY);
  const [acta, setActa] = useState<ActaDto | null>(null);
  const [loading, setLoading] = useState(false);

  const [evaluationModal, setEvaluationModal] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationDto>(emptyEvaluation());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId),
    [sections, selectedSectionId]
  );
  const selectedEvaluation = useMemo(
    () => evaluations.find((e) => e.id === selectedEvaluationId),
    [evaluations, selectedEvaluationId]
  );
  const totalWeight = useMemo(
    () => evaluations.reduce((sum, evaluation) => sum + Number(evaluation.weight || 0), 0),
    [evaluations]
  );
  const actClosed = acta?.status === 'CERRADA';

  const loadSections = useCallback(async () => {
    setLoadingSections(true);
    try {
      const res = await academicService.getSections();
      const active = res.data.filter((s) => s.active !== false);
      setSections(active);
      if (active.length > 0) {
        setSelectedSectionId((current) => current || active[0].id || 0);
      }
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudieron cargar las secciones'));
    } finally {
      setLoadingSections(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const loadSectionData = useCallback(async () => {
    if (!selectedSectionId) return;
    setLoading(true);
    try {
      const tasks: Promise<unknown>[] = [];
      if (canViewEvaluations || canViewGrades) {
        tasks.push(
          evaluationService.getEvaluations(selectedSectionId).then((res) => {
            setEvaluations(res.data);
            setSelectedEvaluationId((current) => {
              if (res.data.some((e) => e.id === current)) return current;
              return res.data[0]?.id ?? 0;
            });
          })
        );
      }
      if (canViewAttendance) {
        tasks.push(
          evaluationService.getAttendance(selectedSectionId, attendanceDate).then((res) => setAttendance(res.data))
        );
      }
      if (canViewActa) {
        tasks.push(evaluationService.getActa(selectedSectionId).then((res) => setActa(res.data)));
      }
      const results = await Promise.allSettled(tasks);
      const failed = results.find((r) => r.status === 'rejected');
      if (failed && failed.status === 'rejected') {
        toast.error(academicErrMsg(failed.reason, 'No se pudo cargar la evaluación de la sección'));
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSectionId, canViewEvaluations, canViewGrades, canViewAttendance, canViewActa, attendanceDate, toast]);

  useEffect(() => {
    loadSectionData();
  }, [loadSectionData]);

  const loadGrades = useCallback(async () => {
    if (!selectedEvaluationId) {
      setGrades([]);
      return;
    }
    try {
      const res = await evaluationService.getGrades(selectedEvaluationId);
      setGrades(res.data);
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudieron cargar las notas'));
    }
  }, [selectedEvaluationId, toast]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const openEvaluationModal = (evaluation?: EvaluationDto) => {
    if (!selectedSectionId) return;
    setFormError(null);
    setEvaluationForm(evaluation ? { ...evaluation } : { ...emptyEvaluation(), sectionId: selectedSectionId });
    setEvaluationModal(true);
  };

  const handleSaveEvaluation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSectionId) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...evaluationForm,
        date: evaluationForm.date || undefined,
      };
      if (evaluationForm.id) {
        await evaluationService.updateEvaluation(evaluationForm.id, payload);
      } else {
        await evaluationService.createEvaluation(selectedSectionId, payload);
      }
      setEvaluationModal(false);
      toast.success(evaluationForm.id ? 'Evaluación actualizada.' : 'Evaluación registrada.');
      await loadSectionData();
    } catch (err) {
      setFormError(academicErrMsg(err, 'No se pudo guardar la evaluación'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvaluation = async (evaluation: EvaluationDto) => {
    if (!evaluation.id) return;
    const ok = await confirm({
      title: 'Desactivar evaluación',
      message: `¿Desactivar "${evaluation.name}"?`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await evaluationService.deleteEvaluation(evaluation.id);
      toast.success('Evaluación desactivada.');
      await loadSectionData();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo desactivar la evaluación'));
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedEvaluationId) return;
    setSaving(true);
    try {
      await evaluationService.saveGrades(selectedEvaluationId, grades);
      toast.success('Notas guardadas correctamente.');
      await loadGrades();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudieron guardar las notas'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedSectionId) return;
    setSaving(true);
    try {
      await evaluationService.saveAttendance(selectedSectionId, attendanceDate, attendance);
      toast.success('Asistencia guardada correctamente.');
      await loadSectionData();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo guardar la asistencia'));
    } finally {
      setSaving(false);
    }
  };

  const handleCloseActa = async () => {
    if (!selectedSectionId) return;
    const ok = await confirm({
      title: 'Cerrar acta',
      message: 'El acta quedará bloqueada y se calcularán los promedios finales. Esta acción no se puede deshacer.',
      confirmLabel: 'Cerrar acta',
      variant: 'danger',
    });
    if (!ok) return;
    setSaving(true);
    try {
      const res = await evaluationService.closeActa(selectedSectionId);
      setActa(res.data);
      toast.success('Acta cerrada y promedios calculados.');
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo cerrar el acta'));
    } finally {
      setSaving(false);
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

  if (loadingSections) {
    return <LoadingSpinner message="Consultando secciones..." />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Evaluación Académica"
        subtitle="Evaluaciones, notas, asistencia y actas por sección."
        icon={<ClipboardCheck size={26} color="#ffffff" />}
        breadcrumbs={[{ label: 'Gestión Académica' }, { label: 'Evaluación Académica' }]}
        stats={[
          { label: 'Secciones', value: sections.length },
          { label: 'Evaluaciones', value: evaluations.length },
          { label: 'Peso acumulado', value: `${totalWeight}%` },
          { label: 'Acta', value: acta?.status ?? '—' },
        ]}
        actions={
          <Button variant="secondary" size="sm" onClick={loadSectionData} leftIcon={<RefreshCw size={15} />} isLoading={loading}>
            Actualizar
          </Button>
        }
      />

      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 360px' }}>
          <label className="field-label" htmlFor="evaluation-section">Sección</label>
          <select
            id="evaluation-section"
            style={academicInputStyle}
            value={selectedSectionId || ''}
            onChange={(event) => setSelectedSectionId(Number(event.target.value))}
          >
            <option value="">— Seleccione una sección —</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.periodCode} · {section.courseCode}-{section.code} · {section.courseName}
              </option>
            ))}
          </select>
        </div>
        {selectedSection && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingBottom: '8px' }}>
            <BookOpen size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} />
            {selectedSection.courseName} · Docente: {selectedSection.teacherName ?? 'sin asignar'} · Cupo: {selectedSection.enrolledCount}/{selectedSection.capacity}
          </div>
        )}
      </div>

      {!selectedSectionId ? (
        <div className="glass-panel" style={{ padding: '28px', color: 'var(--text-muted)' }}>
          No hay secciones disponibles para evaluar.
        </div>
      ) : (
        <>
          <div className="academic-tabs" role="tablist" aria-label="Evaluación académica">
            {canViewEvaluations && tabButton('evaluations', 'Evaluaciones', <ClipboardList size={15} />)}
            {canViewGrades && tabButton('grades', 'Notas', <Pencil size={15} />)}
            {canViewAttendance && tabButton('attendance', 'Asistencia', <UserCheck size={15} />)}
            {canViewActa && tabButton('act', 'Acta', <CheckCircle2 size={15} />)}
          </div>

          {activeTab === 'evaluations' && canViewEvaluations && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Evaluaciones ({evaluations.length})</h2>
                {canEditEvaluations && !actClosed && (
                  <Button size="sm" onClick={() => openEvaluationModal()} leftIcon={<Plus size={15} />}>Nueva Evaluación</Button>
                )}
              </div>
              <p className="table-scroll-hint">Desliza para ver más columnas →</p>
          <div className="data-table-wrap">
                <table className="data-table data-table--stack">
                  <thead>
                    <tr><th>Evaluación</th><th>Tipo</th><th>Peso</th><th>Fecha</th><th>Nota máxima</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {evaluations.map((evaluation) => (
                      <tr key={evaluation.id}>
                        <td className="cell-strong">{evaluation.name}</td>
                        <td>{EVALUATION_TYPES.find((t) => t.value === evaluation.type)?.label ?? evaluation.type}</td>
                        <td>{evaluation.weight}%</td>
                        <td>{academicFormatDate(evaluation.date)}</td>
                        <td>{evaluation.maxScore}</td>
                        <td>
                          <div className="action-group">
                            {canEditEvaluations && !actClosed && (
                              <button type="button" className="action-btn primary" title="Editar" aria-label={`Editar ${evaluation.name}`} onClick={() => openEvaluationModal(evaluation)}>
                                <Pencil size={15} />
                              </button>
                            )}
                            {canEditEvaluations && !actClosed && (
                              <button type="button" className="action-btn danger" title="Desactivar" aria-label={`Desactivar ${evaluation.name}`} onClick={() => handleDeleteEvaluation(evaluation)}>
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {evaluations.length === 0 && (
                      <tr><td colSpan={6} style={{ color: 'var(--text-muted)' }}>No hay evaluaciones registradas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'grades' && canViewGrades && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Notas</h2>
                  <select style={{ ...academicInputStyle, width: 'auto' }} value={selectedEvaluationId || ''} onChange={(e) => setSelectedEvaluationId(Number(e.target.value))}>
                    <option value="">— Evaluación —</option>
                    {evaluations.map((evaluation) => <option key={evaluation.id} value={evaluation.id}>{evaluation.name} ({evaluation.weight}%)</option>)}
                  </select>
                </div>
                {canEditGrades && selectedEvaluation && !actClosed && (
                  <Button size="sm" onClick={handleSaveGrades} isLoading={saving}>Guardar notas</Button>
                )}
              </div>
              <p className="table-scroll-hint">Desliza para ver más columnas →</p>
          <div className="data-table-wrap">
                <table className="data-table data-table--stack">
                  <thead><tr><th>Código</th><th>Estudiante</th><th>Nota (0–{selectedEvaluation?.maxScore ?? 20})</th><th>Observación</th></tr></thead>
                  <tbody>
                    {grades.map((grade) => (
                      <tr key={grade.studentId}>
                        <td className="cell-mono">{grade.studentCode}</td>
                        <td>{grade.studentName}</td>
                        <td style={{ maxWidth: '110px' }}>
                          <input
                            style={academicInputStyle}
                            type="number"
                            min={0}
                            max={selectedEvaluation?.maxScore ?? 20}
                            step={0.01}
                            value={grade.score ?? ''}
                            disabled={!canEditGrades || actClosed}
                            onChange={(event) => {
                              const value = event.target.value === '' ? null : Number(event.target.value);
                              setGrades((items) => items.map((item) => item.studentId === grade.studentId ? { ...item, score: value } : item));
                            }}
                          />
                        </td>
                        <td>
                          <input
                            style={academicInputStyle}
                            value={grade.observation ?? ''}
                            disabled={!canEditGrades || actClosed}
                            onChange={(event) => setGrades((items) => items.map((item) => item.studentId === grade.studentId ? { ...item, observation: event.target.value } : item))}
                          />
                        </td>
                      </tr>
                    ))}
                    {grades.length === 0 && (
                      <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>No hay estudiantes matriculados o no hay evaluación seleccionada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && canViewAttendance && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Asistencia</h2>
                  <input
                    style={{ ...academicInputStyle, width: 'auto' }}
                    type="date"
                    value={attendanceDate}
                    onChange={(event) => setAttendanceDate(event.target.value)}
                  />
                </div>
                {canEditAttendance && !actClosed && (
                  <Button size="sm" onClick={handleSaveAttendance} isLoading={saving}>Guardar asistencia</Button>
                )}
              </div>
              <p className="table-scroll-hint">Desliza para ver más columnas →</p>
          <div className="data-table-wrap">
                <table className="data-table data-table--stack">
                  <thead><tr><th>Código</th><th>Estudiante</th><th>Estado</th><th>Observación</th></tr></thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.studentId}>
                        <td className="cell-mono">{record.studentCode}</td>
                        <td>{record.studentName}</td>
                        <td>
                          <select
                            style={academicInputStyle}
                            value={record.status}
                            disabled={!canEditAttendance || actClosed}
                            onChange={(event) => setAttendance((items) => items.map((item) => item.studentId === record.studentId ? { ...item, status: event.target.value } : item))}
                          >
                            {ATTENDANCE_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            style={academicInputStyle}
                            value={record.observation ?? ''}
                            disabled={!canEditAttendance || actClosed}
                            onChange={(event) => setAttendance((items) => items.map((item) => item.studentId === record.studentId ? { ...item, observation: event.target.value } : item))}
                          />
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>No hay estudiantes matriculados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'act' && canViewActa && (
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Acta de evaluación</h2>
                  <Badge variant={actClosed ? 'success' : 'warning'} size="sm" dot>{acta?.status ?? 'ABIERTA'}</Badge>
                </div>
                {canCloseActa && !actClosed && (
                  <Button size="sm" variant="danger" onClick={handleCloseActa} isLoading={saving}>Cerrar acta</Button>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 0 }}>
                Peso acumulado: <strong>{totalWeight}%</strong>. Para cerrar el acta debe ser exactamente 100%.
                {actClosed && acta?.closedAt && <> Cerrada el {new Date(acta.closedAt).toLocaleString('es-PE')}.</>}
              </p>
              <p className="table-scroll-hint">Desliza para ver más columnas →</p>
          <div className="data-table-wrap">
                <table className="data-table data-table--stack">
                  <thead><tr><th>Código</th><th>Estudiante</th><th>Promedio</th><th>Estado</th><th>Créditos</th></tr></thead>
                  <tbody>
                    {(acta?.details ?? []).map((detail) => (
                      <tr key={detail.studentId}>
                        <td className="cell-mono">{detail.studentCode}</td>
                        <td>{detail.studentName}</td>
                        <td>{detail.average}</td>
                        <td><Badge variant={detail.approved ? 'success' : 'danger'} size="sm">{detail.approved ? 'Aprobado' : 'Desaprobado'}</Badge></td>
                        <td>{detail.credits}</td>
                      </tr>
                    ))}
                    {(acta?.details ?? []).length === 0 && (
                      <tr><td colSpan={5} style={{ color: 'var(--text-muted)' }}>El acta aún no ha sido cerrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {evaluationModal && (
        <AcademicModal
          title={evaluationForm.id ? 'Editar Evaluación' : 'Nueva Evaluación'}
          subtitle="Define el peso y la escala de la evaluación."
          icon={<ClipboardList size={20} color="var(--primary)" />}
          onClose={() => setEvaluationModal(false)}
        >
          <AcademicFormError message={formError} />
          <form onSubmit={handleSaveEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-section">Identificación de la evaluación</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '12px' }}>
              <AcademicField label="Nombre" icon={<FileText size={13} />}>
                <input style={academicInputStyle} required value={evaluationForm.name} onChange={(e) => setEvaluationForm({ ...evaluationForm, name: e.target.value })} placeholder="Ej. Examen parcial" />
              </AcademicField>
              <AcademicField label="Tipo" icon={<Layers size={13} />}>
                <select style={academicInputStyle} value={evaluationForm.type} onChange={(e) => setEvaluationForm({ ...evaluationForm, type: e.target.value })}>
                  {EVALUATION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </AcademicField>
            </div>

            <div className="form-section">Escala y ponderación</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '12px' }}>
              <AcademicField label="Peso (%)" icon={<Percent size={13} />} hint="La suma de pesos de la sección debe llegar a 100%.">
                <input style={academicInputStyle} type="number" min={0} max={100} step={0.01} required value={evaluationForm.weight} onChange={(e) => setEvaluationForm({ ...evaluationForm, weight: Number(e.target.value) })} placeholder="Ej. 30" />
              </AcademicField>
              <AcademicField label="Nota máxima" icon={<Award size={13} />}>
                <input style={academicInputStyle} type="number" min={0.01} max={20} step={0.01} required value={evaluationForm.maxScore} onChange={(e) => setEvaluationForm({ ...evaluationForm, maxScore: Number(e.target.value) })} placeholder="Ej. 20" />
              </AcademicField>
            </div>

            <div className="form-section">Programación</div>
            <AcademicField label="Fecha" icon={<CalendarDays size={13} />}>
              <input style={academicInputStyle} type="date" value={evaluationForm.date ?? ''} onChange={(e) => setEvaluationForm({ ...evaluationForm, date: e.target.value })} />
            </AcademicField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => setEvaluationModal(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={saving}>{evaluationForm.id ? 'Guardar cambios' : 'Registrar evaluación'}</Button>
            </div>
          </form>
        </AcademicModal>
      )}
    </div>
  );
};
