package com.gestoracad.controller;

import com.gestoracad.dto.DtoHorarioSeccion;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioHorarioSeccion;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de horarios estructurados por sección.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/sections/{sectionId}/schedules")
@Tag(name = "Horarios", description = "Bloques horarios y detección de choques")
public class ControladorHorarioSeccion {

    private final ServicioHorarioSeccion scheduleService;

    public ControladorHorarioSeccion(ServicioHorarioSeccion scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SECCION_VIEW')")
    @Operation(summary = "Listar horarios de una sección")
    public ResponseEntity<DtoRespuestaApi<List<DtoHorarioSeccion>>> getSchedules(@PathVariable Long sectionId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                scheduleService.getSchedules(sectionId), "Horarios obtenidos"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SECCION_EDIT')")
    @Operation(summary = "Agregar bloque horario",
            description = "Rechaza choques con la misma sección, docente o aula en el periodo")
    public ResponseEntity<DtoRespuestaApi<DtoHorarioSeccion>> addSchedule(
            @PathVariable Long sectionId, @Valid @RequestBody DtoHorarioSeccion dto, HttpServletRequest request) {
        DtoHorarioSeccion created = scheduleService.addSchedule(sectionId, dto,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Horario agregado"), HttpStatus.CREATED);
    }

    @DeleteMapping("/{scheduleId}")
    @PreAuthorize("hasAuthority('SECCION_EDIT')")
    @Operation(summary = "Retirar bloque horario")
    public ResponseEntity<DtoRespuestaApi<Void>> removeSchedule(
            @PathVariable Long sectionId, @PathVariable Long scheduleId, HttpServletRequest request) {
        scheduleService.removeSchedule(sectionId, scheduleId,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Horario retirado"));
    }
}
