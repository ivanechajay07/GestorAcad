package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoDocente;
import com.gestoracad.service.ServicioDocente;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST del módulo de docentes. Expone el CRUD del claustro docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/teachers")
@Tag(name = "Docentes", description = "Padrón del claustro académico y perfil docente")
public class ControladorDocente {

    private final ServicioDocente teacherService;

    public ControladorDocente(ServicioDocente teacherService) {
        this.teacherService = teacherService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('DOCENTE_VIEW')")
    @Operation(summary = "Listar docentes", description = "Devuelve el padrón completo del claustro académico")
    public ResponseEntity<DtoRespuestaApi<List<DtoDocente>>> getAllTeachers() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(teacherService.getAllTeachers(), "Docentes obtenidos exitosamente"));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('DOCENTE_VIEW')")
    @Operation(summary = "Listar docentes activos", description = "Devuelve únicamente los docentes con estado activo")
    public ResponseEntity<DtoRespuestaApi<List<DtoDocente>>> getActiveTeachers() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(teacherService.getActiveTeachers(), "Docentes activos obtenidos exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DOCENTE_VIEW')")
    @Operation(summary = "Obtener docente por ID", description = "Devuelve el detalle de un docente del claustro")
    public ResponseEntity<DtoRespuestaApi<DtoDocente>> getTeacherById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(teacherService.getTeacherById(id), "Docente encontrado"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DOCENTE_CREATE')")
    @Operation(summary = "Registrar docente", description = "Registra un nuevo docente en el padrón institucional")
    public ResponseEntity<DtoRespuestaApi<DtoDocente>> createTeacher(
            @Valid @RequestBody DtoDocente dto, HttpServletRequest request) {
        DtoDocente created = teacherService.createTeacher(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Docente registrado exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DOCENTE_EDIT')")
    @Operation(summary = "Actualizar docente", description = "Actualiza los datos de un docente del claustro")
    public ResponseEntity<DtoRespuestaApi<DtoDocente>> updateTeacher(
            @PathVariable Long id, @Valid @RequestBody DtoDocente dto, HttpServletRequest request) {
        DtoDocente updated = teacherService.updateTeacher(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Docente actualizado exitosamente"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('DOCENTE_EDIT')")
    @Operation(summary = "Habilitar/Deshabilitar docente", description = "Actualiza el estado de activación del docente")
    public ResponseEntity<DtoRespuestaApi<Void>> toggleStatus(
            @PathVariable Long id, @RequestParam boolean active, HttpServletRequest request) {
        teacherService.toggleTeacherStatus(id, active, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Estado del docente actualizado correctamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DOCENTE_DELETE')")
    @Operation(summary = "Desactivar docente", description = "Realiza un borrado lógico (soft delete) del docente")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteTeacher(@PathVariable Long id, HttpServletRequest request) {
        teacherService.deleteTeacher(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Docente desactivado correctamente"));
    }
}
