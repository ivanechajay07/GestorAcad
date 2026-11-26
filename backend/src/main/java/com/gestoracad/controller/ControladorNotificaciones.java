package com.gestoracad.controller;

import com.gestoracad.dto.DtoNotificacion;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioNotificaciones;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de los avisos agregados del encabezado.
 * Devuelve únicamente conteos y estados institucionales filtrados por los
 * permisos del usuario autenticado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notificaciones", description = "Avisos agregados y filtrados por permisos")
public class ControladorNotificaciones {

    private final ServicioNotificaciones notificationService;

    public ControladorNotificaciones(ServicioNotificaciones notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener avisos del encabezado",
            description = "Devuelve avisos agregados según los permisos del usuario, sin datos personales")
    public ResponseEntity<DtoRespuestaApi<List<DtoNotificacion>>> getNotifications() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                notificationService.getNotificaciones(),
                "Avisos obtenidos exitosamente"));
    }
}
