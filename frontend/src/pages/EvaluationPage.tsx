import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { DatePicker } from '../components/ui/DatePicker';
import { SectionHeader } from '../components/ui/SectionHeader';
import { FormSummary } from '../components/ui/FormSummary';
import { TableFilterMobile, TableHeader, filterByKey, matchesFilter } from '../components/ui/TableFilters';
import type { TableFilterDef } from '../components/ui/TableFilters';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { academicService } from '../services/academicService';
import type { SectionDto } from '../services/academicService';
import { evaluationService } from '../services/evaluationService';
import { reportService } from '../services/reportService';
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
  Download,
  FileText,
  Layers,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
  Users,
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

const createFilters = (filters: TableFilterDef[]): Record<string, string> =>
  Object.fromEntries(filters.map((filter) => [filter.key, filter.type === 'select' ? 'ALL' : '']));

const EVALUATION_FILTERS: TableFilterDef[] = [
  { key: 'name', label: 'Evaluación', placeholder: 'Nombre' },
  { key: 'type', label: 'Tipo', type: 'select', options: EVALUATION_TYPES },
  { key: 'weight', label: 'Peso', placeholder: 'Peso' },
  { key: 'date', label: 'Fecha', placeholder: 'Fecha' },
  { key: 'maxScore', label: 'Nota máxima', placeholder: 'Nota' },
];

const GRADE_FILTERS: TableFilterDef[] = [
  { key: 'code', label: 'Código', placeholder: 'Código' },
  { key: 'student', label: 'Estudiante', placeholder: 'Nombre' },
  { key: 'score', label: 'Nota', placeholder: 'Nota' },
  { key: 'observation', label: 'Observación', placeholder: 'Observación' },
];

const ATTENDANCE_FILTERS: TableFilterDef[] = [
  { key: 'code', label: 'Código', placeholder: 'Código' },
  { key: 'student', label: 'Estudiante', placeholder: 'Nombre' },
  { key: 'status', label: 'Estado', type: 'select', options: ATTENDANCE_STATUS },
  { key: 'observation', label: 'Observación', placeholder: 'Observación' },
];

const ACTA_FILTERS: TableFilterDef[] = [
  { key: 'code', label: 'Código', placeholder: 'Código' },
  { key: 'student', label: 'Estudiante', placeholder: 'Nombre' },
  { key: 'average', label: 'Promedio', placeholder: 'Promedio' },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'APROBADO', label: 'Aprobado' },
      { value: 'DESAPROBADO', label: 'Desaprobado' },
    ],
  },
  { key: 'credits', label: 'Créditos', placeholder: 'Créditos' },
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
  const [exportingActa, setExportingActa] = useState(false);
  const [evaluationFilters, setEvaluationFilters] = useState(() => createFilters(EVALUATION_FILTERS));
  const [gradeFilters, setGradeFilters] = useState(() => createFilters(GRADE_FILTERS));
  const [attendanceFilters, setAttendanceFilters] = useState(() => createFilters(ATTENDANCE_FILTERS));
  const [actaFilters, setActaFilters] = useState(() => createFilters(ACTA_FILTERS));

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

  const filteredEvaluations = useMemo(() => evaluations.filter((evaluation) => (
    matchesFilter(evaluation.name, evaluationFilters.name)
    && (evaluationFilters.type === 'ALL' || evaluation.type === evaluationFilters.type)
    && matchesFilter(evaluation.weight, evaluationFilters.weight)
    && matchesFilter(evaluation.date, evaluationFilters.date)
    && matchesFilter(evaluation.maxScore, evaluationFilters.maxScore)
  )), [evaluations, evaluationFilters]);

  const filteredGrades = useMemo(() => grades.filter((grade) => (
    matchesFilter(grade.studentCode, gradeFilters.code)
    && matchesFilter(grade.studentName, gradeFilters.student)
    && matchesFilter(grade.score, gradeFilters.score)
    && matchesFilter(grade.observation, gradeFilters.observation)
  )), [grades, gradeFilters]);

  const filteredAttendance = useMemo(() => attendance.filter((record) => (
    matchesFilter(record.studentCode, attendanceFilters.code)
    && matchesFilter(record.studentName, attendanceFilters.student)
    && (attendanceFilters.status === 'ALL' || record.status === attendanceFilters.status)
    && matchesFilter(record.observation, attendanceFilters.observation)
  )), [attendance, attendanceFilters]);

  const filteredActaDetails = useMemo(() => (acta?.details ?? []).filter((detail) => (
    matchesFilter(detail.studentCode, actaFilters.code)
    && matchesFilter(detail.studentName, actaFilters.student)
    && matchesFilter(detail.average, actaFilters.average)
    && (actaFilters.status === 'ALL'
      || (detail.approved ? 'APROBADO' : 'DESAPROBADO') === actaFilters.status)
    && matchesFilter(detail.credits, actaFilters.credits)
  )), [acta, actaFilters]);

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

  const handleExportActa = async () => {
    if (!selectedSectionId) return;
    setExportingActa(true);
    try {
      const filename = await reportService.exportActa(selectedSectionId);
      toast.success(`Acta generada: ${filename}`);
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo generar el acta en PDF'));
    } finally {
      setExportingActa(false);
    }
  };

  const visibleTabKeys: TabKey[] = [
    ...(canViewEvaluations ? (['evaluations'] as TabKey[]) : []),
    ...(canViewGrades ? (['grades'] as TabKey[]) : []),
    ...(canViewAttendance ? (['attendance'] as TabKey[]) : []),
    ...(canViewActa ? (['act'] as TabKey[]) : []),
  ];

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, key: TabKey) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = visibleTabKeys.indexOf(key);
    if (current < 0) return;
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % visibleTabKeys.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + visibleTabKeys.length) % visibleTabKeys.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = visibleTabKeys.length - 1;
    const nextKey = visibleTabKeys[next];
    setActiveTab(nextKey);
    window.requestAnimationFrame(() => document.getElementById(`evaluation-tab-${nextKey}`)?.focus());
  };

  const tabButton = (key: TabKey, label: string, icon: React.ReactNode, count?: number) => (
    <button
      key={key}
      id={`evaluation-tab-${key}`}
      type="button"
      role="tab"
      aria-selected={activeTab === key}
      aria-controls={`evaluation-panel-${key}`}
      tabIndex={activeTab === key ? 0 : -1}
      className={`academic-tab${activeTab === key ? ' active' : ''}`}
      onClick={() => setActiveTab(key)}
      onKeyDown={(event) => handleTabKeyDown(event, key)}
    >
      {icon}
      {label}
      {count !== undefined && <span className="academic-tab__count">{count}</span>}
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

      <div className="glass-panel evaluation-context">
        <div className="evaluation-context__field">
          <label className="field-label" htmlFor="evaluation-section">Sección activa</label>
          <Select
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
          </Select>
        </div>
        {selectedSection && (
          <div className="evaluation-context__meta">
            <span className="evaluation-context__chip">
              <BookOpen size={13} aria-hidden="true" />
              {selectedSection.courseName}
            </span>
            <span className="evaluation-context__chip">
              <UserCheck size={13} aria-hidden="true" />
              {selectedSection.teacherName ?? 'Sin docente asignado'}
            </span>
            <span className="evaluation-context__chip">
              <Users size={13} aria-hidden="true" />
              Cupo {selectedSection.enrolledCount}/{selectedSection.capacity}
            </span>
          </div>
        )}
      </div>

      {!selectedSectionId ? (
        <div className="glass-panel" style={{ padding: '18px' }}>
          <EmptyState
                          compact
            icon={<ClipboardCheck size={24} />}
            title="Sin secciones disponibles"
            description="No hay secciones activas para evaluar. Crea una sección en Estructura Académica para comenzar."
          />
        </div>
      ) : (
        <>
          <div className="academic-tabs" role="tablist" aria-label="Evaluación académica">
            {canViewEvaluations && tabButton('evaluations', 'Evaluaciones', <ClipboardList size={15} />, evaluations.length)}
            {canViewGrades && tabButton('grades', 'Notas', <Pencil size={15} />, grades.length)}
            {canViewAttendance && tabButton('attendance', 'Asistencia', <UserCheck size={15} />, attendance.length)}
            {canViewActa && tabButton('act', 'Acta', <CheckCircle2 size={15} />, acta?.details?.length ?? 0)}
          </div>

          {activeTab === 'evaluations' && canViewEvaluations && (
            <div
              className="glass-panel"
              role="tabpanel"
              id="evaluation-panel-evaluations"
              aria-labelledby="evaluation-tab-evaluations"
              style={{ padding: '18px' }}
            >
              <SectionHeader
                compact
                icon={<ClipboardList size={18} />}
                eyebrow="Ponderación"
                title={`Evaluaciones (${evaluations.length})`}
                description={`Peso acumulado de la sección: ${totalWeight}%.`}
                aside={
                  canEditEvaluations && !actClosed ? (
                    <Button size="sm" onClick={() => openEvaluationModal()} leftIcon={<Plus size={15} />}>
                      Nueva Evaluación
                    </Button>
                  ) : undefined
                }
              />
              <p className="table-scroll-hint">Desliza para ver más columnas →</p>
              <TableFilterMobile
                filters={EVALUATION_FILTERS}
                values={evaluationFilters}
                onChange={(key, value) => setEvaluationFilters((current) => ({ ...current, [key]: value }))}
              />
          <div className="data-table-wrap">
                <table className="data-table data-table--stack table--evaluations">
                  <colgroup>
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <TableHeader
                      columns={[
                        { key: 'name', label: 'Evaluación', filter: filterByKey(EVALUATION_FILTERS, 'name') },
                        { key: 'type', label: 'Tipo', filter: filterByKey(EVALUATION_FILTERS, 'type') },
                        { key: 'weight', label: 'Peso', filter: filterByKey(EVALUATION_FILTERS, 'weight') },
                        { key: 'date', label: 'Fecha', filter: filterByKey(EVALUATION_FILTERS, 'date') },
                        { key: 'maxScore', label: 'Nota máxima', filter: filterByKey(EVALUATION_FILTERS, 'maxScore') },
                        { key: 'actions', label: 'Acciones', align: 'center' },
                      ]}
                      values={evaluationFilters}
                      onChange={(key, value) => setEvaluationFilters((current) => ({ ...current, [key]: value }))}
                    />
                  <tbody>
                    {filteredEvaluations.map((evaluation) => (
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
                    {filteredEvaluations.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState
                          compact
                            icon={<ClipboardList size={22} />}
                            title={evaluations.length === 0 ? 'Sin evaluaciones registradas' : 'Sin resultados con esos filtros'}
                            description={evaluations.length === 0
                              ? 'Agrega la primera evaluación para comenzar a calcular notas y pesos.'
                              : 'Ajusta los filtros de la cabecera para ver otras evaluaciones.'}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'grades' && canViewGrades && (
            <div
              className="glass-panel"
              role="tabpanel"
              id="evaluation-panel-grades"
              aria-labelledby="evaluation-tab-grades"
              style={{ padding: '18px' }}
            >
              <SectionHeader
                compact
                icon={<Pencil size={18} />}
                eyebrow="Calificación"
                title="Registro de notas"
                description="Selecciona una evaluación y registra la nota de cada estudiante."
                aside={
                  <>
                    <Select
                      aria-label="Evaluación"
                      style={{ ...academicInputStyle, width: '220px', maxWidth: '100%' }}
                      value={selectedEvaluationId || ''}
                      onChange={(e) => setSelectedEvaluationId(Number(e.target.value))}
                    >
                      <option value="">— Evaluación —</option>
                      {evaluations.map((evaluation) => (
                        <option key={evaluation.id} value={evaluation.id}>{evaluation.name} ({evaluation.weight}%)</option>
                      ))}
                    </Select>
                    {canEditGrades && selectedEvaluation && !actClosed && (
                      <Button size="sm" onClick={handleSaveGrades} isLoading={saving}>Guardar notas</Button>
                    )}
                  </>
                }
              />
              <p className="table-scroll-hint">Desliza para ver más columnas →</p>
              <TableFilterMobile
                filters={GRADE_FILTERS}
                values={gradeFilters}
                onChange={(key, value) => setGradeFilters((current) => ({ ...current, [key]: value }))}
              />
          <div className="data-table-wrap">
                <table className="data-table data-table--stack table--grades">
                  <colgroup>
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '34%' }} />
                  </colgroup>
                  <TableHeader
                      columns={[
                        { key: 'code', label: 'Código', filter: filterByKey(GRADE_FILTERS, 'code') },
                        { key: 'student', label: 'Estudiante', filter: filterByKey(GRADE_FILTERS, 'student') },
                        { key: 'score', label: `Nota (0–${selectedEvaluation?.maxScore ?? 20})`, filter: filterByKey(GRADE_FILTERS, 'score') },
                        { key: 'observation', label: 'Observación', filter: filterByKey(GRADE_FILTERS, 'observation') },
                      ]}
                      values={gradeFilters}
                      onChange={(key, value) => setGradeFilters((current) => ({ ...current, [key]: value }))}
                    />
                  <tbody>
                    {filteredGrades.map((grade) => (
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
                    {filteredGrades.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState
                          compact
                            icon={<Pencil size={22} />}
                            title={grades.length === 0 ? 'Sin notas para mostrar' : 'Sin resultados con esos filtros'}
                            description={grades.length === 0
                              ? 'Selecciona una evaluación y verifica que la sección tenga estudiantes matriculados.'
                              : 'Ajusta los filtros de la cabecera para ver otras notas.'}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && canViewAttendance && (
            <div
              className="glass-panel"
              role="tabpanel"
              id="evaluation-panel-attendance"
              aria-labelledby="evaluation-tab-attendance"
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
                    <DatePicker
                      ariaLabel="Fecha de asistencia"
                      style={{ ...academicInputStyle, width: 'auto' }}
                      value={attendanceDate}
                      onChange={setAttendanceDate}
                    />
                    {canEditAttendance && !actClosed && (
                      <Button size="sm" onClick={handleSaveAttendance} isLoading={saving}>Guardar asistencia</Button>
                    )}
                  </>
                }
              />
              <p className="table-scroll-hint">Desliza para ver más columnas →</p>
              <TableFilterMobile
                filters={ATTENDANCE_FILTERS}
                values={attendanceFilters}
                onChange={(key, value) => setAttendanceFilters((current) => ({ ...current, [key]: value }))}
              />
          <div className="data-table-wrap">
                <table className="data-table data-table--stack table--grades">
                  <colgroup>
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '34%' }} />
                  </colgroup>
                  <TableHeader
                      columns={[
                        { key: 'code', label: 'Código', filter: filterByKey(ATTENDANCE_FILTERS, 'code') },
                        { key: 'student', label: 'Estudiante', filter: filterByKey(ATTENDANCE_FILTERS, 'student') },
                        { key: 'status', label: 'Estado', filter: filterByKey(ATTENDANCE_FILTERS, 'status') },
                        { key: 'observation', label: 'Observación', filter: filterByKey(ATTENDANCE_FILTERS, 'observation') },
                      ]}
                      values={attendanceFilters}
                      onChange={(key, value) => setAttendanceFilters((current) => ({ ...current, [key]: value }))}
                    />
                  <tbody>
                    {filteredAttendance.map((record) => (
                      <tr key={record.studentId}>
                        <td className="cell-mono">{record.studentCode}</td>
                        <td>{record.studentName}</td>
                        <td>
                          <Select
                            style={academicInputStyle}
                            value={record.status}
                            disabled={!canEditAttendance || actClosed}
                            onChange={(event) => setAttendance((items) => items.map((item) => item.studentId === record.studentId ? { ...item, status: event.target.value } : item))}
                          >
                            {ATTENDANCE_STATUS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                          </Select>
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
                    {filteredAttendance.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState
                          compact
                            icon={<UserCheck size={22} />}
                            title={attendance.length === 0 ? 'Sin estudiantes matriculados' : 'Sin resultados con esos filtros'}
                            description={attendance.length === 0
                              ? 'La sección todavía no tiene estudiantes para registrar asistencia.'
                              : 'Ajusta los filtros de la cabecera para ver otros registros.'}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'act' && canViewActa && (
            <div
              className="glass-panel"
              role="tabpanel"
              id="evaluation-panel-act"
              aria-labelledby="evaluation-tab-act"
              style={{ padding: '18px' }}
            >
              <SectionHeader
                compact
                icon={<CheckCircle2 size={18} />}
                eyebrow="Cierre"
                title="Acta de evaluación"
                description={
                  actClosed && acta?.closedAt
                    ? `Peso acumulado: ${totalWeight}%. Cerrada el ${new Date(acta.closedAt).toLocaleString('es-PE')}.`
                    : `Peso acumulado: ${totalWeight}%. Para cerrar el acta debe ser exactamente 100%.`
                }
                aside={
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleExportActa}
                      isLoading={exportingActa}
                      leftIcon={<Download size={15} />}
                    >
                      PDF
                    </Button>
                    <Badge variant={actClosed ? 'success' : 'warning'} size="sm" dot>{acta?.status ?? 'ABIERTA'}</Badge>
                    {canCloseActa && !actClosed && (
                      <Button size="sm" variant="danger" onClick={handleCloseActa} isLoading={saving}>Cerrar acta</Button>
                    )}
                  </>
                }
              />
              <p className="table-scroll-hint">Desliza para ver más columnas →</p>
              <TableFilterMobile
                filters={ACTA_FILTERS}
                values={actaFilters}
                onChange={(key, value) => setActaFilters((current) => ({ ...current, [key]: value }))}
              />
          <div className="data-table-wrap">
                <table className="data-table data-table--stack table--acta">
                  <colgroup>
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '32%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '14%' }} />
                  </colgroup>
                  <TableHeader
                      columns={[
                        { key: 'code', label: 'Código', filter: filterByKey(ACTA_FILTERS, 'code') },
                        { key: 'student', label: 'Estudiante', filter: filterByKey(ACTA_FILTERS, 'student') },
                        { key: 'average', label: 'Promedio', filter: filterByKey(ACTA_FILTERS, 'average') },
                        { key: 'status', label: 'Estado', filter: filterByKey(ACTA_FILTERS, 'status') },
                        { key: 'credits', label: 'Créditos', filter: filterByKey(ACTA_FILTERS, 'credits') },
                      ]}
                      values={actaFilters}
                      onChange={(key, value) => setActaFilters((current) => ({ ...current, [key]: value }))}
                    />
                  <tbody>
                    {filteredActaDetails.map((detail) => (
                      <tr key={detail.studentId}>
                        <td className="cell-mono">{detail.studentCode}</td>
                        <td>{detail.studentName}</td>
                        <td>{detail.average}</td>
                        <td><Badge variant={detail.approved ? 'success' : 'danger'} size="sm">{detail.approved ? 'Aprobado' : 'Desaprobado'}</Badge></td>
                        <td>{detail.credits}</td>
                      </tr>
                    ))}
                    {filteredActaDetails.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState
                          compact
                            icon={<CheckCircle2 size={22} />}
                            title={(acta?.details ?? []).length === 0 ? 'El acta aún no ha sido cerrada' : 'Sin resultados con esos filtros'}
                            description={(acta?.details ?? []).length === 0
                              ? 'Cuando el peso acumulado llegue al 100% podrás cerrar el acta y calcular los promedios finales.'
                              : 'Ajusta los filtros de la cabecera para ver otros estudiantes.'}
                          />
                        </td>
                      </tr>
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
          <form onSubmit={handleSaveEvaluation} className="modal-form">
            <FormSummary
              icon={<ClipboardList size={18} />}
              title={evaluationForm.name.trim() || 'Nueva evaluación'}
              subtitle={EVALUATION_TYPES.find((type) => type.value === evaluationForm.type)?.label ?? evaluationForm.type}
              meta={[
                `${evaluationForm.weight || 0}% de peso`,
                `Nota máxima ${evaluationForm.maxScore || 0}`,
                evaluationForm.date || 'Fecha por definir',
              ]}
              progress={Math.round(([evaluationForm.name, evaluationForm.weight, evaluationForm.maxScore, evaluationForm.date].filter((value) => String(value ?? '').trim() && value !== 0).length / 4) * 100)}
              progressLabel="4 campos clave"
            />
            <div className="form-section">Identificación de la evaluación</div>
            <div className="modal-field-grid">
              <AcademicField label="Nombre" icon={<FileText size={13} />}>
                <input style={academicInputStyle} required value={evaluationForm.name} onChange={(e) => setEvaluationForm({ ...evaluationForm, name: e.target.value })} placeholder="Ej. Examen parcial" />
              </AcademicField>
              <AcademicField label="Tipo" icon={<Layers size={13} />}>
                <Select style={academicInputStyle} value={evaluationForm.type} onChange={(e) => setEvaluationForm({ ...evaluationForm, type: e.target.value })}>
                  {EVALUATION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </Select>
              </AcademicField>
            </div>

            <div className="form-section">Escala y ponderación</div>
            <div className="modal-field-grid">
              <AcademicField label="Peso (%)" icon={<Percent size={13} />} hint="La suma de pesos de la sección debe llegar a 100%.">
                <input style={academicInputStyle} type="number" min={0} max={100} step={0.01} required value={evaluationForm.weight} onChange={(e) => setEvaluationForm({ ...evaluationForm, weight: Number(e.target.value) })} placeholder="Ej. 30" />
              </AcademicField>
              <AcademicField label="Nota máxima" icon={<Award size={13} />}>
                <input style={academicInputStyle} type="number" min={0.01} max={20} step={0.01} required value={evaluationForm.maxScore} onChange={(e) => setEvaluationForm({ ...evaluationForm, maxScore: Number(e.target.value) })} placeholder="Ej. 20" />
              </AcademicField>
            </div>

            <div className="form-section">Programación</div>
            <AcademicField label="Fecha" icon={<CalendarDays size={13} />}>
              <DatePicker style={academicInputStyle} ariaLabel="Fecha de la evaluación" value={evaluationForm.date ?? ''} onChange={(next) => setEvaluationForm({ ...evaluationForm, date: next })} />
            </AcademicField>
            <div className="modal-form-footer">
              <Button type="button" variant="secondary" onClick={() => setEvaluationModal(false)}>Cancelar</Button>
              <Button type="submit" variant="primary" isLoading={saving}>{evaluationForm.id ? 'Guardar cambios' : 'Registrar evaluación'}</Button>
            </div>
          </form>
        </AcademicModal>
      )}
    </div>
  );
};
