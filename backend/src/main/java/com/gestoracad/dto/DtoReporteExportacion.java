package com.gestoracad.dto;

/**
 * Archivo generado por el módulo de reportes.
 *
 * @param nombreArchivo nombre sugerido para la descarga
 * @param contenido     bytes del archivo en UTF-8
 * @author Equipo de Desarrollo Gestor Académico
 */
public record DtoReporteExportacion(String nombreArchivo, byte[] contenido) {
}
