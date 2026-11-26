package com.gestoracad.controller;

import com.gestoracad.dto.DtoPrerrequisito;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioPrerrequisito;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de prerrequisitos por curso.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/courses/{courseId}/prerequisites")
@Tag(name = "Prerrequisitos", description = "Dependencias académicas entre cursos")
public class ControladorPrerrequisitoCurso {

    private final ServicioPrerrequisito prerequisiteService;

    public ControladorPrerrequisitoCurso(ServicioPrerrequisito prerequisiteService) {
        this.prerequisiteService = prerequisiteService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CURSO_VIEW')")
    @Operation(summary = "Listar prerrequisitos de un curso")
    public ResponseEntity<DtoRespuestaApi<List<DtoPrerrequisito>>> getPrerequisites(@PathVariable Long courseId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                prerequisiteService.getPrerequisites(courseId), "Prerrequisitos obtenidos"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CURSO_EDIT')")
    @Operation(summary = "Agregar prerrequisito")
    public ResponseEntity<DtoRespuestaApi<DtoPrerrequisito>> addPrerequisite(
            @PathVariable Long courseId, @Valid @RequestBody DtoPrerrequisito dto, HttpServletRequest request) {
        DtoPrerrequisito created = prerequisiteService.addPrerequisite(courseId, dto.getPrerequisiteId(),
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Prerrequisito agregado"), HttpStatus.CREATED);
    }

    @DeleteMapping("/{prerequisiteId}")
    @PreAuthorize("hasAuthority('CURSO_EDIT')")
    @Operation(summary = "Retirar prerrequisito")
    public ResponseEntity<DtoRespuestaApi<Void>> removePrerequisite(
            @PathVariable Long courseId, @PathVariable Long prerequisiteId, HttpServletRequest request) {
        prerequisiteService.removePrerequisite(courseId, prerequisiteId,
                request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Prerrequisito retirado"));
    }
}
