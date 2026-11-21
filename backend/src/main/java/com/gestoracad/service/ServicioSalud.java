package com.gestoracad.service;

import com.gestoracad.dto.DtoSaludSistema;

/**
 * Servicio de diagnóstico del sistema (health check).
 * Expone el estado general de la plataforma y una sonda ligera de disponibilidad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioSalud {

    /** Devuelve el estado general del sistema y el detalle de sus componentes. */
    DtoSaludSistema getSystemHealth();

    /** Sonda ligera de disponibilidad (liveness) usada por Docker y microservicios. */
    String ping();
}
