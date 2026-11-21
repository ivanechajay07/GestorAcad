package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoEspecialidadDocente;
import com.gestoracad.service.ServicioEspecialidadDocente;
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
 * Controlador REST de especialidades docentes. Gestiona el catálogo de especialidades.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/teacher-specialties")
@Tag(name = "Especialidades Docentes", description = "Especialidades académicas y formación de cada docente")
public class ControladorEspecialidadDocente {

    private final ServicioEspecialidadDocente specialtyService;

    public ControladorEspecialidadDocente(ServicioEspecialidadDocente specialtyService) {
        this.specialtyService = specialtyService;
    }

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAuthority('ESPECIALIDAD_VIEW')")
    @Operation(summary = "Listar especialidades por docente", description = "Devuelve las especialidades registradas de un docente")
    public ResponseEntity<DtoRespuestaApi<List<DtoEspecialidadDocente>>> getByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(specialtyService.getSpecialtiesByTeacher(teacherId),
                "Especialidades obtenidas exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ESPECIALIDAD_VIEW')")
    @Operation(summary = "Obtener especialidad por ID", description = "Devuelve el detalle de una especialidad")
    public ResponseEntity<DtoRespuestaApi<DtoEspecialidadDocente>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(specialtyService.getSpecialtyById(id), "Especialidad encontrada"));
    }

    @PostMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAuthority('ESPECIALIDAD_CREATE')")
    @Operation(summary = "Registrar especialidad", description = "Registra una especialidad académica para un docente")
    public ResponseEntity<DtoRespuestaApi<DtoEspecialidadDocente>> create(
            @PathVariable Long teacherId, @Valid @RequestBody DtoEspecialidadDocente dto, HttpServletRequest request) {
        DtoEspecialidadDocente created = specialtyService.createSpecialty(teacherId, dto,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Especialidad registrada exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ESPECIALIDAD_EDIT')")
    @Operation(summary = "Actualizar especialidad", description = "Actualiza los datos de una especialidad")
    public ResponseEntity<DtoRespuestaApi<DtoEspecialidadDocente>> update(
            @PathVariable Long id, @Valid @RequestBody DtoEspecialidadDocente dto, HttpServletRequest request) {
        DtoEspecialidadDocente updated = specialtyService.updateSpecialty(id, dto,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Especialidad actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ESPECIALIDAD_DELETE')")
    @Operation(summary = "Eliminar especialidad", description = "Realiza un borrado lógico de la especialidad")
    public ResponseEntity<DtoRespuestaApi<Void>> delete(@PathVariable Long id, HttpServletRequest request) {
        specialtyService.deleteSpecialty(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Especialidad eliminada correctamente"));
    }
}
