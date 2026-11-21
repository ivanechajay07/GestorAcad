import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { portalService } from '../services/portalService';
import type { TeacherSectionDetailDto } from '../services/portalService';
import { academicInputStyle } from '../components/academic/AcademicUi';
import type { ActaDto, AttendanceDto, EvaluationDto, GradeDto } from '../services/evaluationService';
import { ArrowLeft, CheckCircle2, ClipboardList, Pencil, UserCheck } from 'lucide-react';

type TabKey = 'grades' | 'attendance' | 'act';
const TODAY = new Date().toISOString().slice(0, 10);
const STATUSES = ['PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO'];

export const TeacherSectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sectionId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [section, setSection] = useState<TeacherSectionDetailDto | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationDto[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(0);
  const [grades, setGrades] = useState<GradeDto[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDto[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(TODAY);
  const [acta, setActa] = useState<ActaDto | null>(null);
  const [tab, setTab] = useState<TabKey>('grades');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const [sectionRes, evaluationRes, attendanceRes, actRes] = await Promise.all([
        portalService.getTeacherSection(sectionId),
        portalService.getTeacherEvaluations(sectionId),
        portalService.getTeacherAttendance(sectionId, attendanceDate),
        portalService.getTeacherActa(sectionId),
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

  const loadGrades = useCallback(async () => {
    if (!selectedEvaluationId) {
      setGrades([]);
      return;
    }
    try {
      const response = await portalService.getTeacherGrades(selectedEvaluationId);
      setGrades(response.data);
    } catch {
      toast.error('No se pudieron cargar las notas');
    }
  }, [selectedEvaluationId, toast]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const selectedEvaluation = evaluations.find((evaluation) => evaluation.id === selectedEvaluationId);
  const closed = acta?.status === 'CERRADA';

  const saveGrades = async () => {
    if (!selectedEvaluationId) return;
    setSaving(true);
    try {
      await portalService.saveTeacherGrades(selectedEvaluationId, grades);
      toast.success('Notas guardadas correctamente.');
      await loadGrades();
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
      toast.success('Acta cerrada correctamente.');
    } catch {
      toast.error('No se pudo cerrar el acta. Verifica que los pesos sumen 100%.');
    } finally {
      setSaving(false);
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
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate('/my-sections')} leftIcon={<ArrowLeft size={15} />}>
            Volver
          </Button>
        }
      />

      <div className="academic-tabs" role="tablist" aria-label="Gestión de la sección">
        <button type="button" role="tab" aria-selected={tab === 'grades'} className={`academic-tab${tab === 'grades' ? ' active' : ''}`} onClick={() => setTab('grades')}>
          <Pencil size={15} /> Notas
        </button>
        <button type="button" role="tab" aria-selected={tab === 'attendance'} className={`academic-tab${tab === 'attendance' ? ' active' : ''}`} onClick={() => setTab('attendance')}>
          <UserCheck size={15} /> Asistencia
        </button>
        <button type="button" role="tab" aria-selected={tab === 'act'} className={`academic-tab${tab === 'act' ? ' active' : ''}`} onClick={() => setTab('act')}>
          <CheckCircle2 size={15} /> Acta
        </button>
      </div>

      {tab === 'grades' && (
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Notas</h2>
              <select style={{ ...academicInputStyle, width: 'auto' }} value={selectedEvaluationId || ''} onChange={(event) => setSelectedEvaluationId(Number(event.target.value))}>
                <option value="">— Evaluación —</option>
                {evaluations.map((evaluation) => <option key={evaluation.id} value={evaluation.id}>{evaluation.name} ({evaluation.weight}%)</option>)}
              </select>
            </div>
            {selectedEvaluation && !closed && (
              <Button size="sm" onClick={saveGrades} isLoading={saving}>Guardar notas</Button>
            )}
          </div>
          {evaluations.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>El administrador aún no registró evaluaciones para esta sección.</p>
          )}
          <div className="data-table-wrap">
            <table className="data-table data-table--stack">
              <thead><tr><th>Código</th><th>Estudiante</th><th>Nota (0–{selectedEvaluation?.maxScore ?? 20})</th><th>Observación</th></tr></thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.studentId}>
                    <td className="cell-mono">{grade.studentCode}</td>
                    <td>{grade.studentName}</td>
                    <td style={{ maxWidth: '110px' }}>
                      <input style={academicInputStyle} type="number" min={0} max={selectedEvaluation?.maxScore ?? 20} step={0.01}
                        value={grade.score ?? ''} disabled={closed}
                        onChange={(event) => {
                          const value = event.target.value === '' ? null : Number(event.target.value);
                          setGrades((items) => items.map((item) => item.studentId === grade.studentId ? { ...item, score: value } : item));
                        }} />
                    </td>
                    <td>
                      <input style={academicInputStyle} value={grade.observation ?? ''} disabled={closed}
                        onChange={(event) => setGrades((items) => items.map((item) => item.studentId === grade.studentId ? { ...item, observation: event.target.value } : item))} />
                    </td>
                  </tr>
                ))}
                {grades.length === 0 && <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>No hay estudiantes o evaluación seleccionada.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Asistencia</h2>
              <input style={{ ...academicInputStyle, width: 'auto' }} type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} />
            </div>
            {!closed && <Button size="sm" onClick={saveAttendance} isLoading={saving}>Guardar asistencia</Button>}
          </div>
          <div className="data-table-wrap">
            <table className="data-table data-table--stack">
              <thead><tr><th>Código</th><th>Estudiante</th><th>Estado</th></tr></thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.studentId}>
                    <td className="cell-mono">{record.studentCode}</td>
                    <td>{record.studentName}</td>
                    <td>
                      <select style={academicInputStyle} value={record.status} disabled={closed}
                        onChange={(event) => setAttendance((items) => items.map((item) => item.studentId === record.studentId ? { ...item, status: event.target.value } : item))}>
                        {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && <tr><td colSpan={3} style={{ color: 'var(--text-muted)' }}>No hay estudiantes matriculados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'act' && (
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Acta</h2>
              <Badge variant={closed ? 'success' : 'warning'} size="sm" dot>{acta?.status ?? 'ABIERTA'}</Badge>
            </div>
            {!closed && <Button size="sm" variant="danger" onClick={closeActa} isLoading={saving}>Cerrar acta</Button>}
          </div>
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
                {(acta?.details ?? []).length === 0 && <tr><td colSpan={5} style={{ color: 'var(--text-muted)' }}>El acta aún no ha sido cerrada.</td></tr>}
              </tbody>
            </table>
          </div>
          {closed && acta?.closedAt && (
            <p style={{ margin: '12px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Cerrada el {new Date(acta.closedAt).toLocaleString('es-PE')}.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
