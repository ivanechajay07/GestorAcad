import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { portalService } from '../services/portalService';
import type { TeacherPortalDto } from '../services/portalService';
import { BookOpen, GraduationCap, LayoutGrid, Pencil, Users } from 'lucide-react';

export const TeacherPortalPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<TeacherPortalDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalService
      .getTeacherSummary()
      .then((res) => setData(res.data))
      .catch(() => toast.error('No se pudo cargar tus secciones'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return <LoadingSpinner message="Consultando tus secciones..." />;
  }

  if (!data) {
    return (
      <div className="glass-panel" style={{ padding: '28px', color: 'var(--text-muted)' }}>
        No se encontró una ficha de docente vinculada a tu cuenta. Contacta al administrador.
      </div>
    );
  }

  const totalStudents = data.sections.reduce((sum, section) => sum + section.students, 0);
  const pendingActs = data.sections.filter((section) => section.actaStatus !== 'CERRADA').length;

  return (
    <div className="page-stack">
      <PageHeader
        title="Mis secciones"
        subtitle={`${data.name} · ${data.faculty ?? 'Sin facultad asignada'}`}
        icon={<LayoutGrid size={26} color="#ffffff" />}
        breadcrumbs={[{ label: 'Mi espacio' }, { label: 'Mis secciones' }]}
        stats={[
          { label: 'Secciones', value: data.sections.length },
          { label: 'Estudiantes', value: totalStudents },
          { label: 'Actas pendientes', value: pendingActs },
          { label: 'Código docente', value: data.code },
        ]}
      />

      <div className="glass-panel" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
          <BookOpen size={19} color="var(--primary)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Secciones asignadas</h2>
        </div>

        <p className="table-scroll-hint">Desliza para ver más columnas →</p>
        <div className="data-table-wrap">
          <table className="data-table data-table--stack">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Curso</th>
                <th>Sección</th>
                <th>Estudiantes</th>
                <th>Evaluaciones</th>
                <th>Horario</th>
                <th>Acta</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.sections.map((section) => (
                <tr key={section.id}>
                  <td className="cell-mono">{section.periodCode}</td>
                  <td><span className="cell-mono">{section.courseCode}</span> · {section.courseName}</td>
                  <td>{section.sectionCode}</td>
                  <td><Users size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />{section.students}</td>
                  <td>{section.evaluations}</td>
                  <td>{section.schedule || '—'}</td>
                  <td>
                    <Badge variant={section.actaStatus === 'CERRADA' ? 'success' : 'warning'} size="sm" dot>
                      {section.actaStatus}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" className="action-btn primary" title="Gestionar" aria-label={`Gestionar ${section.courseCode}-${section.sectionCode}`} onClick={() => navigate(`/my-sections/${section.id}`)}>
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.sections.length === 0 && (
                <tr><td colSpan={8} style={{ color: 'var(--text-muted)' }}>No tienes secciones asignadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <p style={{ margin: '14px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <GraduationCap size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
          Usa <strong>Gestionar</strong> para registrar notas, asistencia y cerrar el acta de cada sección.
        </p>
      </div>
    </div>
  );
};
