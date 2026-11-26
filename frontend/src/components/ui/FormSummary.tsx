import React from 'react';

interface FormSummaryProps {
  icon: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode[];
  badge?: React.ReactNode;
  progress: number;
  progressLabel?: string;
}

/**
 * Resumen vivo para formularios de entidad.
 * Mantiene el mismo lenguaje visual del formulario de sede: identidad,
 * datos clave y progreso de completado.
 */
export const FormSummary: React.FC<FormSummaryProps> = ({
  icon,
  eyebrow = 'Vista previa',
  title,
  subtitle,
  meta,
  badge,
  progress,
  progressLabel,
}) => {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className="form-summary" aria-label="Resumen del formulario">
      <div className="form-summary__head">
        <span className="form-summary__icon" aria-hidden="true">{icon}</span>
        <div className="form-summary__copy">
          <span className="form-summary__eyebrow">{eyebrow}</span>
          <strong>{title}</strong>
          {subtitle && <small>{subtitle}</small>}
        </div>
        {badge && <div className="form-summary__badge">{badge}</div>}
      </div>

      {meta && meta.length > 0 && (
        <div className="form-summary__meta">
          {meta.map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      )}

      <div className="form-summary__progress">
        <div>
          <span>Datos completos</span>
          <strong>{safeProgress}%</strong>
        </div>
        <span className="form-summary__track" aria-hidden="true">
          <span style={{ width: `${safeProgress}%` }} />
        </span>
        {progressLabel && <small>{progressLabel}</small>}
      </div>
    </div>
  );
};
