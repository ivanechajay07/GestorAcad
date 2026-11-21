import React from 'react';
import { formatCount } from '../../utils/dashboardFormatters';

export interface BreakdownItem {
  label: string;
  value: number;
}

interface BreakdownListProps {
  items: BreakdownItem[];
  total: number;
  unit: string;
  color?: string;
  ariaLabel: string;
  emptyMessage?: string;
}

/**
 * Distribución porcentual de una métrica sobre categorías.
 * Cada fila expone etiqueta, valor y porcentaje como texto, de modo que no
 * depende del color ni de la barra para comunicar la información.
 */
export const BreakdownList: React.FC<BreakdownListProps> = ({
  items,
  total,
  unit,
  color = 'var(--primary)',
  ariaLabel,
  emptyMessage = 'Sin datos para este desglose.',
}) => {
  if (items.length === 0) {
    return <div className="chart-empty">{emptyMessage}</div>;
  }

  return (
    <ul className="dash-breakdown" aria-label={ariaLabel}>
      {items.map((item) => {
        const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li className="dash-breakdown__row" key={item.label}>
            <div className="dash-breakdown__head">
              <span className="dash-breakdown__label" title={item.label}>
                {item.label}
              </span>
              <span className="dash-breakdown__value">
                {formatCount(item.value)} {unit} ({percentage}%)
              </span>
            </div>
            <div className="dash-breakdown__track" aria-hidden="true">
              <div
                className="dash-breakdown__fill"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};
