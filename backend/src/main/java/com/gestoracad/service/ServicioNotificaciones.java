package com.gestoracad.service;

import com.gestoracad.dto.DtoNotificacion;

import java.util.List;

/**
 * Servicio de avisos agregados del encabezado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioNotificaciones {

    /**
     * Construye los avisos visibles para el usuario autenticado.
     * Solo se incluyen bloques cuyos permisos posee el usuario.
     *
     * @return lista ordenada de avisos, posiblemente vacía
     */
    List<DtoNotificacion> getNotificaciones();
}
