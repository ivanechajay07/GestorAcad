import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Gauge,
  Minus,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../ui/Card';
import type { AuditSummary } from '../../services/auditService';
import { auditActionTone, formatAuditAction, formatAuditTime } from '../../utils/auditFormatters';

/** Periodos disponibles en el selector, en días. */
const AUDIT_PERIODS = [7, 14, 30] as const;

interface AuditActivityPanelProps {
  summary: AuditSummary | null;
  loading: boolean;
  error: string | null;
  /** Periodo seleccionado, en días. */
  dias: number;
  onSelectDias: (dias: number) => void;
  onReload: () => void;
}

const percent = (value: number, total: number): number =>
  total > 0 ? Math.round((value * 100) / total) : 0;

const formatDecimal = (value: number): string =>
  value.toLocaleString('es-ES', { maximumFractionDigits: 2 });

/**
 * Panel dinámico de actividad de auditoría.
 * <p>
 * Muestra indicadores del periodo (totales, tasa de éxito, promedio y día pico),
 * un gráfico de barras navegable con teclado, la comparación frente al periodo
 * anterior y la distribución por acción. Todos los datos provienen de
 * `GET /api/v1/audit/summary`, por lo que el panel se adapta al periodo elegido
 * sin recalcular sobre una muestra limitada de la bitácora.
 */
export const AuditActivityPanel: React.FC<AuditActivityPanelProps> = ({
  summary,
  loading,
  error,
  dias,
  onSelectDias,
  onReload,
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const bars = useMemo(() => {
    if (!summary) return [];
    const max = Math.max(1, ...summary.porDia.map((day) => day.total));
    return summary.porDia.map((day) => ({
      ...day,
      percent: day.total > 0 ? Math.max(4, Math.round((day.total * 100) / max)) : 0,
    }));
  }, [summary]);

  const maxTotal = Math.max(1, ...bars.map((bar) => bar.total));
  const labelStep = dias <= 7 ? 1 : dias <= 14 ? 2 : 5;
  const activeIndex = hoveredDay ?? selectedDay;
  const activeDay = activeIndex !== null ? summary?.porDia[activeIndex] : undefined;

  if (!summary && loading) {
    return (
      <Card className="audit-panel">
        <div className="audit-panel__state" role="status">
          <Activity size={22} aria-hidden="true" />
          <span>Calculando indicadores del periodo…</span>
        </div>
      </Card>
    );
  }

  if (!summary && error) {
    return (
      <Card className="audit-panel">
        <div className="audit-panel__state audit-panel__state--error" role="alert">
          <span>{error}</span>
          <button type="button" className="audit-panel__retry" onClick={onReload}>
            <RotateCcw size={14} aria-hidden="true" />
            Reintentar
          </button>
        </div>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const successRate = percent(summary.exitos, summary.total);
  const variation = summary.variacionPorcentual;
  const variationClass =
    variation === null || variation === undefined ? 'is-neutral' : variation >= 0 ? 'is-up' : 'is-down';
  const VariationIcon =
    variation === null || variation === undefined ? Minus : variation >= 0 ? ArrowUpRight : ArrowDownRight;
  const variationLabel =
    variation === null || variation === undefined
      ? 'Sin actividad en el periodo anterior'
      : `${variation > 0 ? '+' : ''}${formatDecimal(variation)} % vs. periodo anterior`;
  const peakShare = percent(summary.eventosDiaMasActivo, summary.total);
  const rangeStart = summary.porDia[0]?.etiqueta ?? summary.desde;
  const rangeEnd = summary.porDia[summary.porDia.length - 1]?.etiqueta ?? summary.hasta;

  return (
    <Card className={`audit-panel${loading ? ' is-loading' : ''}`}>
      <div className="audit-panel__head">
        <div className="audit-panel__heading">
          <span className="audit-panel__eyebrow">
            <TrendingUp size={13} aria-hidden="true" />
            Actividad de auditoría
          </span>
          <h3 className="audit-panel__title">Tendencia de eventos</h3>
          <p className="audit-panel__subtitle">
            {summary.dias} días analizados · {rangeStart} a {rangeEnd} · Lima
          </p>
        </div>

        <div className="audit-range" role="group" aria-label="Periodo de análisis">
          {AUDIT_PERIODS.map((option) => (
            <button
              key={option}
              type="button"
              className="audit-range__btn"
              aria-pressed={option === dias}
              onClick={() => onSelectDias(option)}
            >
              {option} días
            </button>
          ))}
        </div>
      </div>

      <div className="audit-kpis">
        <article className="audit-kpi audit-kpi--total">
          <span className="audit-kpi__icon" aria-hidden="true">
            <Activity size={17} />
          </span>
          <span className="audit-kpi__label">Eventos del periodo</span>
          <strong className="audit-kpi__value">{summary.total.toLocaleString('es-PE')}</strong>
          <span className={`audit-variation ${variationClass}`}>
            <VariationIcon size={13} aria-hidden="true" />
            {variationLabel}
          </span>
        </article>

        <article className="audit-kpi audit-kpi--success">
          <span className="audit-kpi__icon" aria-hidden="true">
            <ShieldCheck size={17} />
          </span>
          <span className="audit-kpi__label">Tasa de éxito</span>
          <strong className="audit-kpi__value">{successRate} %</strong>
          <span className="audit-kpi__hint">
            {summary.exitos} éxitos · {summary.fallos} fallos
          </span>
        </article>

        <article className="audit-kpi audit-kpi--average">
          <span className="audit-kpi__icon" aria-hidden="true">
            <Gauge size={17} />
          </span>
          <span className="audit-kpi__label">Promedio diario</span>
          <strong className="audit-kpi__value">{formatDecimal(summary.promedioDiario)}</strong>
          <span className="audit-kpi__hint">eventos por día</span>
        </article>

        <article className="audit-kpi audit-kpi--peak">
          <span className="audit-kpi__icon" aria-hidden="true">
            <CalendarDays size={17} />
          </span>
          <span className="audit-kpi__label">Día más activo</span>
          <strong className="audit-kpi__value audit-kpi__value--date">
            {summary.diaMasActivo ?? 'Sin actividad'}
          </strong>
          <span className="audit-kpi__hint">
            {summary.eventosDiaMasActivo > 0
              ? `${summary.eventosDiaMasActivo} eventos · ${peakShare} % del periodo`
              : 'No hay eventos registrados'}
          </span>
        </article>
      </div>

      <div className="audit-panel__grid" aria-busy={loading}>
        <section className="audit-chart" aria-labelledby="audit-chart-title">
          <div className="audit-chart__head">
            <h4 id="audit-chart-title" className="audit-chart__title">
              Eventos por día
            </h4>
            <span className="audit-chart__updated">
              Actualizado {formatAuditTime(summary.generadoEn)}
            </span>
          </div>

          {summary.total === 0 ? (
            <div className="audit-chart__empty" role="status">
              No hay eventos de auditoría en este periodo.
            </div>
          ) : (
            <>
              <div className="audit-chart__plot">
                <div className="audit-chart__yaxis" aria-hidden="true">
                  <span>{maxTotal}</span>
                  <span>{Math.round(maxTotal / 2)}</span>
                  <span>0</span>
                </div>
                <div className={`audit-bars${dias > 14 ? ' audit-bars--dense' : ''}`} role="group" aria-label="Eventos registrados por día">
                  {bars.map((day, index) => {
                    const showLabel = index % labelStep === 0 || index === bars.length - 1;
                    return (
                      <button
                        key={day.clave}
                        type="button"
                        className={`audit-bar${day.total === 0 ? ' is-empty' : ''}`}
                        style={{ '--bar-height': `${day.percent}%` } as React.CSSProperties}
                        aria-label={`${day.etiqueta}: ${day.total} eventos`}
                        aria-pressed={selectedDay === index}
                        onMouseEnter={() => setHoveredDay(index)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onFocus={() => setHoveredDay(index)}
                        onBlur={() => setHoveredDay(null)}
                        onClick={() => setSelectedDay((current) => (current === index ? null : index))}
                      >
                        <span className="audit-bar__value">{day.total}</span>
                        <span className="audit-bar__track" aria-hidden="true">
                          <span className="audit-bar__fill" />
                        </span>
                        <span className="audit-bar__label" aria-hidden="true">
                          {showLabel ? day.etiqueta : '\u00a0'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="audit-chart__status" role="status" aria-live="polite">
                {activeDay
                  ? `${activeDay.etiqueta}: ${activeDay.total} evento${activeDay.total === 1 ? '' : 's'} (${percent(activeDay.total, maxTotal)} % del pico)`
                  : 'Pasa el cursor, usa Tab o selecciona un día para fijar su detalle.'}
              </div>

              <div className="sr-only">
                <table>
                  <caption>Eventos de auditoría por día en los últimos {summary.dias} días</caption>
                  <thead>
                    <tr>
                      <th scope="col">Día</th>
                      <th scope="col">Eventos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.porDia.map((day) => (
                      <tr key={day.clave}>
                        <th scope="row">{day.etiqueta}</th>
                        <td>{day.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="audit-actions" aria-labelledby="audit-actions-title">
          <div className="audit-chart__head">
            <h4 id="audit-actions-title" className="audit-chart__title">
              Distribución por acción
            </h4>
            <span className="audit-chart__updated">{summary.porAccion.length} tipos</span>
          </div>

          {summary.porAccion.length === 0 ? (
            <div className="audit-chart__empty" role="status">
              Sin acciones registradas en el periodo.
            </div>
          ) : (
            <ul className="audit-action-list">
              {summary.porAccion.slice(0, 6).map((action) => (
                <li key={action.clave} className="audit-action-row">
                  <div className="audit-action-row__head">
                    <span className="audit-action-row__label">{formatAuditAction(action.clave)}</span>
                    <span className="audit-action-row__total">
                      {action.total}
                      <span className="audit-action-row__pct">{percent(action.total, summary.total)} %</span>
                    </span>
                  </div>
                  <span className="audit-action-row__track" aria-hidden="true">
                    <span
                      className={`audit-action-row__fill is-${auditActionTone(action.clave)}`}
                      style={{ width: `${percent(action.total, summary.total)}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {error && (
        <p className="audit-panel__notice" role="status">
          No se pudieron actualizar los indicadores. Se muestran los últimos datos disponibles.
        </p>
      )}
    </Card>
  );
};
