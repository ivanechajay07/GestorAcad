import { CheckCircle2, CircleDot, Circle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import type { PortalPlanDto } from '../../services/portalService';

interface StudentPlanPanelProps {
  plan: PortalPlanDto;
}

const STATUS_LABELS = {
  APROBADO: 'Aprobado',
  EN_CURSO: 'En curso',
  PENDIENTE: 'Pendiente',
} as const;

const STATUS_VARIANTS = {
  APROBADO: 'success',
  EN_CURSO: 'primary',
  PENDIENTE: 'outline',
} as const;

/** Malla curricular del plan activo con el avance del estudiante. */
export const StudentPlanPanel = ({ plan }: StudentPlanPanelProps) => {
  if (plan.courses.length === 0) {
    return (
      <EmptyState
        compact
        icon={<Circle size={22} />}
        title="Malla curricular sin cursos"
        description="El plan activo todavía no tiene cursos registrados."
      />
    );
  }

  const cycles = Array.from(new Set(plan.courses.map((course) => course.cycle))).sort((a, b) => a - b);

  return (
    <div className="student-plan">
      <div className="student-plan-progress">
        <div className="student-plan-progress__copy">
          <span>Avance de malla</span>
          <strong>{plan.progressPercent}%</strong>
          <small>{plan.approvedCredits} de {plan.totalCredits} créditos aprobados</small>
        </div>
        <div
          className="student-plan-progress__bar"
          role="progressbar"
          aria-label="Avance de la malla curricular"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={plan.progressPercent}
        >
          <span style={{ width: `${Math.min(100, Math.max(0, plan.progressPercent))}%` }} />
        </div>
        <span className="student-plan-progress__plan">{plan.code}</span>
      </div>

      <div className="student-plan-legend" aria-label="Estados de la malla">
        <span><i className="is-approved" aria-hidden="true" />Aprobado</span>
        <span><i className="is-current" aria-hidden="true" />En curso</span>
        <span><i className="is-pending" aria-hidden="true" />Pendiente</span>
      </div>

      <div className="student-plan-grid">
        {cycles.map((cycle) => (
          <section className="student-plan-cycle" key={cycle} aria-label={`Ciclo ${cycle}`}>
            <h4 className="student-plan-cycle__title">Ciclo {cycle}</h4>
            <ul className="student-plan-cycle__list">
              {plan.courses
                .filter((course) => course.cycle === cycle)
                .map((course) => {
                  const status = course.status ?? 'PENDIENTE';
                  return (
                    <li className={`student-plan-course is-${status.toLowerCase()}`} key={course.courseCode}>
                      <span className="student-plan-course__icon" aria-hidden="true">
                        {status === 'APROBADO'
                          ? <CheckCircle2 size={15} />
                          : status === 'EN_CURSO' ? <CircleDot size={15} /> : <Circle size={15} />}
                      </span>
                      <div className="student-plan-course__info">
                        <strong>{course.courseCode} · {course.courseName}</strong>
                        <small>{course.credits} créditos · {course.mandatory ? 'Obligatorio' : 'Electivo'}</small>
                      </div>
                      <Badge variant={STATUS_VARIANTS[status] ?? 'outline'} size="sm">
                        {STATUS_LABELS[status] ?? status}
                      </Badge>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};
