import { useMemo, useState } from 'react';
import type { PortalCourseDto } from '../../services/portalService';
import { projectedCourseAverage, requiredPendingAverage } from '../../utils/portal';

interface CourseSimulatorProps {
  course: PortalCourseDto;
  minimumGrade?: number;
}

/** Simulador de nota para las evaluaciones pendientes de un curso. */
export const CourseSimulator = ({ course, minimumGrade = 12 }: CourseSimulatorProps) => {
  const [target, setTarget] = useState(String(minimumGrade));
  const [scores, setScores] = useState<Record<number, string>>({});

  const pending = useMemo(
    () =>
      course.grades
        .map((grade, index) => ({ ...grade, index }))
        .filter((grade) => grade.score == null && grade.weight > 0),
    [course.grades]
  );

  const hypothetical = useMemo(() => {
    const values: Record<number, number | null> = {};
    pending.forEach((grade) => {
      const raw = scores[grade.index];
      values[grade.index] = raw == null || raw === '' ? null : Number(raw);
    });
    return values;
  }, [pending, scores]);

  const targetValue = Number(target);
  const effectiveTarget = Number.isFinite(targetValue) ? targetValue : minimumGrade;
  const projected = projectedCourseAverage(course, hypothetical);
  const required = requiredPendingAverage(course, effectiveTarget);

  let requirement = 'No hay evaluaciones pendientes.';
  if (required != null) {
    if (required <= 0) {
      requirement = 'Con las notas actuales ya alcanzas la nota objetivo.';
    } else if (required > 20) {
      requirement = 'No es posible alcanzar la nota objetivo con las evaluaciones pendientes.';
    } else {
      requirement = `Necesitas un promedio de ${required} en las evaluaciones pendientes.`;
    }
  }

  return (
    <section className="grade-simulator" aria-label="Simulador de nota">
      <div className="grade-simulator__head">
        <div>
          <h4>Simulador de nota</h4>
          <p>Prueba notas hipotéticas para las evaluaciones pendientes.</p>
        </div>
        <label className="grade-simulator__target">
          Nota objetivo
          <input
            type="number"
            min={0}
            max={20}
            step={0.1}
            value={target}
            aria-label="Nota objetivo del simulador"
            onChange={(event) => setTarget(event.target.value)}
          />
        </label>
      </div>

      {pending.length === 0 ? (
        <p className="grade-simulator__empty">
          No hay evaluaciones pendientes en este curso.
          {course.average != null ? ` Promedio del acta: ${course.average}.` : ''}
        </p>
      ) : (
        <>
          <div className="grade-simulator__fields">
            {pending.map((grade) => (
              <label key={`${grade.evaluationName}-${grade.index}`}>
                <span>Nota en {grade.evaluationName} <small>({grade.weight}%)</small></span>
                <input
                  type="number"
                  min={0}
                  max={grade.maxScore}
                  step={0.01}
                  value={scores[grade.index] ?? ''}
                  aria-label={`Nota simulada para ${grade.evaluationName}`}
                  onChange={(event) => {
                    setScores((current) => ({ ...current, [grade.index]: event.target.value }));
                  }}
                />
              </label>
            ))}
          </div>

          <div className="grade-simulator__result">
            <div>
              <span>Promedio proyectado</span>
              <strong>{projected == null ? '—' : projected}</strong>
              <small>sobre 20</small>
            </div>
            <div>
              <span>Nota objetivo</span>
              <strong>{effectiveTarget}</strong>
              <small>mínima {minimumGrade}</small>
            </div>
          </div>

          <p className="grade-simulator__requirement">{requirement}</p>
        </>
      )}
    </section>
  );
};
