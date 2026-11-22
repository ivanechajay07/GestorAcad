package com.gestoracad.controller;

import com.gestoracad.dto.DtoReporteExportacion;
import com.gestoracad.service.ServicioReportes;
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

/**
 * Exportaciones auditadas de los listados institucionales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Reportes", description = "Exportaciones auditadas de estudiantes, docentes y usuarios")
public class ControladorReportes {

    private static final MediaType CSV = new MediaType("text", "csv", StandardCharsets.UTF_8);
    private static final MediaType PDF = new MediaType("application", "pdf");

    private final ServicioReportes reportService;
    private final ServicioReportesPdf reportPdfService;

    public ControladorReportes(ServicioReportes reportService, ServicioReportesPdf reportPdfService) {
        this.reportService = reportService;
        this.reportPdfService = reportPdfService;
    }

    @GetMapping("/students")
    @PreAuthorize("hasAuthority('ESTUDIANTE_EXPORT')")
    @Operation(summary = "Exportar estudiantes", description = "Genera un CSV UTF-8 del padrón estudiantil y registra la exportación")
    public ResponseEntity<byte[]> exportStudents(HttpServletRequest request) {
        return download(reportService.exportarEstudiantes(clientIp(request), request.getHeader("User-Agent")));
    }

    @GetMapping("/teachers")
    @PreAuthorize("hasAuthority('DOCENTE_EXPORT')")
    @Operation(summary = "Exportar docentes", description = "Genera un CSV UTF-8 del padrón docente y registra la exportación")
    public ResponseEntity<byte[]> exportTeachers(HttpServletRequest request) {
        return download(reportService.exportarDocentes(clientIp(request), request.getHeader("User-Agent")));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('USUARIO_EXPORT')")
    @Operation(summary = "Exportar usuarios", description = "Genera un CSV UTF-8 del directorio de usuarios y registra la exportación")
    public ResponseEntity<byte[]> exportUsers(HttpServletRequest request) {
        return download(reportService.exportarUsuarios(clientIp(request), request.getHeader("User-Agent")), CSV);
    }

    @GetMapping("/sections/{sectionId}/acta.pdf")
    @PreAuthorize("hasAuthority('ACTA_VIEW')")
    @Operation(summary = "Exportar acta en PDF", description = "Genera el acta de evaluación de una sección con cabecera institucional y firmas")
    public ResponseEntity<byte[]> exportActa(@PathVariable Long sectionId, HttpServletRequest request) {
        return download(
                reportPdfService.exportarActa(sectionId, clientIp(request), request.getHeader("User-Agent")),
                PDF);
    }

    private ResponseEntity<byte[]> download(DtoReporteExportacion report) {
        return download(report, CSV);
    }

    private ResponseEntity<byte[]> download(DtoReporteExportacion report, MediaType contentType) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(report.nombreArchivo(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(contentType)
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
