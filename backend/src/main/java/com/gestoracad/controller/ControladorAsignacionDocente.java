package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoAsignacionDocente;
import com.gestoracad.service.ServicioAsignacionDocente;
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
 * Controlador REST de asignaciones docentes. Gestiona la carga académica de los docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/teacher-assignments")
@Tag(name = "Asignaciones Lectivas", description = "Carga horaria y asignación de cursos por docente")
public class ControladorAsignacionDocente {

    private final ServicioAsignacionDocente assignmentService;

    public ControladorAsignacionDocente(ServicioAsignacionDocente assignmentService) {
        this.assignmentService = assignmentService;
    }

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAuthority('ASIGNACION_VIEW')")
    @Operation(summary = "Listar asignaciones por docente", description = "Devuelve la carga lectiva de un docente")
    public ResponseEntity<DtoRespuestaApi<List<DtoAsignacionDocente>>> getByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(assignmentService.getAssignmentsByTeacher(teacherId),
                "Asignaciones obtenidas exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ASIGNACION_VIEW')")
    @Operation(summary = "Obtener asignación por ID", description = "Devuelve el detalle de una asignación lectiva")
    public ResponseEntity<DtoRespuestaApi<DtoAsignacionDocente>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(assignmentService.getAssignmentById(id), "Asignación encontrada"));
    }

    @PostMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAuthority('ASIGNACION_CREATE')")
    @Operation(summary = "Registrar asignación", description = "Registra una asignación lectiva para un docente")
    public ResponseEntity<DtoRespuestaApi<DtoAsignacionDocente>> create(
            @PathVariable Long teacherId, @Valid @RequestBody DtoAsignacionDocente dto, HttpServletRequest request) {
        DtoAsignacionDocente created = assignmentService.createAssignment(teacherId, dto,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Asignación registrada exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ASIGNACION_EDIT')")
    @Operation(summary = "Actualizar asignación", description = "Actualiza los datos de una asignación lectiva")
    public ResponseEntity<DtoRespuestaApi<DtoAsignacionDocente>> update(
            @PathVariable Long id, @Valid @RequestBody DtoAsignacionDocente dto, HttpServletRequest request) {
        DtoAsignacionDocente updated = assignmentService.updateAssignment(id, dto,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Asignación actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ASIGNACION_DELETE')")
    @Operation(summary = "Eliminar asignación", description = "Realiza un borrado lógico de la asignación lectiva")
    public ResponseEntity<DtoRespuestaApi<Void>> delete(@PathVariable Long id, HttpServletRequest request) {
        assignmentService.deleteAssignment(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Asignación eliminada correctamente"));
    }
}
