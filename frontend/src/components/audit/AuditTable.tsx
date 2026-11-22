import React from 'react';
import { Badge } from '../ui/Badge';
import type { AuditLogItem } from '../../services/auditService';
import {
  auditActionTone,
  describeClientIp,
  describeUserAgent,
  formatAuditAction,
  formatAuditDate,
  formatAuditRelative,
  formatAuditResult,
  formatAuditTime,
} from '../../utils/auditFormatters';

interface AuditTableProps {
  logs: AuditLogItem[];
  /** Instante de referencia para el texto relativo; facilita las pruebas. */
  now: Date;
}

/**
 * Tabla de la bitácora con las cinco columnas solicitadas:
 * Acción, Usuario, Dispositivo / IP, Detalle y Fecha con hora.
 * <p>
 * Cada celda combina texto visible con información secundaria (módulo,
 * resultado, red y endpoint), de modo que la lectura sea comprensible sin
 * depender del color ni de tooltips.
 */
export const AuditTable: React.FC<AuditTableProps> = ({ logs, now }) => (
  <div className="data-table-wrap">
    <table className="data-table data-table--stack audit-table">
      <caption className="sr-only">
        Bitácora de auditoría con acción, usuario, dispositivo e IP, detalle y fecha con hora.
      </caption>
      <colgroup>
        <col style={{ width: '12%' }} />
        <col style={{ width: '17%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '37%' }} />
        <col style={{ width: '16%' }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Acción</th>
          <th scope="col">Usuario</th>
          <th scope="col">Dispositivo / IP</th>
          <th scope="col">Detalle</th>
          <th scope="col">Fecha y hora</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => {
          const device = describeUserAgent(log.userAgent);
          const ip = describeClientIp(log.clientIp);
          const result = formatAuditResult(log.result);

          return (
            <tr key={log.id}>
              <td data-label="Acción">
                <div className="audit-action">
                  <Badge variant={auditActionTone(log.action)} size="sm">
                    {formatAuditAction(log.action)}
                  </Badge>
                  <span className="audit-action__module">{log.module || 'SIN MÓDULO'}</span>
                </div>
              </td>

              <td data-label="Usuario">
                <div className="audit-user">
                  <span className="cell-strong cell-mono">{log.username || 'ANONIMO'}</span>
                  <span className={`audit-result ${result.ok ? 'is-ok' : 'is-fail'}`}>
                    <span className="audit-result__dot" aria-hidden="true" />
                    {result.label}
                  </span>
                </div>
              </td>

              <td data-label="Dispositivo / IP">
                <div className="audit-device">
                  <span className="audit-device__name" title={log.userAgent ?? undefined}>
                    {device.label}
                  </span>
                  <span className="audit-device__ip" title={log.clientIp ?? undefined}>
                    {ip.value}
                    {ip.network && <span className="audit-device__net"> · {ip.network}</span>}
                  </span>
                </div>
              </td>

              <td data-label="Detalle">
                <div className="audit-detail" title={log.description ?? undefined}>
                  <span className="audit-detail__text">{log.description || 'Sin detalle registrado'}</span>
                </div>
              </td>

              <td data-label="Fecha y hora">
                <time className="audit-date" dateTime={log.timestamp}>
                  <span className="audit-date__day">{formatAuditDate(log.timestamp)}</span>
                  <span className="audit-date__time">{formatAuditTime(log.timestamp)}</span>
                  <span className="audit-date__relative">
                    {formatAuditRelative(log.timestamp, now)}
                  </span>
                </time>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
