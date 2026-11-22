package com.gestoracad.service;

import com.gestoracad.dto.DtoReporteExportacion;

/**
 * Generación de reportes PDF institucionales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioReportesPdf {

    DtoReporteExportacion exportarActa(Long sectionId, String clientIp, String userAgent);
}
