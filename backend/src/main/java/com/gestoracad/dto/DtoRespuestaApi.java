package com.gestoracad.dto;

import java.time.LocalDateTime;

/**
 * Envoltorio estándar de respuesta de la API.
 * Contiene el indicador de éxito, un mensaje, los datos de la operación y la marca de tiempo.
 *
 * @param <T> tipo del dato transportado en la respuesta
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoRespuestaApi<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public DtoRespuestaApi() {
        this.timestamp = LocalDateTime.now();
    }

    public DtoRespuestaApi(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    public static <T> DtoRespuestaApi<T> ok(T data, String message) {
        return new DtoRespuestaApi<>(true, message, data);
    }

    public static <T> DtoRespuestaApi<T> ok(T data) {
        return new DtoRespuestaApi<>(true, "Operación exitosa", data);
    }

    public static <T> DtoRespuestaApi<T> error(String message) {
        return new DtoRespuestaApi<>(false, message, null);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
