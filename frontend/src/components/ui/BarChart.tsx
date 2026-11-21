import React from 'react';
import { formatCount } from '../../utils/dashboardFormatters';

export interface BarChartItem {
  label: string;
  value: number;
}

interface BarChartProps {
  items: BarChartItem[];
  unit?: string;
  color?: string;
  ariaLabel: string;
  emptyMessage?: string;
  total?: number;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Gráfico de barras horizontales para datos categóricos.
 * La etiqueta, el valor y el porcentaje son texto real, de modo que la
 * información es accesible sin depender del color ni del tooltip.
 */
export const BarChart: React.FC<BarChartProps> = ({
  items,
  unit = '',
  color = 'var(--primary)',
  ariaLabel,
  emptyMessage = 'Sin datos para graficar.',
  total,
  showPercentage = false,
  className = '',
}) => {
  if (items.length === 0) {
    return <div className="chart-empty">{emptyMessage}</div>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className={`bar-chart ${className}`.trim()} role="list" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const percentage = Math.round((item.value / max) * 100);
        const shareValue = showPercentage && total != null && total > 0
          ? (item.value / total) * 100
          : null;
        const share = shareValue == null
          ? null
          : Number.isInteger(shareValue)
            ? `${shareValue}%`
            : `${shareValue.toFixed(1)}%`;
        return (
          <div
            className="bar-chart__row"
            role="listitem"
            key={item.label}
            title={`${item.label}: ${formatCount(item.value)}${unit ? ` ${unit}` : ''}${share != null ? ` (${share})` : ''}`}
          >
            <span className="bar-chart__label" title={item.label}>
              {item.label}
            </span>
            <span className="bar-chart__track" aria-hidden="true">
              <span
                className="bar-chart__fill"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                  animationDelay: `${index * 60}ms`,
                }}
              />
            </span>
            <span className="bar-chart__value">
              {formatCount(item.value)}
              {unit ? ` ${unit}` : ''}
              {share != null && <span className="bar-chart__percent"> · {share}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
};
