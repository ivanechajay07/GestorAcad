import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { academicService } from '../../services/academicService';
import type { ScheduleDto, SectionDto } from '../../services/academicService';
import {
  AcademicField,
  AcademicModal,
  academicErrMsg,
  academicInputStyle,
} from './AcademicUi';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';

interface Props {
  section: SectionDto;
  onClose: () => void;
  onChanged: () => void;
}

const DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

export const SectionScheduleModal: React.FC<Props> = ({ section, onClose, onChanged }) => {
  const toast = useToast();
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ScheduleDto>({
    day: 'LUNES',
    startTime: '08:00',
    endTime: '10:00',
    classroom: section.classroom ?? '',
  });

  const reload = useCallback(async () => {
    if (!section.id) return;
    setLoading(true);
    try {
      const res = await academicService.getSchedules(section.id);
      setSchedules(res.data);
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudieron cargar los horarios'));
    } finally {
      setLoading(false);
    }
  }, [section.id, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!section.id) return;
    setSaving(true);
    try {
      await academicService.addSchedule(section.id, form);
      toast.success('Bloque horario agregado.');
      await reload();
      onChanged();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo agregar el horario'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (schedule: ScheduleDto) => {
    if (!section.id || !schedule.id) return;
    try {
      await academicService.removeSchedule(section.id, schedule.id);
      toast.success('Bloque horario retirado.');
      await reload();
      onChanged();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo retirar el horario'));
    }
  };

  return (
    <AcademicModal
      title={`Horario · ${section.courseCode}-${section.code}`}
      subtitle={`${section.courseName} · ${section.periodCode}`}
      icon={<CalendarClock size={20} color="var(--accent-cyan)" />}
      maxWidth="720px"
      onClose={onClose}
    >
      {loading ? (
        <LoadingSpinner message="Cargando horarios..." />
      ) : (
        <>
          <div className="data-table-wrap" style={{ marginBottom: '16px' }}>
            <table className="data-table data-table--stack">
              <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '22%' }} />
              </colgroup>
              <thead>
                <tr><th>Día</th><th>Inicio</th><th>Fin</th><th>Aula</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>{schedule.day}</td>
                    <td className="cell-mono">{schedule.startTime?.slice(0, 5)}</td>
                    <td className="cell-mono">{schedule.endTime?.slice(0, 5)}</td>
                    <td>{schedule.classroom || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="action-btn danger"
                        title="Retirar"
                        aria-label={`Retirar ${schedule.day}`}
                        onClick={() => handleRemove(schedule)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {schedules.length === 0 && (
                  <tr><td colSpan={5} style={{ color: 'var(--text-muted)' }}>La sección no tiene bloques horarios.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', alignItems: 'end' }}>
            <AcademicField label="Día">
              <select style={academicInputStyle} value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </AcademicField>
            <AcademicField label="Inicio">
              <input style={academicInputStyle} type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </AcademicField>
            <AcademicField label="Fin">
              <input style={academicInputStyle} type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </AcademicField>
            <AcademicField label="Aula">
              <input style={academicInputStyle} value={form.classroom ?? ''} onChange={(e) => setForm({ ...form, classroom: e.target.value })} />
            </AcademicField>
            <Button type="submit" size="sm" isLoading={saving} leftIcon={<Plus size={15} />}>Agregar</Button>
          </form>
        </>
      )}
    </AcademicModal>
  );
};
