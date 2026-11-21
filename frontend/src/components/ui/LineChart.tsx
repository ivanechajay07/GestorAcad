import React, { useId, useMemo, useState } from 'react';

export interface LineChartSeries {
  name: string;
  color: string;
  values: number[];
}

interface LineChartProps {
  labels: string[];
  series: LineChartSeries[];
  height?: number;
  suffix?: string;
  emptyMessage?: string;
  /** Etiquetas completas para el tooltip y la tabla accesible (opcional). */
  tooltipLabels?: string[];
  /** Título accesible del gráfico (se usa en <title> y en la tabla equivalente). */
  title?: string;
  /** Descripción breve para lectores de pantalla. */
  description?: string;
}

const W = 640;

/** Redondea el máximo del eje a un paso legible (1, 2, 2.5, 3, 4, 5 × 10^n). */
const niceStep = (value: number): number => {
  if (!Number.isFinite(value) || value <= 1) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const fraction = value / magnitude;
  const niceFraction = fraction <= 1
    ? 1
    : fraction <= 2
      ? 2
      : fraction <= 2.5
        ? 2.5
        : fraction <= 3
          ? 3
          : fraction <= 4
            ? 4
            : fraction <= 5
              ? 5
              : 10;
  return Math.max(1, niceFraction * magnitude);
};

const formatTick = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

export const LineChart: React.FC<LineChartProps> = ({
  labels,
  series,
  height = 230,
  suffix = '',
  emptyMessage = 'Sin datos para graficar.',
  tooltipLabels,
  title = 'Serie temporal',
  description = 'Gráfico de líneas con la evolución de los valores por periodo.',
}) => {
  const uid = useId().replace(/:/g, '');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const pointLabel = (index: number) => tooltipLabels?.[index] ?? labels[index];

  const pad = { top: 22, right: 20, bottom: 34, left: 44 };
  const innerW = W - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = labels.length;

  const hasData = n > 0 && series.some((s) => s.values.some((value) => Number(value) !== 0));

  const maxV = useMemo(() => {
    const all = series.flatMap((s) => s.values);
    const rawMax = Math.max(1, ...all);
    const gridCount = 4;
    return niceStep(rawMax / gridCount) * gridCount;
  }, [series]);

  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const y = (v: number) => pad.top + innerH - (innerH * v) / maxV;

  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => (maxV / gridCount) * i);

  const pathFor = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  const areaFor = (values: number[]) =>
    `${pathFor(values)} L ${x(n - 1).toFixed(1)} ${(pad.top + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`;

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const idx = n <= 1 ? 0 : Math.round(ratio * (n - 1));
    setHoverIndex(idx);
  };

  const handleKeyDown = (event: React.KeyboardEvent<SVGRectElement>) => {
    if (n === 0) return;
    const current = hoverIndex ?? -1;
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        setHoverIndex(Math.min(n - 1, current + 1));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setHoverIndex(Math.max(0, current < 0 ? n - 1 : current - 1));
        break;
      case 'Home':
        event.preventDefault();
        setHoverIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setHoverIndex(n - 1);
        break;
      case 'Escape':
        setHoverIndex(null);
        break;
      default:
        break;
    }
  };

  if (!hasData) {
    return <div className="chart-empty">{emptyMessage}</div>;
  }

  const tooltipLeftPct = (x(hoverIndex ?? 0) / W) * 100;

  return (
    <div className="line-chart">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="line-chart__svg"
        role="img"
        aria-labelledby={`${uid}-title ${uid}-desc`}
      >
        <title id={`${uid}-title`}>{title}</title>
        <desc id={`${uid}-desc`}>{description}</desc>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.name} id={`lg-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.38" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {gridLines.map((g, i) => {
          const gy = y(g);
          return (
            <g key={i} aria-hidden="true">
              <line x1={pad.left} y1={gy} x2={W - pad.right} y2={gy} stroke="var(--border-light)" strokeWidth={1} />
              <text x={pad.left - 10} y={gy + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
                {formatTick(g)}
              </text>
            </g>
          );
        })}

        {labels.map((label, i) => (
          <text
            key={`${label}-${i}`}
            x={x(i)}
            y={height - 10}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-muted)"
            aria-hidden="true"
          >
            {label}
          </text>
        ))}

        {series.map((s, i) => (
          <g key={s.name} aria-hidden="true">
            <path className="line-chart__area" d={areaFor(s.values)} fill={`url(#lg-${uid}-${i})`} />
            <path
              className="line-chart__line"
              d={pathFor(s.values)}
              pathLength={1}
              fill="none"
              stroke={s.color}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.values.map((v, idx) => (
              <circle
                key={idx}
                className="line-chart__point"
                cx={x(idx)}
                cy={y(v)}
                r={hoverIndex === idx ? 6 : 4}
                fill={s.color}
                stroke="var(--bg-surface)"
                strokeWidth={hoverIndex === idx ? 3 : 2}
                style={{ animationDelay: `${idx * 55}ms` }}
              />
            ))}
          </g>
        ))}

        {hoverIndex !== null && (
          <line
            x1={x(hoverIndex)}
            y1={pad.top}
            x2={x(hoverIndex)}
            y2={pad.top + innerH}
            stroke="var(--border-strong)"
            strokeDasharray="4 4"
            aria-hidden="true"
          />
        )}

        <rect
          x={pad.left}
          y={pad.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          tabIndex={0}
          aria-label="Explorar los valores del gráfico con las flechas izquierda y derecha"
          role="img"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
          onFocus={() => setHoverIndex((current) => current ?? 0)}
          onBlur={() => setHoverIndex(null)}
          onKeyDown={handleKeyDown}
          className="line-chart__hit"
        />
      </svg>

      {hoverIndex !== null && (
        <div
          className="line-chart__tooltip"
          style={{ left: `clamp(64px, ${tooltipLeftPct}%, calc(100% - 64px))` }}
          role="status"
          aria-live="polite"
        >
          <div className="line-chart__tooltip-title">{pointLabel(hoverIndex)}</div>
          {series.map((s) => (
            <div key={s.name} className="line-chart__tooltip-row">
              <span className="line-chart__swatch" style={{ background: s.color }} aria-hidden="true" />
              <span className="line-chart__tooltip-label">{s.name}:</span>
              <strong>
                {s.values[hoverIndex] ?? 0}
                {suffix}
              </strong>
            </div>
          ))}
        </div>
      )}

      <div className="line-chart__legend">
        {series.map((s) => (
          <span key={s.name} className="line-chart__legend-item">
            <span className="line-chart__swatch" style={{ background: s.color }} aria-hidden="true" />
            {s.name}
          </span>
        ))}
      </div>

      {/* Tabla equivalente: visible bajo demanda y accesible sin puntero. */}
      <div className="line-chart__data">
        <button
          type="button"
          className="line-chart__data-toggle"
          aria-expanded={showTable}
          onClick={() => setShowTable((value) => !value)}
        >
          {showTable ? 'Ocultar datos' : 'Ver datos'}
        </button>
        <div className={showTable ? 'line-chart__table' : 'sr-only'}>
          <table>
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Periodo</th>
                {series.map((s) => (
                  <th key={s.name} scope="col">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, index) => (
                <tr key={`${label}-${index}`}>
                  <th scope="row">{pointLabel(index)}</th>
                  {series.map((s) => (
                    <td key={s.name}>
                      {s.values[index] ?? 0}
                      {suffix}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
