import React, { useState } from 'react';
import { ChartBar, ChartLine } from 'lucide-react';
import { Card } from '../ui/Card';
import { BarChart } from '../ui/BarChart';
import { LineChart } from '../ui/LineChart';

export type ChartMode = 'linea' | 'barras';

export interface DistributionItem {
  /** Etiqueta corta para el eje del gráfico. */
  label: string;
  value: number;
  /** Etiqueta completa para tooltip, tabla accesible y vista de barras. */
  fullLabel?: string;
}

interface DistributionChartProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: DistributionItem[];
  unit: string;
  seriesName: string;
  color?: string;
  ariaLabel: string;
  description?: string;
  emptyMessage?: string;
  initialMode?: ChartMode;
  className?: string;
  total?: number;
  showPercentage?: boolean;
  footer?: React.ReactNode;
  height?: number;
}

/**
 * Tarjeta de distribución con dos vistas intercambiables.
 * La vista lineal es la predeterminada y permite explorar la serie con el
 * puntero o el teclado; la vista de barras sigue disponible para comparar
 * categorías. Ambas exponen los mismos datos en texto accesible.
 */
export const DistributionChart: React.FC<DistributionChartProps> = ({
  title,
  subtitle,
  icon,
  items,
  unit,
  seriesName,
  color = 'var(--primary)',
  ariaLabel,
  description,
  emptyMessage = 'Sin datos para graficar.',
  initialMode = 'linea',
  className = '',
  total,
  showPercentage = false,
  footer,
  height = 240,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>(initialMode);
  const hasItems = items.length > 0;
  const labels = items.map((item) => item.label);
  const tooltipLabels = items.map((item) => item.fullLabel ?? item.label);
  const values = items.map((item) => item.value);

  const modeToggle = hasItems ? (
    <div className="segmented chart-mode-toggle" role="group" aria-label={`Tipo de gráfico para ${title}`}>
      <button
        type="button"
        className={chartMode === 'linea' ? 'active' : ''}
        aria-pressed={chartMode === 'linea'}
        onClick={() => setChartMode('linea')}
      >
        <ChartLine size={14} aria-hidden="true" />
        <span className="chart-mode-toggle__label">Línea</span>
      </button>
      <button
        type="button"
        className={chartMode === 'barras' ? 'active' : ''}
        aria-pressed={chartMode === 'barras'}
        onClick={() => setChartMode('barras')}
      >
        <ChartBar size={14} aria-hidden="true" />
        <span className="chart-mode-toggle__label">Barras</span>
      </button>
    </div>
  ) : undefined;

  return (
    <Card
      className={`dash-card ${className}`.trim()}
      title={(
        <span className="dash-chart-title">
          {icon}
          <span>{title}</span>
        </span>
      )}
      subtitle={subtitle}
      extra={modeToggle}
      footer={footer}
    >
      {chartMode === 'linea' ? (
        <LineChart
          labels={labels}
          tooltipLabels={tooltipLabels}
          series={[{
            name: seriesName,
            color,
            values,
          }]}
          suffix={` ${unit}`}
          height={height}
          title={ariaLabel}
          description={description ?? `Serie lineal de ${seriesName.toLowerCase()}: ${ariaLabel.toLowerCase()}.`}
          emptyMessage={emptyMessage}
        />
      ) : (
        <BarChart
          items={items.map((item) => ({
            label: item.fullLabel ?? item.label,
            value: item.value,
          }))}
          unit={unit}
          color={color}
          ariaLabel={ariaLabel}
          emptyMessage={emptyMessage}
          total={total}
          showPercentage={showPercentage}
        />
      )}
    </Card>
  );
};
