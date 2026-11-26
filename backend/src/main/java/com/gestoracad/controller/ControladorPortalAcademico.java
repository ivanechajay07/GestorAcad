package com.gestoracad.controller;

import com.gestoracad.dto.DtoPortalDocente;
import com.gestoracad.dto.DtoPortalEstudiante;
import com.gestoracad.dto.DtoReporteExportacion;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioPortalAcademico;
import com.gestoracad.service.ServicioReportesPdf;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
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
    private final ServicioReportesPdf reportPdfService;

    public ControladorPortalAcademico(ServicioPortalAcademico portalService,
                                      ServicioReportesPdf reportPdfService) {
        this.portalService = portalService;
        this.reportPdfService = reportPdfService;
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

    @GetMapping("/student/sections/{sectionId}/constancia.pdf")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    @Operation(summary = "Constancia de notas del estudiante autenticado",
            description = "Genera un PDF con las notas y la asistencia del estudiante en una sección matriculada")
    public ResponseEntity<byte[]> studentConstancia(@PathVariable Long sectionId,
                                                    HttpServletRequest request) {
        DtoReporteExportacion report = reportPdfService.exportarConstanciaEstudiante(
                sectionId, clientIp(request), request.getHeader("User-Agent"));
        return pdfResponse(report);
    }

    @GetMapping("/student/report.pdf")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    @Operation(summary = "Reporte de avance académico del estudiante autenticado",
            description = "Genera un PDF con el resumen, la malla curricular y la matrícula vigente")
    public ResponseEntity<byte[]> studentReport(HttpServletRequest request) {
        DtoReporteExportacion report = reportPdfService.exportarReporteAvance(
                clientIp(request), request.getHeader("User-Agent"));
        return pdfResponse(report);
    }

    private ResponseEntity<byte[]> pdfResponse(DtoReporteExportacion report) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(report.nombreArchivo(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(report.contenido());
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
