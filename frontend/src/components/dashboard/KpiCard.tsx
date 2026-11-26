import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export interface KpiMeter {
  value: number;
  max: number;
  label: string;
}

export interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  accent?: string;
  to?: string;
  loading?: boolean;
  meter?: KpiMeter;
  className?: string;
}

/**
 * Tarjeta de indicador clave del panel.
 * El icono es decorativo; el valor, la pista y el medidor son texto accesible.
 */
export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  hint,
  icon,
  accent = 'var(--primary)',
  to,
  loading = false,
  meter,
  className = '',
}) => {
  const meterPercentage = meter && meter.max > 0
    ? Math.min(100, Math.max(0, Math.round((meter.value / meter.max) * 100)))
    : null;

  const body = (
    <Card
      interactive={Boolean(to)}
      className={`card-fill dash-kpi${to ? ' dash-kpi--linked' : ' dash-kpi--static'}${loading ? ' is-updating' : ''} ${className}`.trim()}
      style={{ padding: 'clamp(10px, 1.4vw, 14px)' }}
    >
      <div className="dash-kpi__top">
        <div className="dash-kpi__body">
          <span className="dash-kpi__label">{label}</span>
          <div className="dash-kpi__value"><AnimatedNumber value={value} /></div>
        </div>
        <span
          className="dash-kpi__icon"
          style={{ '--kpi-accent': accent } as React.CSSProperties}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      {hint && <p className="dash-kpi__hint">{hint}</p>}

      {meter && meterPercentage != null && (
        <div className="dash-kpi__meter">
          <div
            className="dash-kpi__meter-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={meter.max}
            aria-valuenow={meter.value}
            aria-label={meter.label}
          >
            <span
              className="dash-kpi__meter-fill"
              style={{
                width: `${meterPercentage}%`,
                backgroundColor: accent,
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );

  return to ? (
    <Link
      to={to}
      className="link-clean"
    >
      {body}
    </Link>
  ) : (
    body
  );
};
