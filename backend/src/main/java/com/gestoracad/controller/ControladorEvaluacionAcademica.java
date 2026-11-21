package com.gestoracad.controller;

import com.gestoracad.dto.DtoActa;
import com.gestoracad.dto.DtoAsistencia;
import com.gestoracad.dto.DtoCalificacion;
import com.gestoracad.dto.DtoEvaluacion;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioEvaluacionAcademica;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
 * Controlador de evaluación académica.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Evaluación académica", description = "Evaluaciones, notas, asistencia y actas")
public class ControladorEvaluacionAcademica {

    private final ServicioEvaluacionAcademica evaluationService;

    public ControladorEvaluacionAcademica(ServicioEvaluacionAcademica evaluationService) {
        this.evaluationService = evaluationService;
    }

    @GetMapping("/sections/{sectionId}/evaluations")
    @PreAuthorize("hasAuthority('EVALUACION_VIEW')")
    @Operation(summary = "Listar evaluaciones de una sección")
    public ResponseEntity<DtoRespuestaApi<List<DtoEvaluacion>>> getEvaluations(@PathVariable Long sectionId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                evaluationService.getEvaluations(sectionId), "Evaluaciones obtenidas"));
    }

    @PostMapping("/sections/{sectionId}/evaluations")
    @PreAuthorize("hasAuthority('EVALUACION_EDIT')")
    @Operation(summary = "Registrar evaluación")
    public ResponseEntity<DtoRespuestaApi<DtoEvaluacion>> createEvaluation(
            @PathVariable Long sectionId, @Valid @RequestBody DtoEvaluacion dto, HttpServletRequest request) {
        DtoEvaluacion created = evaluationService.createEvaluation(sectionId, dto,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Evaluación registrada"), HttpStatus.CREATED);
    }

    @PutMapping("/evaluations/{id}")
    @PreAuthorize("hasAuthority('EVALUACION_EDIT')")
    @Operation(summary = "Actualizar evaluación")
    public ResponseEntity<DtoRespuestaApi<DtoEvaluacion>> updateEvaluation(
            @PathVariable Long id, @Valid @RequestBody DtoEvaluacion dto, HttpServletRequest request) {
        DtoEvaluacion updated = evaluationService.updateEvaluation(id, dto,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Evaluación actualizada"));
    }

    @DeleteMapping("/evaluations/{id}")
    @PreAuthorize("hasAuthority('EVALUACION_EDIT')")
    @Operation(summary = "Desactivar evaluación")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteEvaluation(@PathVariable Long id, HttpServletRequest request) {
        evaluationService.deleteEvaluation(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Evaluación desactivada"));
    }

    @GetMapping("/evaluations/{id}/grades")
    @PreAuthorize("hasAuthority('NOTA_VIEW')")
    @Operation(summary = "Obtener planilla de notas de una evaluación")
    public ResponseEntity<DtoRespuestaApi<List<DtoCalificacion>>> getGrades(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                evaluationService.getGrades(id), "Notas obtenidas"));
    }

    @PutMapping("/evaluations/{id}/grades")
    @PreAuthorize("hasAuthority('NOTA_EDIT')")
    @Operation(summary = "Guardar notas de una evaluación")
    public ResponseEntity<DtoRespuestaApi<Void>> saveGrades(
            @PathVariable Long id, @RequestBody List<DtoCalificacion> grades, HttpServletRequest request) {
        evaluationService.saveGrades(id, grades, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Notas guardadas correctamente"));
    }

    @GetMapping("/sections/{sectionId}/attendance")
    @PreAuthorize("hasAuthority('ASISTENCIA_VIEW')")
    @Operation(summary = "Obtener asistencia por fecha")
    public ResponseEntity<DtoRespuestaApi<List<DtoAsistencia>>> getAttendance(
            @PathVariable Long sectionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                evaluationService.getAttendance(sectionId, date), "Asistencia obtenida"));
    }

    @PutMapping("/sections/{sectionId}/attendance")
    @PreAuthorize("hasAuthority('ASISTENCIA_EDIT')")
    @Operation(summary = "Guardar asistencia por fecha")
    public ResponseEntity<DtoRespuestaApi<Void>> saveAttendance(
            @PathVariable Long sectionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody List<DtoAsistencia> attendance, HttpServletRequest request) {
        evaluationService.saveAttendance(sectionId, date, attendance,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Asistencia guardada correctamente"));
    }

    @GetMapping("/sections/{sectionId}/act")
    @PreAuthorize("hasAuthority('ACTA_VIEW')")
    @Operation(summary = "Obtener acta de una sección")
    public ResponseEntity<DtoRespuestaApi<DtoActa>> getActa(@PathVariable Long sectionId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                evaluationService.getActa(sectionId), "Acta obtenida"));
    }

    @PostMapping("/sections/{sectionId}/act/close")
    @PreAuthorize("hasAuthority('ACTA_CLOSE')")
    @Operation(summary = "Cerrar acta y calcular promedios finales")
    public ResponseEntity<DtoRespuestaApi<DtoActa>> closeActa(@PathVariable Long sectionId, HttpServletRequest request) {
        DtoActa acta = evaluationService.closeActa(sectionId,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(acta, "Acta cerrada correctamente"));
    }
}
