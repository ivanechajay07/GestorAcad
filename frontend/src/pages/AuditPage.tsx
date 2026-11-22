import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { auditService } from '../services/auditService';
import type { AuditLogItem, AuditSummary } from '../services/auditService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { Toolbar } from '../components/ui/Toolbar';
import { AuditTable } from '../components/audit/AuditTable';
import { AuditActivityPanel } from '../components/audit/AuditActivityPanel';
import { useToast } from '../contexts/ToastContext';
import { Clock3, FileText, RefreshCw, Search } from 'lucide-react';
import {
  describeUserAgent,
  formatAuditAction,
  formatAuditDate,
  formatAuditTime,
} from '../utils/auditFormatters';

const PAGE_SIZE = 10;

/** Acciones disponibles en el filtro, en el orden en que se muestran. */
const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT'];

const RESULT_OPTIONS = [
  { value: 'ALL', label: 'Todos los resultados' },
  { value: 'SUCCESS', label: 'Solo éxitos' },
  { value: 'FAILURE', label: 'Solo fallos' },
];

/**
 * Bitácora de auditoría.
 * <p>
 * Presenta los eventos con cinco columnas legibles (acción, usuario,
 * dispositivo/IP, detalle y fecha con hora), permite buscar y filtrar sin
 * recargar la página, y muestra un reloj con la hora institucional en vivo.
 * Las fechas llegan en UTC y se convierten a la zona de Lima.
 */
export const AuditPage: React.FC = () => {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [now, setNow] = useState<Date>(() => new Date());
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryDias, setSummaryDias] = useState(7);
  const [summaryRequest, setSummaryRequest] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditService.getRecentLogs();
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
        setLastUpdated(new Date());
      }
    } catch (err: unknown) {
      toast.error('No se pudo cargar la bitácora de auditoría.');
      console.error('Error al cargar bitácora de auditoría', err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    let active = true;
    setSummaryLoading(true);
    setSummaryError(null);

    auditService
      .getSummary(summaryDias)
      .then((response) => {
        if (!active) return;
        if (!response.success || !response.data) {
          throw new Error(response.message || 'El servidor devolvió un resumen vacío');
        }
        setSummary(response.data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setSummaryError('No se pudo cargar el resumen de actividad.');
        console.error('Error al cargar el resumen de auditoría', err);
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [summaryDias, summaryRequest]);

  const refreshAll = useCallback(() => {
    loadLogs();
    setSummaryRequest((value) => value + 1);
  }, [loadLogs]);

  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: logs.length };
    logs.forEach((log) => {
      counts[log.action] = (counts[log.action] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (resultFilter === 'SUCCESS' && log.result !== 'SUCCESS') return false;
      if (resultFilter === 'FAILURE' && log.result === 'SUCCESS') return false;
      if (!query) return true;

      const device = describeUserAgent(log.userAgent).label;
      return [
        log.username,
        log.description,
        log.module,
        log.clientIp,
        log.entityName,
        device,
        formatAuditAction(log.action),
      ].some((value) => (value ?? '').toLowerCase().includes(query));
    });
  }, [logs, actionFilter, resultFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageLogs = filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasFilters = actionFilter !== 'ALL' || resultFilter !== 'ALL' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setActionFilter('ALL');
    setResultFilter('ALL');
    setSearchQuery('');
    setPage(1);
  };

  const successes = logs.filter((log) => log.result === 'SUCCESS').length;
  const failures = logs.length - successes;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Bitácora de Auditoría Transaccional"
        subtitle="Trazabilidad de accesos y cambios, con la hora exacta de Lima y el dispositivo de origen."
        icon={<FileText size={26} />}
        accent="var(--accent-emerald)"
        breadcrumbs={[{ label: 'Administración y seguridad' }, { label: 'Bitácora de Auditoría' }]}
        actions={
          <>
            <div className="audit-clock" title="Hora actual en la zona institucional (America/Lima)">
              <Clock3 size={16} aria-hidden="true" />
              <span className="audit-clock__label">Hora actual</span>
              <strong className="audit-clock__time">{formatAuditTime(now)}</strong>
              <span className="audit-clock__date">{formatAuditDate(now)} · Lima</span>
            </div>
            <Button
              variant="outline"
              onClick={refreshAll}
              leftIcon={<RefreshCw size={16} />}
              isLoading={loading}
            >
              Actualizar bitácora
            </Button>
          </>
        }
        stats={[
          { label: 'Eventos', value: summary?.total ?? logs.length },
          { label: 'Éxitos', value: summary?.exitos ?? successes },
          { label: 'Fallos', value: summary?.fallos ?? failures },
        ]}
      />

      <AuditActivityPanel
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        dias={summaryDias}
        onSelectDias={setSummaryDias}
        onReload={refreshAll}
      />

      <Toolbar
        actions={
          hasFilters ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          ) : undefined
        }
      >
        <div className="search-box">
          <Search size={16} color="var(--text-muted)" aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar en la bitácora"
            placeholder="Buscar por usuario, IP, dispositivo o detalle..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="field-select"
          aria-label="Filtrar por acción"
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">Todas las acciones ({actionCounts.ALL ?? 0})</option>
          {ACTION_OPTIONS.map((action) => (
            <option key={action} value={action}>
              {formatAuditAction(action)} ({actionCounts[action] ?? 0})
            </option>
          ))}
        </select>

        <select
          className="field-select"
          aria-label="Filtrar por resultado"
          value={resultFilter}
          onChange={(event) => {
            setResultFilter(event.target.value);
            setPage(1);
          }}
        >
          {RESULT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Toolbar>

      <Card>
        <SectionHeader
          compact
          icon={<FileText size={18} />}
          eyebrow="Trazabilidad"
          title={`Eventos registrados (${filteredLogs.length})`}
          description={
            lastUpdated
              ? `Actualizado a las ${formatAuditTime(lastUpdated)} · del más reciente al más antiguo`
              : 'Del más reciente al más antiguo'
          }
          aside={<Badge variant="outline" size="sm">{pageLogs.length} visibles</Badge>}
        />
        {loading && logs.length === 0 ? (
          <LoadingSpinner message="Consultando la bitácora de auditoría..." />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="Sin eventos para mostrar"
            description={
              hasFilters
                ? 'No hay eventos que coincidan con la búsqueda o los filtros seleccionados.'
                : 'Aún no se han registrado eventos de auditoría.'
            }
            action={
              hasFilters ? (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <AuditTable logs={pageLogs} now={now} />
            <Pagination
              page={safePage}
              pageSize={PAGE_SIZE}
              total={filteredLogs.length}
              onChange={setPage}
              itemLabel="eventos"
            />
          </>
        )}
      </Card>
    </div>
  );
};
