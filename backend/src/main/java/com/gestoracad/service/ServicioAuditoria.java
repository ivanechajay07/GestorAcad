package com.gestoracad.service;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoRegistroAuditoria;
import com.gestoracad.dto.DtoResumenAuditoria;

import java.util.List;

/**
 * Servicio de auditoría del sistema.
 * Registra las operaciones relevantes en la bitácora y expone la consulta de
 * los eventos recientes para el módulo de auditoría.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioAuditoria {
    void log(String username, AccionAuditoria action, String module, String description, String endpoint, String httpMethod, String clientIp, String result);

    void log(String username, AccionAuditoria action, String module, String description, String endpoint, String httpMethod, String clientIp, String result, String userAgent, String entityName, Long entityId);

    List<DtoRegistroAuditoria> getRecentLogs();

    /**
     * Calcula el resumen agregado de los últimos {@code dias} días,
     * comparándolo con el periodo anterior de igual duración.
     *
     * @param dias tamaño de la ventana en días (se acota entre 1 y 90)
     * @return métricas, serie diaria y distribución por acción
     */
    DtoResumenAuditoria getSummary(int dias);
}
