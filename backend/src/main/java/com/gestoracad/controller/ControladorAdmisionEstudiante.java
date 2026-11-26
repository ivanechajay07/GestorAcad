package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoAdmisionEstudiante;
import com.gestoracad.service.ServicioAdmisionEstudiante;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de admisiones. Gestiona el proceso de admisión de estudiantes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/student-admissions")
@Tag(name = "Admisiones de Estudiantes", description = "Historial de ingreso y admisión de cada estudiante")
public class ControladorAdmisionEstudiante {

    private final ServicioAdmisionEstudiante admissionService;

    public ControladorAdmisionEstudiante(ServicioAdmisionEstudiante admissionService) {
        this.admissionService = admissionService;
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAuthority('ADMISION_VIEW')")
    @Operation(summary = "Listar admisiones por estudiante", description = "Devuelve el historial de ingreso de un estudiante")
    public ResponseEntity<DtoRespuestaApi<List<DtoAdmisionEstudiante>>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(admissionService.getAdmissionsByStudent(studentId),
                "Historial de ingreso obtenido exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMISION_VIEW')")
    @Operation(summary = "Obtener admisión por ID", description = "Devuelve el detalle de un registro de ingreso")
    public ResponseEntity<DtoRespuestaApi<DtoAdmisionEstudiante>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(admissionService.getAdmissionById(id), "Admisión encontrada"));
    }

    @PostMapping("/student/{studentId}")
    @PreAuthorize("hasAuthority('ADMISION_CREATE')")
    @Operation(summary = "Registrar admisión", description = "Registra un ingreso para un estudiante")
    public ResponseEntity<DtoRespuestaApi<DtoAdmisionEstudiante>> create(
            @PathVariable Long studentId, @Valid @RequestBody DtoAdmisionEstudiante dto, HttpServletRequest request) {
        DtoAdmisionEstudiante created = admissionService.createAdmission(studentId, dto,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Admisión registrada exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMISION_EDIT')")
    @Operation(summary = "Actualizar admisión", description = "Actualiza los datos de un registro de ingreso")
    public ResponseEntity<DtoRespuestaApi<DtoAdmisionEstudiante>> update(
            @PathVariable Long id, @Valid @RequestBody DtoAdmisionEstudiante dto, HttpServletRequest request) {
        DtoAdmisionEstudiante updated = admissionService.updateAdmission(id, dto,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Admisión actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMISION_DELETE')")
    @Operation(summary = "Eliminar admisión", description = "Realiza un borrado lógico del registro de ingreso")
    public ResponseEntity<DtoRespuestaApi<Void>> delete(@PathVariable Long id, HttpServletRequest request) {
        admissionService.deleteAdmission(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Admisión eliminada correctamente"));
    }
}
