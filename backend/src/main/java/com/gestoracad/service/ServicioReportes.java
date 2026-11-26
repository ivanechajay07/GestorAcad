package com.gestoracad.service;

import com.gestoracad.dto.DtoReporteExportacion;

/**
 * Generación de exportaciones auditadas de los listados institucionales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioReportes {

    DtoReporteExportacion exportarEstudiantes(String clientIp, String userAgent);

    DtoReporteExportacion exportarDocentes(String clientIp, String userAgent);

    DtoReporteExportacion exportarUsuarios(String clientIp, String userAgent);
}
