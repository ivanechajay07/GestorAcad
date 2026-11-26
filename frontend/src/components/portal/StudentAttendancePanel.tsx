import { CalendarDays, FileText } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import type { PortalAttendanceDto } from '../../services/portalService';

interface StudentAttendancePanelProps {
  records: PortalAttendanceDto[];
  onJustify?: (record: PortalAttendanceDto) => void;
}

const STATUS_LABELS: Record<string, string> = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  TARDANZA: 'Tardanza',
  JUSTIFICADO: 'Justificado',
};

const STATUS_VARIANTS = {
  PRESENTE: 'success',
  AUSENTE: 'danger',
  TARDANZA: 'warning',
  JUSTIFICADO: 'info',
} as const;

const JUSTIFICATION_LABELS: Record<string, string> = {
  PENDIENTE: 'pendiente de revisión',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
};

const formatDate = (value?: string | null): string => {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Detalle diario de asistencia de un curso, con sus justificaciones. */
export const StudentAttendancePanel = ({ records, onJustify }: StudentAttendancePanelProps) => {
  if (records.length === 0) {
    return (
      <EmptyState
        compact
        icon={<CalendarDays size={22} />}
        title="Sin registros de asistencia"
        description="El docente todavía no registró asistencia para esta sección."
      />
    );
  }

  const summary = records.reduce(
    (totals, record) => {
      switch (record.status) {
        case 'AUSENTE': totals.absent++; break;
        case 'TARDANZA': totals.late++; break;
        case 'JUSTIFICADO': totals.justified++; break;
        default: totals.present++; break;
      }
      return totals;
    },
    { present: 0, absent: 0, late: 0, justified: 0 }
  );
  const attended = summary.present + summary.late + summary.justified;
  const rate = records.length === 0 ? null : Math.round((attended / records.length) * 100);

  return (
    <div className="student-attendance">
      <div className="section-summary-grid">
        <div className="section-summary-card">
          <span>Asistencia</span>
          <strong className={rate != null && rate < 75 ? 'is-warning' : 'is-success'}>
            {rate == null ? '—' : `${rate}%`}
          </strong>
          <small>{records.length} {records.length === 1 ? 'registro' : 'registros'}</small>
        </div>
        <div className="section-summary-card">
          <span>Presentes</span>
          <strong>{summary.present}</strong>
          <small>Clases asistidas</small>
        </div>
        <div className="section-summary-card">
          <span>Tardanzas</span>
          <strong>{summary.late}</strong>
          <small>Llegadas tarde</small>
        </div>
        <div className="section-summary-card">
          <span>Justificados</span>
          <strong>{summary.justified}</strong>
          <small>Con justificación</small>
        </div>
        <div className="section-summary-card">
          <span>Ausentes</span>
          <strong>{summary.absent}</strong>
          <small>Sin asistencia</small>
        </div>
      </div>

      <ul className="student-attendance-list">
        {records.map((record, index) => (
          <li className="student-attendance-item" key={record.id ?? `${record.date}-${index}`}>
            <span className="student-attendance-item__date">{formatDate(record.date)}</span>
            <Badge
              variant={STATUS_VARIANTS[record.status as keyof typeof STATUS_VARIANTS] ?? 'outline'}
              size="sm"
            >
              {STATUS_LABELS[record.status] ?? record.status}
            </Badge>
            <div className="student-attendance-item__body">
              <span className="student-attendance-item__observation">
                {record.observation || 'Sin observación'}
              </span>
              {record.canJustify && record.id != null && onJustify && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FileText size={13} />}
                  onClick={() => onJustify(record)}
                >
                  Justificar
                </Button>
              )}
            </div>
            {record.justificationStatus && (
              <div
                className={`student-justification is-${record.justificationStatus.toLowerCase()}`}
              >
                <span className="student-justification__status">
                  Justificación {JUSTIFICATION_LABELS[record.justificationStatus] ?? record.justificationStatus.toLowerCase()}
                </span>
                {record.justificationReason && (
                  <span className="student-justification__reason">
                    Motivo: {record.justificationReason}
                  </span>
                )}
                {record.justificationResponse && (
                  <span className="student-justification__reason">
                    Respuesta del docente: {record.justificationResponse}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
