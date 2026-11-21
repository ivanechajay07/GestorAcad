package com.gestoracad.controller;

import com.gestoracad.dto.DtoPortalDocente;
import com.gestoracad.dto.DtoPortalEstudiante;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioPortalAcademico;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador de portales personales de estudiante y docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/portal")
@Tag(name = "Portales académicos", description = "Resumen acotado por identidad para estudiantes y docentes")
public class ControladorPortalAcademico {

    private final ServicioPortalAcademico portalService;

    public ControladorPortalAcademico(ServicioPortalAcademico portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/student/summary")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    @Operation(summary = "Resumen del estudiante autenticado")
    public ResponseEntity<DtoRespuestaApi<DtoPortalEstudiante>> studentSummary() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                portalService.getStudentSummary(), "Resumen del estudiante obtenido"));
    }

    @GetMapping("/student/history")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    @Operation(summary = "Historial académico del estudiante autenticado",
            description = "Devuelve todas las matrículas, incluidas las de periodos anteriores y retiros")
    public ResponseEntity<DtoRespuestaApi<List<DtoPortalEstudiante.Curso>>> studentHistory() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                portalService.getStudentHistory(), "Historial académico obtenido"));
    }

    @GetMapping("/teacher/summary")
    @PreAuthorize("hasRole('DOCENTE')")
    @Operation(summary = "Resumen del docente autenticado")
    public ResponseEntity<DtoRespuestaApi<DtoPortalDocente>> teacherSummary() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                portalService.getTeacherSummary(), "Resumen del docente obtenido"));
    }
}
