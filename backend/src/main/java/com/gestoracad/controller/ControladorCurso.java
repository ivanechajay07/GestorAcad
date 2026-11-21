package com.gestoracad.controller;

import com.gestoracad.dto.DtoCurso;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioCurso;
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
 * Controlador REST del catálogo de cursos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/courses")
@Tag(name = "Cursos", description = "Catálogo de asignaturas y carga horaria")
public class ControladorCurso {

    private final ServicioCurso courseService;

    public ControladorCurso(ServicioCurso courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CURSO_VIEW')")
    @Operation(summary = "Listar cursos")
    public ResponseEntity<DtoRespuestaApi<List<DtoCurso>>> getAllCourses() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(courseService.getAllCourses(), "Cursos obtenidos exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CURSO_VIEW')")
    @Operation(summary = "Obtener curso por ID")
    public ResponseEntity<DtoRespuestaApi<DtoCurso>> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(courseService.getCourseById(id), "Curso encontrado"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CURSO_CREATE')")
    @Operation(summary = "Registrar curso")
    public ResponseEntity<DtoRespuestaApi<DtoCurso>> createCourse(
            @Valid @RequestBody DtoCurso dto, HttpServletRequest request) {
        DtoCurso created = courseService.createCourse(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Curso registrado exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CURSO_EDIT')")
    @Operation(summary = "Actualizar curso")
    public ResponseEntity<DtoRespuestaApi<DtoCurso>> updateCourse(
            @PathVariable Long id, @Valid @RequestBody DtoCurso dto, HttpServletRequest request) {
        DtoCurso updated = courseService.updateCourse(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Curso actualizado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CURSO_DELETE')")
    @Operation(summary = "Desactivar curso")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteCourse(@PathVariable Long id, HttpServletRequest request) {
        courseService.deleteCourse(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Curso desactivado correctamente"));
    }
}
