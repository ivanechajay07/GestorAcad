import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select } from '../components/ui/Select';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { DatePicker } from '../components/ui/DatePicker';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { portalService } from '../services/portalService';
import { reportService } from '../services/reportService';
import { academicInputStyle } from '../components/academic/AcademicUi';
import { ArrowLeft, CheckCircle2, ClipboardList, Download, Pencil, Plus, Search, UserCheck } from 'lucide-react';
import type { ActaPreviewDto, TeacherJustificationDto, TeacherSectionDetailDto } from '../services/portalService';
import type { ActaDto, AttendanceDto, EvaluationDto, GradeDto } from '../services/evaluationService';
import { downloadCsv } from '../utils/csv';
import { getApiErrorMessage } from '../utils/apiErrors';
import { attendanceHistorySummary, attendanceSummary, evaluationWeight, gradesSummary } from '../utils/teacherSection';

type TabKey = 'grades' | 'attendance' | 'act';
const TODAY = new Date().toISOString().slice(0, 10);
const STATUSES = ['PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO'];
const STATUS_LABELS: Record<string, string> = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  TARDANZA: 'Tardanza',
  JUSTIFICADO: 'Justificado',
};

const JUSTIFICATION_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};

const JUSTIFICATION_VARIANTS = {
  PENDIENTE: 'warning',
  APROBADA: 'success',
  RECHAZADA: 'danger',
} as const;

const formatShortDate = (value?: string | null): string => {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizeText = (value: string): string =>
  value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const matchesStudentQuery = (name: string | undefined, code: string | undefined, query: string): boolean => {
  const term = normalizeText(query.trim());
  if (!term) return true;
  return normalizeText(`${name ?? ''} ${code ?? ''}`).includes(term);
};

export const TeacherSectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sectionId = Number(id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [section, setSection] = useState<TeacherSectionDetailDto | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationDto[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(0);
  const [grades, setGrades] = useState<GradeDto[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDto[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(TODAY);
  const [acta, setActa] = useState<ActaDto | null>(null);
  const [preview, setPreview] = useState<ActaPreviewDto | null>(null);
  const [studentQuery, setStudentQuery] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceDto[]>([]);
  const [justifications, setJustifications] = useState<TeacherJustificationDto[]>([]);
  const [resolvingJustification, setResolvingJustification] = useState<TeacherJustificationDto | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA');
  const [resolutionResponse, setResolutionResponse] = useState('');
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [resolutionSaving, setResolutionSaving] = useState(false);
  const [gradesDirty, setGradesDirty] = useState(false);
  const [attendanceDirty, setAttendanceDirty] = useState(false);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [editingEvaluationId, setEditingEvaluationId] = useState<number | null>(null);
  const [evaluationForm, setEvaluationForm] = useState({
    name: '',
    type: 'PRACTICA',
    weight: '100',
    date: TODAY,
    maxScore: '20',
  });
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [evaluationSaving, setEvaluationSaving] = useState(false);
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState<TabKey>(
    initialTab === 'attendance' || initialTab === 'act' ? initialTab : 'grades'
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingActa, setExportingActa] = useState(false);

  const changeTab = (next: TabKey) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const next = searchParams.get('tab');
    if (next === 'grades' || next === 'attendance' || next === 'act') {
      setTab(next);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const [sectionRes, evaluationRes, attendanceRes, actRes, previewRes, historyRes, justificationRes] = await Promise.all([
        portalService.getTeacherSection(sectionId),
        portalService.getTeacherEvaluations(sectionId),
        portalService.getTeacherAttendance(sectionId, attendanceDate),
        portalService.getTeacherActa(sectionId),
        portalService.getTeacherActaPreview(sectionId),
        portalService.getTeacherAttendanceHistory(sectionId),
        portalService.getTeacherJustifications(sectionId),
      ]);
      setSection(sectionRes.data);
      setEvaluations(evaluationRes.data);
      setSelectedEvaluationId((current) =>
        evaluationRes.data.some((evaluation) => evaluation.id === current)
          ? current
          : evaluationRes.data[0]?.id ?? 0
      );
      setAttendance(attendanceRes.data);
      setActa(actRes.data);
      setPreview(previewRes.data);
      setAttendanceHistory(historyRes.data);
      setJustifications(justificationRes.data);
      setAttendanceDirty(false);
    } catch {
      toast.error('No se pudo cargar la sección o no tienes acceso');
      navigate('/my-sections', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [sectionId, attendanceDate, toast, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const loadPreview = useCallback(async () => {
    if (!sectionId) return;
    try {
      const response = await portalService.getTeacherActaPreview(sectionId);
      setPreview(response.data);
    } catch {
      // La vista previa es complementaria; no bloquea la gestión de la sección.
    }
  }, [sectionId]);

  const loadJustifications = useCallback(async () => {
    if (!sectionId) return;
    try {
      const response = await portalService.getTeacherJustifications(sectionId);
      setJustifications(response.data);
    } catch {
      // El listado de justificaciones no debe bloquear la gestión de asistencia.
    }
  }, [sectionId]);

  const loadGrades = useCallback(async () => {
    if (!selectedEvaluationId) {
      setGrades([]);
      return;
    }
    try {
      const response = await portalService.getTeacherGrades(selectedEvaluationId);
      setGrades(response.data);
      setGradesDirty(false);
    } catch {
      toast.error('No se pudieron cargar las notas');
    }
  }, [selectedEvaluationId, toast]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!gradesDirty && !attendanceDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gradesDirty, attendanceDirty]);

  const selectedEvaluation = evaluations.find((evaluation) => evaluation.id === selectedEvaluationId);
  const closed = acta?.status === 'CERRADA';
  const attendanceTotals = useMemo(() => attendanceSummary(attendance), [attendance]);
  const attendanceHistoryTotals = useMemo(
    () => attendanceHistorySummary(attendanceHistory),
    [attendanceHistory]
  );
  const gradeTotals = useMemo(() => gradesSummary(grades), [grades]);
  const totalWeight = useMemo(() => evaluationWeight(evaluations), [evaluations]);
  const canCloseActa = !closed && evaluations.length > 0 && totalWeight === 100;
  const pendingJustifications = useMemo(
    () => justifications.filter((justification) => justification.status === 'PENDIENTE'),
    [justifications]
  );
  const resolvedJustifications = useMemo(
    () => justifications.filter((justification) => justification.status !== 'PENDIENTE'),
    [justifications]
  );

  const setAllAttendance = (status: string) => {
    setAttendance((items) => items.map((item) => ({ ...item, status })));
    setAttendanceDirty(true);
  };

  const changeEvaluation = async (evaluationId: number) => {
    if (gradesDirty) {
      const ok = await confirm({
        title: 'Cambiar de evaluación',
        message: 'Hay notas sin guardar. Si cambias de evaluación, se perderán los cambios.',
        confirmLabel: 'Cambiar',
        variant: 'danger',
      });
      if (!ok) return;
    }
    setSelectedEvaluationId(evaluationId);
  };

  const changeAttendanceDate = async (value: string) => {
    if (value === attendanceDate) return;
    if (attendanceDirty) {
      const ok = await confirm({
        title: 'Cambiar de fecha',
        message: 'Hay asistencia sin guardar. Si cambias de fecha, se perderán los cambios.',
        confirmLabel: 'Cambiar',
        variant: 'danger',
      });
      if (!ok) return;
    }
    setAttendanceDate(value);
  };

  const openEvaluationModal = (evaluation?: EvaluationDto) => {
    setEvaluationError(null);
    setEditingEvaluationId(evaluation?.id ?? null);
    setEvaluationForm(evaluation ? {
      name: evaluation.name,
      type: evaluation.type || 'PRACTICA',
      weight: String(evaluation.weight ?? 0),
      date: evaluation.date ?? TODAY,
      maxScore: String(evaluation.maxScore ?? 20),
    } : {
      name: '',
      type: 'PRACTICA',
      weight: String(Math.max(0, Math.round((100 - totalWeight) * 100) / 100)),
      date: TODAY,
      maxScore: '20',
    });
    setEvaluationModalOpen(true);
  };

  const saveEvaluation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEvaluationError(null);
    const name = evaluationForm.name.trim();
    const weight = Number(evaluationForm.weight);
    const maxScore = Number(evaluationForm.maxScore);

    if (!name) {
      setEvaluationError('El nombre de la evaluación es obligatorio.');
      return;
    }
    if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
      setEvaluationError('El peso debe estar entre 0 y 100.');
      return;
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 20) {
      setEvaluationError('La nota máxima debe estar entre 0.01 y 20.');
      return;
    }

    setEvaluationSaving(true);
    try {
      const payload = {
        name,
        type: evaluationForm.type,
        weight,
        date: evaluationForm.date || null,
        maxScore,
      };
      const response = editingEvaluationId
        ? await portalService.updateTeacherEvaluation(editingEvaluationId, payload)
        : await portalService.createTeacherEvaluation(sectionId, payload);
      const evaluationsResponse = await portalService.getTeacherEvaluations(sectionId);
      setEvaluations(evaluationsResponse.data);
      setSelectedEvaluationId(response.data.id ?? evaluationsResponse.data[0]?.id ?? 0);
      await loadPreview();
      setEvaluationModalOpen(false);
      toast.success(editingEvaluationId ? 'Evaluación actualizada.' : 'Evaluación creada.');
    } catch (err) {
      setEvaluationError(getApiErrorMessage(err, 'No se pudo guardar la evaluación.'));
    } finally {
      setEvaluationSaving(false);
    }
  };

  const filteredGrades = useMemo(
    () => grades.filter((grade) => matchesStudentQuery(grade.studentName, grade.studentCode, studentQuery)),
    [grades, studentQuery]
  );

  const filteredAttendance = useMemo(
    () => attendance.filter((record) => matchesStudentQuery(record.studentName, record.studentCode, studentQuery)),
    [attendance, studentQuery]
  );

  const exportGradesCsv = () => {
    if (filteredGrades.length === 0) return;
    downloadCsv(
      `notas_${section?.courseCode ?? 'seccion'}-${section?.sectionCode ?? ''}.csv`,
      [
        ['Código', 'Estudiante', 'Nota', 'Observación'],
        ...filteredGrades.map((grade) => [
          grade.studentCode ?? '',
          grade.studentName ?? '',
          grade.score ?? '',
          grade.observation ?? '',
        ]),
      ]
    );
    toast.success('Notas exportadas en CSV.');
  };

  const exportAttendanceCsv = () => {
    if (filteredAttendance.length === 0) return;
    downloadCsv(
      `asistencia_${section?.courseCode ?? 'seccion'}-${section?.sectionCode ?? ''}_${attendanceDate}.csv`,
      [
        ['Código', 'Estudiante', 'Estado'],
        ...filteredAttendance.map((record) => [
          record.studentCode ?? '',
          record.studentName ?? '',
          STATUS_LABELS[record.status] ?? record.status,
        ]),
      ]
    );
    toast.success('Asistencia exportada en CSV.');
  };

  const openResolution = (justification: TeacherJustificationDto, status: 'APROBADA' | 'RECHAZADA') => {
    setResolvingJustification(justification);
    setResolutionStatus(status);
    setResolutionResponse('');
    setResolutionError(null);
  };

  const submitResolution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resolvingJustification) return;
    setResolutionSaving(true);
    try {
      const response = await portalService.resolveTeacherJustification(
        resolvingJustification.id,
        resolutionStatus,
        resolutionResponse.trim() || undefined
      );
      setJustifications((items) => items.map((item) =>
        item.id === response.data.id ? response.data : item
      ));
      if (resolutionStatus === 'APROBADA') {
        setAttendance((items) => items.map((item) =>
          item.studentId === response.data.studentId ? { ...item, status: 'JUSTIFICADO' } : item
        ));
      }
      setResolvingJustification(null);
      toast.success(
        resolutionStatus === 'APROBADA'
          ? 'Justificación aprobada y asistencia actualizada.'
          : 'Justificación rechazada.'
      );
      await loadJustifications();
    } catch (err) {
      setResolutionError(getApiErrorMessage(err, 'No se pudo resolver la justificación.'));
    } finally {
      setResolutionSaving(false);
    }
  };

  const saveGrades = async () => {
    if (!selectedEvaluationId) return;
    setSaving(true);
    try {
      await portalService.saveTeacherGrades(selectedEvaluationId, grades);
      setGradesDirty(false);
      toast.success('Notas guardadas correctamente.');
      await loadGrades();
      await loadPreview();
    } catch {
      toast.error('No se pudieron guardar las notas');
    } finally {
      setSaving(false);
    }
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      await portalService.saveTeacherAttendance(sectionId, attendanceDate, attendance);
      setAttendanceDirty(false);
      toast.success('Asistencia guardada correctamente.');
      await load();
    } catch {
      toast.error('No se pudo guardar la asistencia');
    } finally {
      setSaving(false);
    }
  };

  const closeActa = async () => {
    const ok = await confirm({
      title: 'Cerrar acta',
      message: 'El acta quedará bloqueada y se calcularán los promedios. Esta acción no se puede deshacer.',
      confirmLabel: 'Cerrar acta',
      variant: 'danger',
    });
    if (!ok) return;
    setSaving(true);
    try {
      const response = await portalService.closeTeacherActa(sectionId);
      setActa(response.data);
      await loadPreview();
      toast.success('Acta cerrada correctamente.');
    } catch {
      toast.error('No se pudo cerrar el acta. Verifica que los pesos sumen 100%.');
    } finally {
      setSaving(false);
    }
  };

  const exportActaPdf = async () => {
    setExportingActa(true);
    try {
      const filename = await reportService.exportActa(sectionId);
      toast.success(`Acta generada: ${filename}`);
    } catch {
      toast.error('No se pudo generar el acta en PDF.');
    } finally {
      setExportingActa(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando sección..." />;
  }

  if (!section) {
    return null;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`${section.courseCode}-${section.sectionCode}`}
        subtitle={`${section.courseName} · ${section.periodCode} · ${section.students.length} estudiantes`}
        icon={<ClipboardList size={26} color="#ffffff" />}
        breadcrumbs={[{ label: 'Mi espacio' }, { label: 'Mis secciones' }, { label: section.courseCode }]}
        stats={[
          {
            label: section.students.length === 1 ? 'Estudiante' : 'Estudiantes',
            value: section.students.length,
          },
          {
            label: evaluations.length === 1 ? 'Evaluación' : 'Evaluaciones',
            value: evaluations.length,
          },
          {
            label: 'Acta',
            value: acta?.status === 'CERRADA' ? 'Cerrada' : acta?.status === 'ABIERTA' ? 'Abierta' : '—',
          },
        ]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate('/my-sections')} leftIcon={<ArrowLeft size={15} />}>
            Volver
          </Button>
        }
      />

      <div className="academic-tabs" role="tablist" aria-label="Gestión de la sección">
        <button
          type="button"
          role="tab"
          id="section-tab-grades"
          aria-controls="section-panel-grades"
          aria-selected={tab === 'grades'}
          className={`academic-tab${tab === 'grades' ? ' active' : ''}`}
          onClick={() => changeTab('grades')}
        >
          <Pencil size={15} /> Notas
        </button>
        <button
          type="button"
          role="tab"
          id="section-tab-attendance"
          aria-controls="section-panel-attendance"
          aria-selected={tab === 'attendance'}
          className={`academic-tab${tab === 'attendance' ? ' active' : ''}`}
          onClick={() => changeTab('attendance')}
        >
          <UserCheck size={15} /> Asistencia
        </button>
        <button
          type="button"
          role="tab"
          id="section-tab-act"
          aria-controls="section-panel-act"
          aria-selected={tab === 'act'}
          className={`academic-tab${tab === 'act' ? ' active' : ''}`}
          onClick={() => changeTab('act')}
        >
          <CheckCircle2 size={15} /> Acta
        </button>
      </div>

      {tab === 'grades' && (
        <div
          className="glass-panel"
          id="section-panel-grades"
          role="tabpanel"
          aria-labelledby="section-tab-grades"
          style={{ padding: '18px' }}
        >
          <SectionHeader
            compact
            icon={<Pencil size={18} />}
            eyebrow="Calificación"
            title="Notas de la sección"
            description="Selecciona una evaluación y registra la nota de cada estudiante."
            aside={
              <>
                <Select style={{ ...academicInputStyle, width: 'auto' }} value={selectedEvaluationId || ''} onChange={(event) => changeEvaluation(Number(event.target.value))}>
                  <option value="">— Evaluación —</option>
                  {evaluations.map((evaluation) => <option key={evaluation.id} value={evaluation.id}>{evaluation.name} ({evaluation.weight}%)</option>)}
                </Select>
                {!closed && (
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Plus size={14} />}
                    onClick={() => openEvaluationModal()}
                  >
                    Nueva evaluación
                  </Button>
                )}
                {selectedEvaluation && !closed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Pencil size={14} />}
                    onClick={() => openEvaluationModal(selectedEvaluation)}
                  >
                    Editar
                  </Button>
                )}
                {gradesDirty && <Badge variant="warning" size="sm">Sin guardar</Badge>}
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Download size={14} />}
                  onClick={exportGradesCsv}
                  disabled={filteredGrades.length === 0}
                >
                  CSV
                </Button>
                {selectedEvaluation && !closed && (
                  <Button size="sm" onClick={saveGrades} isLoading={saving}>Guardar notas</Button>
                )}
              </>
            }
          />

          {grades.length > 0 && (
            <div className="section-toolbar">
              <div className="search-box">
                <Search size={15} color="var(--text-muted)" aria-hidden="true" />
                <input
                  type="search"
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                  placeholder="Buscar estudiante por nombre o código..."
                  aria-label="Buscar estudiante en las notas"
                />
              </div>
              {studentQuery && (
                <Button size="sm" variant="ghost" onClick={() => setStudentQuery('')}>
                  Limpiar
                </Button>
              )}
            </div>
          )}

          {selectedEvaluation && (
            <div className="section-summary-grid">
              <div className="section-summary-card">
                <span>Calificados</span>
                <strong>{gradeTotals.graded}/{gradeTotals.total}</strong>
                <small>{gradeTotals.pending} pendientes</small>
              </div>
              <div className="section-summary-card">
                <span>Promedio</span>
                <strong>{gradeTotals.average ?? '—'}</strong>
                <small>de {selectedEvaluation.maxScore} puntos</small>
              </div>
              <div className="section-summary-card">
                <span>Peso de la evaluación</span>
                <strong>{selectedEvaluation.weight}%</strong>
                <small>Peso total de la sección: {totalWeight}%</small>
              </div>
            </div>
          )}

          {closed && (
            <p className="section-callout is-success">
              Acta cerrada: la planilla de notas es de solo lectura.
            </p>
          )}

          <div className="data-table-wrap">
            <table className="data-table data-table--stack">
              <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '38%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '28%' }} />
              </colgroup>
              <thead><tr><th>Código</th><th>Estudiante</th><th>Nota (0–{selectedEvaluation?.maxScore ?? 20})</th><th>Observación</th></tr></thead>
              <tbody>
                {filteredGrades.map((grade) => (
                  <tr key={grade.studentId}>
                    <td className="cell-mono">{grade.studentCode}</td>
                    <td>{grade.studentName}</td>
                    <td style={{ maxWidth: '110px' }}>
                      <input style={academicInputStyle} type="number" min={0} max={selectedEvaluation?.maxScore ?? 20} step={0.01}
                        aria-label={`Nota de ${grade.studentName}`}
                        value={grade.score ?? ''} disabled={closed}
                        onChange={(event) => {
                          const value = event.target.value === '' ? null : Number(event.target.value);
                          setGrades((items) => items.map((item) => item.studentId === grade.studentId ? { ...item, score: value } : item));
                          setGradesDirty(true);
                        }} />
                    </td>
                    <td>
                      <input style={academicInputStyle} value={grade.observation ?? ''} disabled={closed}
                        aria-label={`Observación de ${grade.studentName}`}
                        onChange={(event) => setGrades((items) => items.map((item) => item.studentId === grade.studentId ? { ...item, observation: event.target.value } : item))} />
                    </td>
                  </tr>
                ))}
                {filteredGrades.length === 0 && <tr>
                  <td colSpan={4}>
                    <EmptyState
                      compact
                      icon={<Pencil size={22} />}
                      title={grades.length === 0 ? 'Sin notas para mostrar' : 'Sin coincidencias'}
                      description={grades.length === 0
                        ? 'Selecciona una evaluación y verifica que la sección tenga estudiantes matriculados.'
                        : 'Prueba con otro nombre o código de estudiante.'}
                      action={grades.length > 0 ? (
                        <Button size="sm" variant="ghost" onClick={() => setStudentQuery('')}>Limpiar búsqueda</Button>
                      ) : undefined}
                    />
                  </td>
                </tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div
          className="glass-panel"
          id="section-panel-attendance"
          role="tabpanel"
          aria-labelledby="section-tab-attendance"
          style={{ padding: '18px' }}
        >
          <SectionHeader
            compact
            icon={<UserCheck size={18} />}
            eyebrow="Asistencia"
            title="Control de asistencia"
            description="Registra la asistencia de la sección para la fecha seleccionada."
            aside={
              <>
                <DatePicker style={{ ...academicInputStyle, width: 'auto' }} ariaLabel="Fecha de asistencia" value={attendanceDate} onChange={changeAttendanceDate} />
                {attendanceDirty && <Badge variant="warning" size="sm">Sin guardar</Badge>}
                {pendingJustifications.length > 0 && (
                  <Badge variant="warning" size="sm" dot>
                    {pendingJustifications.length} {pendingJustifications.length === 1 ? 'justificación' : 'justificaciones'}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Download size={14} />}
                  onClick={exportAttendanceCsv}
                  disabled={filteredAttendance.length === 0}
                >
                  CSV
                </Button>
                {!closed && <Button size="sm" onClick={saveAttendance} isLoading={saving}>Guardar asistencia</Button>}
              </>
            }
          />

          {attendance.length > 0 && (
            <div className="section-toolbar">
              <div className="search-box">
                <Search size={15} color="var(--text-muted)" aria-hidden="true" />
                <input
                  type="search"
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                  placeholder="Buscar estudiante por nombre o código..."
                  aria-label="Buscar estudiante en la asistencia"
                />
              </div>
              {studentQuery && (
                <Button size="sm" variant="ghost" onClick={() => setStudentQuery('')}>
                  Limpiar
                </Button>
              )}
            </div>
          )}

          {attendance.length > 0 && (
            <>
              <div className="section-summary-grid">
                <div className="section-summary-card">
                  <span>Presentes</span>
                  <strong>{attendanceTotals.present}</strong>
                  <small>{attendanceTotals.total} estudiantes</small>
                </div>
                <div className="section-summary-card">
                  <span>Tardanzas</span>
                  <strong>{attendanceTotals.late}</strong>
                  <small>Llegadas tarde</small>
                </div>
                <div className="section-summary-card">
                  <span>Justificados</span>
                  <strong>{attendanceTotals.justified}</strong>
                  <small>Con justificación</small>
                </div>
                <div className="section-summary-card">
                  <span>Ausentes</span>
                  <strong>{attendanceTotals.absent}</strong>
                  <small>Sin asistencia</small>
                </div>
                <div className="section-summary-card">
                  <span>Asistencia</span>
                  <strong className={attendanceTotals.rate != null && attendanceTotals.rate < 75 ? 'is-warning' : 'is-success'}>
                    {attendanceTotals.rate == null ? '—' : `${attendanceTotals.rate}%`}
                  </strong>
                  <small>Del total registrado</small>
                </div>
              </div>
              {!closed && (
                <div className="section-toolbar">
                  <span className="section-toolbar__label">Acciones rápidas</span>
                  <Button size="sm" variant="ghost" onClick={() => setAllAttendance('PRESENTE')}>
                    Marcar presentes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAllAttendance('AUSENTE')}>
                    Marcar ausentes
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="data-table-wrap">
            <table className="data-table data-table--stack">
              <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '54%' }} />
              <col style={{ width: '32%' }} />
              </colgroup>
              <thead><tr><th>Código</th><th>Estudiante</th><th>Estado</th></tr></thead>
              <tbody>
                {filteredAttendance.map((record) => (
                  <tr key={record.studentId}>
                    <td className="cell-mono">{record.studentCode}</td>
                    <td>{record.studentName}</td>
                    <td>
                      <Select
                        style={academicInputStyle}
                        value={record.status}
                        disabled={closed}
                        aria-label={`Estado de asistencia de ${record.studentName}`}
                        onChange={(event) => {
                          setAttendance((items) => items.map((item) => item.studentId === record.studentId ? { ...item, status: event.target.value } : item));
                          setAttendanceDirty(true);
                        }}
                      >
                        {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status] ?? status}</option>)}
                      </Select>
                    </td>
                  </tr>
                ))}
                {filteredAttendance.length === 0 && <tr>
                  <td colSpan={3}>
                    <EmptyState
                      compact
                      icon={<UserCheck size={22} />}
                      title={attendance.length === 0 ? 'Sin estudiantes matriculados' : 'Sin coincidencias'}
                      description={attendance.length === 0
                        ? 'La sección todavía no tiene estudiantes para registrar asistencia.'
                        : 'Prueba con otro nombre o código de estudiante.'}
                      action={attendance.length > 0 ? (
                        <Button size="sm" variant="ghost" onClick={() => setStudentQuery('')}>Limpiar búsqueda</Button>
                      ) : undefined}
                    />
                  </td>
                </tr>}
              </tbody>
            </table>
          </div>

          {justifications.length > 0 && (
            <section className="approval-panel" aria-label="Justificaciones de asistencia">
              <div className="approval-panel__head">
                <div>
                  <h4 className="approval-panel__title">Justificaciones de asistencia</h4>
                  <p className="approval-panel__subtitle">
                    Solicitudes enviadas por los estudiantes para ausencias y tardanzas.
                  </p>
                </div>
                <Badge variant={pendingJustifications.length > 0 ? 'warning' : 'outline'} size="sm">
                  {pendingJustifications.length} {pendingJustifications.length === 1 ? 'pendiente' : 'pendientes'}
                </Badge>
              </div>

              <ul className="approval-list">
                {[...pendingJustifications, ...resolvedJustifications].map((justification) => (
                  <li
                    className={`approval-card is-${justification.status.toLowerCase()}`}
                    key={justification.id}
                  >
                    <div className="approval-card__top">
                      <span className="cell-mono">{justification.studentCode}</span>
                      <strong>{justification.studentName}</strong>
                      <Badge
                        variant={JUSTIFICATION_VARIANTS[justification.status as keyof typeof JUSTIFICATION_VARIANTS] ?? 'outline'}
                        size="sm"
                      >
                        {JUSTIFICATION_LABELS[justification.status] ?? justification.status}
                      </Badge>
                    </div>
                    <p className="approval-card__meta">
                      {formatShortDate(justification.date)} · Registro:{' '}
                      {STATUS_LABELS[justification.attendanceStatus] ?? justification.attendanceStatus}
                    </p>
                    <p className="approval-card__reason">{justification.reason}</p>
                    {justification.response && (
                      <p className="approval-card__response">
                        Respuesta: {justification.response}
                      </p>
                    )}
                    {justification.status === 'PENDIENTE' && (
                      <div className="approval-card__actions">
                        <Button
                          size="sm"
                          leftIcon={<CheckCircle2 size={14} />}
                          onClick={() => openResolution(justification, 'APROBADA')}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => openResolution(justification, 'RECHAZADA')}
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <details className="section-history">
            <summary>
              <span>Resumen acumulado de asistencia</span>
              <Badge variant="outline" size="sm">
                {attendanceHistory.length} {attendanceHistory.length === 1 ? 'registro' : 'registros'}
              </Badge>
            </summary>
            {attendanceHistoryTotals.length === 0 ? (
              <EmptyState
                compact
                icon={<UserCheck size={22} />}
                title="Sin historial de asistencia"
                description="Aún no hay asistencias registradas en esta sección."
              />
            ) : (
              <div className="data-table-wrap">
                <table className="data-table data-table--stack">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>P</th>
                      <th>A</th>
                      <th>T</th>
                      <th>J</th>
                      <th>Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistoryTotals.map((student) => (
                      <tr key={student.studentId}>
                        <td><span className="cell-mono">{student.studentCode}</span> · {student.studentName}</td>
                        <td>{student.present}</td>
                        <td>{student.absent}</td>
                        <td>{student.late}</td>
                        <td>{student.justified}</td>
                        <td>
                          <strong className={student.rate != null && student.rate < 75 ? 'is-warning-text' : 'is-success-text'}>
                            {student.rate == null ? '—' : `${student.rate}%`}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        </div>
      )}

      {tab === 'act' && (
        <div
          className="glass-panel"
          id="section-panel-act"
          role="tabpanel"
          aria-labelledby="section-tab-act"
          style={{ padding: '18px' }}
        >
          <SectionHeader
            compact
            icon={<CheckCircle2 size={18} />}
            eyebrow="Cierre"
            title="Acta de evaluación"
            description="Promedios finales y estado de cierre de la sección."
            aside={
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={exportActaPdf}
                  isLoading={exportingActa}
                  leftIcon={<Download size={15} />}
                >
                  PDF
                </Button>
                <Badge variant={closed ? 'success' : 'warning'} size="sm" dot>{closed ? 'Cerrada' : 'Abierta'}</Badge>
                {!closed && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={closeActa}
                    isLoading={saving}
                    disabled={!canCloseActa}
                    title={!canCloseActa ? 'El peso acumulado debe ser 100% y debe haber evaluaciones.' : undefined}
                  >
                    Cerrar acta
                  </Button>
                )}
              </>
            }
          />

          <div className="section-summary-grid">
            <div className="section-summary-card">
              <span>Peso acumulado</span>
              <strong className={totalWeight === 100 ? 'is-success' : 'is-warning'}>{totalWeight}%</strong>
              <small>{evaluations.length} {evaluations.length === 1 ? 'evaluación' : 'evaluaciones'}</small>
            </div>
            <div className="section-summary-card">
              <span>Estudiantes</span>
              <strong>{section.students.length}</strong>
              <small>Matriculados en la sección</small>
            </div>
            <div className="section-summary-card">
              <span>Estado</span>
              <strong>{closed ? 'Cerrada' : 'Abierta'}</strong>
              <small>{closed ? 'Notas definitivas' : 'Pendiente de cierre'}</small>
            </div>
          </div>

          {!closed && evaluations.length === 0 && (
            <p className="section-callout is-warning">
              Agrega evaluaciones antes de cerrar el acta.
            </p>
          )}
          {!closed && evaluations.length > 0 && totalWeight !== 100 && (
            <p className="section-callout is-warning">
              El peso acumulado debe ser 100 % para cerrar el acta. Actualmente es {totalWeight} %.
            </p>
          )}
          {closed && (
            <p className="section-callout is-success">
              Acta cerrada: las notas y la asistencia quedaron bloqueadas.
            </p>
          )}

          {!closed && preview && preview.complete && preview.students.length > 0 && (
            <p className="section-callout is-info">
              Vista previa: el acta está lista para cerrarse. Los promedios se consolidarán al confirmar el cierre.
            </p>
          )}

          {closed ? (
            <div className="data-table-wrap">
              <table className="data-table data-table--stack">
                <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '32%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '15%' }} />
                </colgroup>
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
                    <tr>
                      <td colSpan={5}>
                        <EmptyState
                          compact
                          icon={<ClipboardList size={22} />}
                          title="Sin detalles del acta"
                          description="No hay promedios registrados en el acta."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table data-table--stack">
                <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
                </colgroup>
                <thead><tr><th>Código</th><th>Estudiante</th><th>Calificadas</th><th>Promedio</th><th>Estado</th><th>Créditos</th></tr></thead>
                <tbody>
                  {(preview?.students ?? []).map((student) => {
                    const noAverage = student.average == null;
                    const preliminary = !preview?.complete;
                    const variant = noAverage ? 'outline' : preliminary ? 'warning' : student.approved ? 'success' : 'danger';
                    const label = noAverage ? 'Sin notas' : preliminary ? 'Preliminar' : student.approved ? 'Aprobado' : 'Desaprobado';

                    return (
                      <tr key={student.studentId}>
                        <td className="cell-mono">{student.studentCode}</td>
                        <td>{student.studentName}</td>
                        <td>{student.gradedCount}/{evaluations.length}</td>
                        <td>{student.average ?? '—'}</td>
                        <td><Badge variant={variant} size="sm">{label}</Badge></td>
                        <td>{student.credits}</td>
                      </tr>
                    );
                  })}
                  {(preview?.students ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          compact
                          icon={<ClipboardList size={22} />}
                          title="Vista previa no disponible"
                          description="Agrega estudiantes y evaluaciones para ver los promedios preliminares."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {closed && acta?.closedAt && (
            <p style={{ margin: '12px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              Cerrada el {new Date(acta.closedAt).toLocaleString('es-PE')}.
            </p>
          )}
        </div>
      )}

      {evaluationModalOpen && (
        <Modal
          title={editingEvaluationId ? 'Editar evaluación' : 'Nueva evaluación'}
          subtitle={`${section.courseCode}-${section.sectionCode} · ${section.periodCode}`}
          icon={<Pencil size={20} />}
          maxWidth="560px"
          onClose={() => setEvaluationModalOpen(false)}
        >
          <form className="modal-form" onSubmit={saveEvaluation}>
            <div className="modal-field-grid">
              <div className="field">
                <label className="field-label" htmlFor="section-evaluation-name">Nombre</label>
                <input
                  id="section-evaluation-name"
                  style={academicInputStyle}
                  value={evaluationForm.name}
                  onChange={(event) => setEvaluationForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ej. Examen parcial"
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="section-evaluation-type">Tipo</label>
                <Select
                  id="section-evaluation-type"
                  style={academicInputStyle}
                  value={evaluationForm.type}
                  onChange={(event) => setEvaluationForm((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="PRACTICA">Práctica</option>
                  <option value="PARCIAL">Parcial</option>
                  <option value="FINAL">Final</option>
                  <option value="OTRO">Otro</option>
                </Select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="section-evaluation-weight">Peso (%)</label>
                <input
                  id="section-evaluation-weight"
                  style={academicInputStyle}
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={evaluationForm.weight}
                  onChange={(event) => setEvaluationForm((current) => ({ ...current, weight: event.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="section-evaluation-max">Nota máxima</label>
                <input
                  id="section-evaluation-max"
                  style={academicInputStyle}
                  type="number"
                  min={0.01}
                  max={20}
                  step={0.01}
                  value={evaluationForm.maxScore}
                  onChange={(event) => setEvaluationForm((current) => ({ ...current, maxScore: event.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">Fecha</label>
                <DatePicker
                  style={academicInputStyle}
                  ariaLabel="Fecha de la evaluación"
                  value={evaluationForm.date}
                  onChange={(value) => setEvaluationForm((current) => ({ ...current, date: value }))}
                />
              </div>
            </div>

            {evaluationError && <p className="form-error" role="alert">{evaluationError}</p>}

            <div className="modal-form-footer">
              <Button type="button" variant="secondary" onClick={() => setEvaluationModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={evaluationSaving}>
                Guardar evaluación
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {resolvingJustification && (
        <Modal
          title={resolutionStatus === 'APROBADA' ? 'Aprobar justificación' : 'Rechazar justificación'}
          subtitle={`${resolvingJustification.studentName} · ${formatShortDate(resolvingJustification.date)}`}
          icon={<UserCheck size={20} />}
          maxWidth="520px"
          onClose={() => setResolvingJustification(null)}
        >
          <form className="modal-form" onSubmit={submitResolution}>
            <p className="approval-card__reason" style={{ margin: 0 }}>
              {resolvingJustification.reason}
            </p>

            <div className="field">
              <label className="field-label" htmlFor="justification-resolution">
                Respuesta para el estudiante (opcional)
              </label>
              <textarea
                id="justification-resolution"
                style={{ ...academicInputStyle, minHeight: '96px', resize: 'vertical' }}
                value={resolutionResponse}
                onChange={(event) => setResolutionResponse(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder={resolutionStatus === 'APROBADA'
                  ? 'Indica la validación de la justificación.'
                  : 'Explica brevemente el motivo del rechazo.'}
                data-autofocus
              />
              <span className="field-hint">{resolutionResponse.length}/500 caracteres</span>
            </div>

            {resolutionStatus === 'APROBADA' && (
              <p className="section-callout">
                Al aprobar, la asistencia del estudiante cambiará a <strong>Justificado</strong>.
              </p>
            )}

            {resolutionError && <p className="form-error" role="alert">{resolutionError}</p>}

            <div className="modal-form-footer">
              <Button type="button" variant="secondary" onClick={() => setResolvingJustification(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant={resolutionStatus === 'APROBADA' ? 'primary' : 'danger'}
                isLoading={resolutionSaving}
              >
                {resolutionStatus === 'APROBADA' ? 'Aprobar' : 'Rechazar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
