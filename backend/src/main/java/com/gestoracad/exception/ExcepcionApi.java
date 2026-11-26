package com.gestoracad.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción de negocio con código de estado HTTP asociado.
 * Se lanza ante errores de validación o reglas de negocio y es traducida a una
 * respuesta JSON por el manejador global de excepciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class ExcepcionApi extends RuntimeException {
    private final HttpStatus status;

    public ExcepcionApi(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public ExcepcionApi(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public ExcepcionApi(String message, Throwable cause) {
        super(message, cause);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
