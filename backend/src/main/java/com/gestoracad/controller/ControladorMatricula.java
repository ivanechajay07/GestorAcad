package com.gestoracad.controller;

import com.gestoracad.dto.DtoMatricula;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioMatricula;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de matrículas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/enrollments")
@Tag(name = "Matrículas", description = "Matrícula de estudiantes en secciones con control de cupo y créditos")
public class ControladorMatricula {

    private final ServicioMatricula enrollmentService;

    public ControladorMatricula(ServicioMatricula enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MATRICULA_VIEW')")
    @Operation(summary = "Listar matrículas")
    public ResponseEntity<DtoRespuestaApi<List<DtoMatricula>>> getAllEnrollments() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(enrollmentService.getAllEnrollments(), "Matrículas obtenidas exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MATRICULA_VIEW')")
    @Operation(summary = "Obtener matrícula por ID")
    public ResponseEntity<DtoRespuestaApi<DtoMatricula>> getEnrollmentById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(enrollmentService.getEnrollmentById(id), "Matrícula encontrada"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MATRICULA_CREATE')")
    @Operation(summary = "Registrar matrícula")
    public ResponseEntity<DtoRespuestaApi<DtoMatricula>> createEnrollment(
            @Valid @RequestBody DtoMatricula dto, HttpServletRequest request) {
        DtoMatricula created = enrollmentService.createEnrollment(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Matrícula registrada exitosamente"), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('MATRICULA_EDIT')")
    @Operation(summary = "Actualizar estado de matrícula", description = "Permite MATRICULADO o RETIRADO")
    public ResponseEntity<DtoRespuestaApi<DtoMatricula>> updateStatus(
            @PathVariable Long id, @RequestParam String status, HttpServletRequest request) {
        DtoMatricula updated = enrollmentService.updateStatus(id, status,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Estado de matrícula actualizado"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MATRICULA_DELETE')")
    @Operation(summary = "Anular matrícula")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteEnrollment(@PathVariable Long id, HttpServletRequest request) {
        enrollmentService.deleteEnrollment(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Matrícula anulada correctamente"));
    }
}
