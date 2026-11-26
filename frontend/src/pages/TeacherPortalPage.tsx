import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useToast } from '../contexts/ToastContext';
import { portalService } from '../services/portalService';
import type { TeacherPortalDto } from '../services/portalService';
import { BookOpen, LayoutGrid, Pencil, Users } from 'lucide-react';

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
        <SectionHeader
          compact
          icon={<BookOpen size={18} />}
          eyebrow="Carga lectiva"
          title="Secciones asignadas"
          description="Cursos, horarios y estado del acta por sección."
        />

        <p className="table-scroll-hint">Desliza para ver más columnas →</p>
        <div className="data-table-wrap">
          <table className="data-table data-table--stack table--teacher-sections">
            <colgroup>
              <col style={{ width: '9%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '21%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '13%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Curso</th>
                <th>Sección</th>
                <th>Estudiantes</th>
                <th title="Evaluaciones registradas">Eval.</th>
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
                  <td title={section.schedule || undefined}>
                    <div className="schedule-list">
                      {(section.schedule || '—').split('·').map((part, index) => (
                        <span key={index}>{part.trim()}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Badge variant={section.actaStatus === 'CERRADA' ? 'success' : 'warning'} size="sm" dot>
                      {section.actaStatus}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Pencil size={14} />}
                      title="Gestionar"
                      aria-label={`Gestionar ${section.courseCode}-${section.sectionCode}`}
                      onClick={() => navigate(`/my-sections/${section.id}`)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Gestionar
                    </Button>
                  </td>
                </tr>
              ))}
              {data.sections.length === 0 && (
                <tr><td colSpan={8} style={{ color: 'var(--text-muted)' }}>No tienes secciones asignadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>


      </div>
    </div>
  );
};
