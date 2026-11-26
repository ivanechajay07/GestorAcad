package com.gestoracad.service;

import com.gestoracad.dto.DtoResumenDashboard;

/**
 * Servicio de agregación para el panel institucional (dashboard).
 * Devuelve exclusivamente totales y distribuciones; nunca datos personales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioResumenDashboard {

    /**
     * Construye el resumen del panel respetando los permisos del usuario
     * autenticado. Los bloques sin autorización se devuelven como {@code null}.
     *
     * @return resumen agregado del sistema
     */
    DtoResumenDashboard getSummary();
}
