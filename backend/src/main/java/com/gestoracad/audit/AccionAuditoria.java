package com.gestoracad.audit;

/**
 * Acciones auditables del sistema.
 * Identifican el tipo de operación registrada en la bitácora de auditoría.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public enum AccionAuditoria {
    /** Inicio de sesión. */
    LOGIN,
    /** Cierre de sesión. */
    LOGOUT,
    /** Creación de un registro. */
    CREATE,
    /** Actualización de un registro. */
    UPDATE,
    /** Eliminación de un registro. */
    DELETE,
    /** Consulta o visualización de información. */
    VIEW,
    /** Exportación de datos. */
    EXPORT,
    /** Importación de datos. */
    IMPORT
}
