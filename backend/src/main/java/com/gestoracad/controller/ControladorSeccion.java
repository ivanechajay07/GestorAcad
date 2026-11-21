package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoSeccion;
import com.gestoracad.service.ServicioSeccion;
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
 * Controlador REST de secciones académicas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/sections")
@Tag(name = "Secciones", description = "Oferta académica por periodo, curso y docente")
public class ControladorSeccion {

    private final ServicioSeccion sectionService;

    public ControladorSeccion(ServicioSeccion sectionService) {
        this.sectionService = sectionService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SECCION_VIEW')")
    @Operation(summary = "Listar secciones")
    public ResponseEntity<DtoRespuestaApi<List<DtoSeccion>>> getAllSections() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(sectionService.getAllSections(), "Secciones obtenidas exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SECCION_VIEW')")
    @Operation(summary = "Obtener sección por ID")
    public ResponseEntity<DtoRespuestaApi<DtoSeccion>> getSectionById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(sectionService.getSectionById(id), "Sección encontrada"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SECCION_CREATE')")
    @Operation(summary = "Registrar sección")
    public ResponseEntity<DtoRespuestaApi<DtoSeccion>> createSection(
            @Valid @RequestBody DtoSeccion dto, HttpServletRequest request) {
        DtoSeccion created = sectionService.createSection(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Sección registrada exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SECCION_EDIT')")
    @Operation(summary = "Actualizar sección")
    public ResponseEntity<DtoRespuestaApi<DtoSeccion>> updateSection(
            @PathVariable Long id, @Valid @RequestBody DtoSeccion dto, HttpServletRequest request) {
        DtoSeccion updated = sectionService.updateSection(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Sección actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SECCION_DELETE')")
    @Operation(summary = "Desactivar sección")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteSection(@PathVariable Long id, HttpServletRequest request) {
        sectionService.deleteSection(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Sección desactivada correctamente"));
    }
}
