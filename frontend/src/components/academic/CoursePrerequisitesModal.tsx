import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { academicService } from '../../services/academicService';
import type { CourseDto, PrerequisiteDto } from '../../services/academicService';
import {
  AcademicField,
  AcademicModal,
  academicErrMsg,
  academicInputStyle,
} from './AcademicUi';
import { GitBranch, Plus, Trash2 } from 'lucide-react';

interface Props {
  course: CourseDto;
  onClose: () => void;
}

export const CoursePrerequisitesModal: React.FC<Props> = ({ course, onClose }) => {
  const toast = useToast();
  const [prerequisites, setPrerequisites] = useState<PrerequisiteDto[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [selected, setSelected] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!course.id) return;
    setLoading(true);
    try {
      const [prereqRes, courseRes] = await Promise.all([
        academicService.getPrerequisites(course.id),
        academicService.getCourses(),
      ]);
      setPrerequisites(prereqRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudieron cargar los prerrequisitos'));
    } finally {
      setLoading(false);
    }
  }, [course.id, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const available = useMemo(
    () => courses.filter(
      (c) => c.active !== false
        && c.id !== course.id
        && !prerequisites.some((p) => p.prerequisiteId === c.id)
    ),
    [courses, course.id, prerequisites]
  );

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!course.id || !selected) return;
    setSaving(true);
    try {
      await academicService.addPrerequisite(course.id, selected);
      toast.success('Prerrequisito agregado.');
      setSelected(0);
      await reload();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo agregar el prerrequisito'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (prerequisite: PrerequisiteDto) => {
    if (!course.id || !prerequisite.id) return;
    try {
      await academicService.removePrerequisite(course.id, prerequisite.id);
      toast.success('Prerrequisito retirado.');
      await reload();
    } catch (err) {
      toast.error(academicErrMsg(err, 'No se pudo retirar el prerrequisito'));
    }
  };

  return (
    <AcademicModal
      title={`Prerrequisitos · ${course.code}`}
      subtitle={course.name}
      icon={<GitBranch size={20} color="var(--primary)" />}
      maxWidth="680px"
      onClose={onClose}
    >
      {loading ? (
        <LoadingSpinner message="Cargando prerrequisitos..." />
      ) : (
        <>
          <div className="data-table-wrap" style={{ marginBottom: '16px' }}>
            <table className="data-table data-table--stack">
              <thead>
                <tr><th>Código</th><th>Curso prerrequisito</th><th>Créditos</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {prerequisites.map((prerequisite) => (
                  <tr key={prerequisite.id}>
                    <td className="cell-strong cell-mono">{prerequisite.prerequisiteCode}</td>
                    <td>{prerequisite.prerequisiteName}</td>
                    <td>{prerequisite.credits}</td>
                    <td>
                      <button
                        type="button"
                        className="action-btn danger"
                        title="Retirar"
                        aria-label={`Retirar ${prerequisite.prerequisiteCode}`}
                        onClick={() => handleRemove(prerequisite)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {prerequisites.length === 0 && (
                  <tr><td colSpan={4} style={{ color: 'var(--text-muted)' }}>Este curso no tiene prerrequisitos.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end' }}>
            <AcademicField label="Agregar curso prerrequisito">
              <select
                style={academicInputStyle}
                value={selected || ''}
                onChange={(e) => setSelected(Number(e.target.value))}
              >
                <option value="">— Seleccione un curso —</option>
                {available.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
              </select>
            </AcademicField>
            <Button type="submit" size="sm" disabled={!selected} isLoading={saving} leftIcon={<Plus size={15} />}>
              Agregar
            </Button>
          </form>
        </>
      )}
    </AcademicModal>
  );
};
