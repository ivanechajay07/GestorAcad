import React, { useId, useMemo, useState } from 'react';
import { formatCount } from '../../utils/dashboardFormatters';

export interface DonutItem {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  items: DonutItem[];
  unit: string;
  ariaLabel: string;
  description?: string;
  emptyMessage?: string;
  centerLabel?: string;
  centerValue?: string | number;
  showPercentage?: boolean;
}

const SIZE = 180;
const CENTER = SIZE / 2;
const RADIUS = 62;
const STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const truncate = (value: string, max = 18): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

const formatShare = (fraction: number): string => {
  const percentage = fraction * 100;
  return Number.isInteger(percentage) ? `${percentage}%` : `${percentage.toFixed(1)}%`;
};

/**
 * Gráfico de dona para proporciones categóricas.
 * Cada porción es enfocable y expone etiqueta, valor y porcentaje; la leyenda
 * ofrece la misma información como texto para lectores de pantalla.
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  items,
  unit,
  ariaLabel,
  description,
  emptyMessage = 'Sin datos para graficar.',
  centerLabel = 'Total',
  centerValue,
  showPercentage = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const segments = useMemo(() => items.map((item, index) => {
    const value = Math.max(0, item.value);
    const fraction = total > 0 ? value / total : 0;
    const dash = fraction * CIRCUMFERENCE;
    const previous = items
      .slice(0, index)
      .reduce((sum, previousItem) => sum + Math.max(0, previousItem.value), 0);
    const offset = total > 0 ? (previous / total) * CIRCUMFERENCE : 0;
    return {
      ...item,
      value,
      fraction,
      dash,
      offset,
    };
  }), [items, total]);

  if (items.length === 0 || total <= 0) {
    return <div className="chart-empty">{emptyMessage}</div>;
  }

  const active = activeIndex != null ? segments[activeIndex] : null;
  const centerPrimary = active ? truncate(active.label) : centerLabel;
  const centerSecondary = active
    ? `${formatCount(active.value)} ${unit}${showPercentage ? ` · ${formatShare(active.fraction)}` : ''}`
    : centerValue ?? `${formatCount(total)} ${unit}`;

  return (
    <div className="donut-chart">
      <div className="donut-chart__visual">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="donut-chart__svg"
          role="group"
          aria-labelledby={`${uid}-title ${uid}-desc`}
        >
          <title id={`${uid}-title`}>{ariaLabel}</title>
          <desc id={`${uid}-desc`}>{description ?? `Distribución porcentual de ${ariaLabel.toLowerCase()}.`}</desc>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--bg-surface-elevated)"
            strokeWidth={STROKE}
          />
          {segments.map((segment, index) => {
            const share = formatShare(segment.fraction);
            return (
              <circle
                key={`${segment.label}-${index}`}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={segment.color ?? 'var(--primary)'}
                strokeWidth={activeIndex === index ? STROKE + 3 : STROKE}
                strokeDasharray={`${segment.dash} ${CIRCUMFERENCE - segment.dash}`}
                strokeDashoffset={-segment.offset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                className={`donut-chart__segment${activeIndex === index ? ' is-active' : ''}`}
                tabIndex={0}
                role="img"
                aria-label={`${segment.label}: ${formatCount(segment.value)} ${unit} (${share})`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
              >
                <title>{`${segment.label}: ${formatCount(segment.value)} ${unit} (${share})`}</title>
              </circle>
            );
          })}
          <text x={CENTER} y={CENTER - 5} textAnchor="middle" className="donut-chart__center-label">
            {centerPrimary}
          </text>
          <text x={CENTER} y={CENTER + 14} textAnchor="middle" className="donut-chart__center-value">
            {centerSecondary}
          </text>
        </svg>
      </div>

      <ul className="donut-chart__legend" aria-label={`Leyenda de ${ariaLabel}`}>
        {segments.map((segment, index) => {
          const share = formatShare(segment.fraction);
          return (
            <li
              key={`${segment.label}-${index}`}
              className={`donut-chart__legend-item${activeIndex === index ? ' is-active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span
                className="donut-chart__swatch"
                style={{ background: segment.color ?? 'var(--primary)' }}
                aria-hidden="true"
              />
              <span className="donut-chart__legend-label" title={segment.label}>
                {segment.label}
              </span>
              <span className="donut-chart__legend-value">
                {formatCount(segment.value)} {unit}
                {showPercentage ? ` · ${share}` : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
