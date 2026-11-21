package com.gestoracad.exception;

import com.gestoracad.dto.DtoRespuestaError;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

/**
 * Manejador global de excepciones de la API.
 * Traduce las excepciones de negocio, validación y seguridad a respuestas JSON
 * homogéneas con el código HTTP adecuado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestControllerAdvice
public class ManejadorGlobalExcepciones {

    private static final Logger log = LoggerFactory.getLogger(ManejadorGlobalExcepciones.class);

    @ExceptionHandler(ExcepcionRecursoNoEncontrado.class)
    public ResponseEntity<DtoRespuestaError> handleResourceNotFoundException(
            ExcepcionRecursoNoEncontrado ex, HttpServletRequest request) {
        log.warn("Recurso no encontrado: {} - Ruta: {}", ex.getMessage(), request.getRequestURI());
        DtoRespuestaError error = new DtoRespuestaError(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<DtoRespuestaError> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        log.warn("Error de validación en solicitud a {}: {}", request.getRequestURI(), errors);
        DtoRespuestaError error = new DtoRespuestaError(
                HttpStatus.BAD_REQUEST.value(),
                "Error de validación",
                "Uno o más campos contienen valores inválidos",
                request.getRequestURI(),
                errors
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<DtoRespuestaError> handleBadCredentialsException(
            BadCredentialsException ex, HttpServletRequest request) {
        log.warn("Credenciales incorrectas en {}", request.getRequestURI());
        DtoRespuestaError error = new DtoRespuestaError(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                "Credenciales de acceso incorrectas o inválidas",
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<DtoRespuestaError> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean anonymous = authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken;

        if (anonymous) {
            log.warn("No autenticado en {}", request.getRequestURI());
            DtoRespuestaError error = new DtoRespuestaError(
                    HttpStatus.UNAUTHORIZED.value(),
                    HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                    "Acceso no autorizado: se requiere autenticación válida",
                    request.getRequestURI()
            );
            return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
        }

        log.warn("Acceso denegado en {}", request.getRequestURI());
        DtoRespuestaError error = new DtoRespuestaError(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "No cuenta con los permisos necesarios para realizar esta acción",
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(ExcepcionApi.class)
    public ResponseEntity<DtoRespuestaError> handleApiException(
            ExcepcionApi ex, HttpServletRequest request) {
        HttpStatus status = ex.getStatus();
        log.error("Excepción de API en {} ({}): {}", request.getRequestURI(), status.value(), ex.getMessage());
        DtoRespuestaError error = new DtoRespuestaError(
                status.value(),
                "Error de Negocio",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, status);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<DtoRespuestaError> handleNoResourceFoundException(
            NoResourceFoundException ex, HttpServletRequest request) {
        log.warn("Ruta no encontrada: {}", request.getRequestURI());
        DtoRespuestaError error = new DtoRespuestaError(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                "El recurso solicitado no existe",
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<DtoRespuestaError> handleMethodNotSupportedException(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        log.warn("Método HTTP no soportado: {} {}", ex.getMethod(), request.getRequestURI());
        DtoRespuestaError error = new DtoRespuestaError(
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                HttpStatus.METHOD_NOT_ALLOWED.getReasonPhrase(),
                "Método HTTP no soportado para este recurso",
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.METHOD_NOT_ALLOWED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<DtoRespuestaError> handleGenericException(
            Exception ex, HttpServletRequest request) {
        log.error("Error no controlado en {}: ", request.getRequestURI(), ex);
        DtoRespuestaError error = new DtoRespuestaError(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "Ocurrió un error interno en el servidor. Por favor contacte al administrador.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
