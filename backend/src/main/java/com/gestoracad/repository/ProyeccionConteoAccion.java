package com.gestoracad.repository;

import com.gestoracad.audit.AccionAuditoria;

/**
 * Proyección DAO para agregaciones de auditoría agrupadas por acción.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ProyeccionConteoAccion {

    AccionAuditoria getAccion();

    long getTotal();
}
