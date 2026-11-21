package com.gestoracad.exception;

/**
 * Excepción lanzada cuando un recurso solicitado no existe.
 * Es traducida a una respuesta HTTP 404 por el manejador global de excepciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class ExcepcionRecursoNoEncontrado extends RuntimeException {
    public ExcepcionRecursoNoEncontrado(String message) {
        super(message);
    }

    public ExcepcionRecursoNoEncontrado(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s no encontrado con %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
