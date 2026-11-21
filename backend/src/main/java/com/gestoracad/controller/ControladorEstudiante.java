package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoEstudiante;
import com.gestoracad.service.ServicioEstudiante;
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
 * Controlador REST del módulo de estudiantes. Expone el CRUD y la información de matrícula.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/students")
@Tag(name = "Estudiantes", description = "Padrón estudiantil, expedientes y estado académico")
public class ControladorEstudiante {

    private final ServicioEstudiante studentService;

    public ControladorEstudiante(ServicioEstudiante studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ESTUDIANTE_VIEW')")
    @Operation(summary = "Listar estudiantes", description = "Devuelve el padrón completo de estudiantes")
    public ResponseEntity<DtoRespuestaApi<List<DtoEstudiante>>> getAllStudents() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(studentService.getAllStudents(), "Estudiantes obtenidos exitosamente"));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('ESTUDIANTE_VIEW')")
    @Operation(summary = "Listar estudiantes activos", description = "Devuelve únicamente los estudiantes con estado activo")
    public ResponseEntity<DtoRespuestaApi<List<DtoEstudiante>>> getActiveStudents() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(studentService.getActiveStudents(), "Estudiantes activos obtenidos exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ESTUDIANTE_VIEW')")
    @Operation(summary = "Obtener estudiante por ID", description = "Devuelve el detalle de un expediente estudiantil")
    public ResponseEntity<DtoRespuestaApi<DtoEstudiante>> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(studentService.getStudentById(id), "Estudiante encontrado"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ESTUDIANTE_CREATE')")
    @Operation(summary = "Registrar estudiante", description = "Registra un nuevo estudiante en el padrón institucional")
    public ResponseEntity<DtoRespuestaApi<DtoEstudiante>> createStudent(
            @Valid @RequestBody DtoEstudiante dto, HttpServletRequest request) {
        DtoEstudiante created = studentService.createStudent(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Estudiante registrado exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ESTUDIANTE_EDIT')")
    @Operation(summary = "Actualizar estudiante", description = "Actualiza los datos de un expediente estudiantil")
    public ResponseEntity<DtoRespuestaApi<DtoEstudiante>> updateStudent(
            @PathVariable Long id, @Valid @RequestBody DtoEstudiante dto, HttpServletRequest request) {
        DtoEstudiante updated = studentService.updateStudent(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Estudiante actualizado exitosamente"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ESTUDIANTE_EDIT')")
    @Operation(summary = "Habilitar/Deshabilitar estudiante", description = "Actualiza el estado de activación del estudiante")
    public ResponseEntity<DtoRespuestaApi<Void>> toggleStatus(
            @PathVariable Long id, @RequestParam boolean active, HttpServletRequest request) {
        studentService.toggleStudentStatus(id, active, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Estado del estudiante actualizado correctamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ESTUDIANTE_DELETE')")
    @Operation(summary = "Desactivar estudiante", description = "Realiza un borrado lógico (soft delete) del estudiante")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteStudent(@PathVariable Long id, HttpServletRequest request) {
        studentService.deleteStudent(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Estudiante desactivado correctamente"));
    }
}
