package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoSaludSistema;
import com.gestoracad.service.ServicioSalud;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST de diagnóstico y salud del sistema.
 * Expone endpoints públicos de verificación (health y liveness) para Docker,
 * monitoreo y balanceadores.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Salud y Estado", description = "Endpoints de diagnóstico, salud del sistema y verificación arquitectónica")
public class ControladorSalud {

    private final ServicioSalud healthService;

    public ControladorSalud(ServicioSalud healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    @Operation(summary = "Obtener estado general del sistema", description = "Verifica conectividad a BD, perfiles activos y componentes de la plataforma")
    public ResponseEntity<DtoRespuestaApi<DtoSaludSistema>> getHealth() {
        DtoSaludSistema health = healthService.getSystemHealth();
        return ResponseEntity.ok(DtoRespuestaApi.ok(health, "Diagnóstico del sistema obtenido correctamente"));
    }

    @GetMapping("/ping")
    @Operation(summary = "Sonda ligera de disponibilidad", description = "Devuelve respuesta inmediata para sondas de liveness de Docker/Kubernetes")
    public ResponseEntity<DtoRespuestaApi<String>> ping() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(healthService.ping(), "Servicio activo"));
    }
}
