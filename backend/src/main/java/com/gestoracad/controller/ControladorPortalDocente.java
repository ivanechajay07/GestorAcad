package com.gestoracad.controller;

import com.gestoracad.dto.DtoActa;
import com.gestoracad.dto.DtoAsistencia;
import com.gestoracad.dto.DtoCalificacion;
import com.gestoracad.dto.DtoEvaluacion;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoSeccionDocente;
import com.gestoracad.service.ServicioPortalDocente;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Operaciones del docente limitadas a sus propias secciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/portal/teacher")
@PreAuthorize("hasRole('DOCENTE')")
@Tag(name = "Portal docente", description = "Notas, asistencia y actas de las secciones propias")
public class ControladorPortalDocente {

    private final ServicioPortalDocente portalService;

    public ControladorPortalDocente(ServicioPortalDocente portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/sections/{id}")
    @Operation(summary = "Detalle de una sección propia")
    public ResponseEntity<DtoRespuestaApi<DtoSeccionDocente>> getSection(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(portalService.getSection(id), "Sección obtenida"));
    }

    @GetMapping("/sections/{id}/evaluations")
    @Operation(summary = "Evaluaciones de una sección propia")
    public ResponseEntity<DtoRespuestaApi<List<DtoEvaluacion>>> getEvaluations(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(portalService.getEvaluations(id), "Evaluaciones obtenidas"));
    }

    @PostMapping("/sections/{id}/evaluations")
    @Operation(summary = "Crear una evaluación en una sección propia")
    public ResponseEntity<DtoRespuestaApi<DtoEvaluacion>> createEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody DtoEvaluacion dto,
            HttpServletRequest request) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                portalService.createEvaluation(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent")),
                "Evaluación creada correctamente"));
    }

    @PutMapping("/evaluations/{id}")
    @Operation(summary = "Actualizar una evaluación propia")
    public ResponseEntity<DtoRespuestaApi<DtoEvaluacion>> updateEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody DtoEvaluacion dto,
            HttpServletRequest request) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                portalService.updateEvaluation(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent")),
                "Evaluación actualizada correctamente"));
    }

    @GetMapping("/evaluations/{id}/grades")
    @Operation(summary = "Notas de una evaluación propia")
    public ResponseEntity<DtoRespuestaApi<List<DtoCalificacion>>> getGrades(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(portalService.getGrades(id), "Notas obtenidas"));
    }

    @PutMapping("/evaluations/{id}/grades")
    @Operation(summary = "Guardar notas de una evaluación propia")
    public ResponseEntity<DtoRespuestaApi<Void>> saveGrades(
            @PathVariable Long id, @RequestBody List<DtoCalificacion> grades, HttpServletRequest request) {
        portalService.saveGrades(id, grades, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Notas guardadas correctamente"));
    }

    @GetMapping("/sections/{id}/attendance")
    @Operation(summary = "Asistencia de una sección propia")
    public ResponseEntity<DtoRespuestaApi<List<DtoAsistencia>>> getAttendance(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(portalService.getAttendance(id, date), "Asistencia obtenida"));
    }

    @GetMapping("/sections/{id}/attendance/history")
    @Operation(summary = "Historial acumulado de asistencia de una sección propia")
    public ResponseEntity<DtoRespuestaApi<List<DtoAsistencia>>> getAttendanceHistory(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                portalService.getAttendanceHistory(id), "Historial de asistencia obtenido"));
    }

    @PutMapping("/sections/{id}/attendance")
    @Operation(summary = "Guardar asistencia de una sección propia")
    public ResponseEntity<DtoRespuestaApi<Void>> saveAttendance(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody List<DtoAsistencia> attendance, HttpServletRequest request) {
        portalService.saveAttendance(id, date, attendance,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Asistencia guardada correctamente"));
    }

    @GetMapping("/sections/{id}/act")
    @Operation(summary = "Acta de una sección propia")
    public ResponseEntity<DtoRespuestaApi<DtoActa>> getActa(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(portalService.getActa(id), "Acta obtenida"));
    }

    @PostMapping("/sections/{id}/act/close")
    @Operation(summary = "Cerrar acta de una sección propia")
    public ResponseEntity<DtoRespuestaApi<DtoActa>> closeActa(@PathVariable Long id, HttpServletRequest request) {
        DtoActa acta = portalService.closeActa(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(acta, "Acta cerrada correctamente"));
    }
}
