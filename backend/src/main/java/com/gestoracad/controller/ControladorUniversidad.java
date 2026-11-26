package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoUniversidad;
import com.gestoracad.service.ServicioUniversidad;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
 * Controlador REST del módulo de universidad. Expone los datos institucionales y la universidad activa.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/university")
@Tag(name = "Módulo Universidad", description = "Gestión de la institución matriz, configuración global y datos de la rectoría")
public class ControladorUniversidad {

    private final ServicioUniversidad universityService;

    public ControladorUniversidad(ServicioUniversidad universityService) {
        this.universityService = universityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('UNIVERSIDAD_VIEW')")
    @Operation(summary = "Listar instituciones", description = "Devuelve el catálogo de instituciones universitarias registradas")
    public ResponseEntity<DtoRespuestaApi<List<DtoUniversidad>>> getAllUniversities() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(universityService.getAllUniversities(), "Instituciones obtenidas exitosamente"));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('UNIVERSIDAD_VIEW')")
    @Operation(summary = "Obtener institución activa", description = "Devuelve la configuración de la institución matriz activa")
    public ResponseEntity<DtoRespuestaApi<DtoUniversidad>> getActiveUniversity() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(universityService.getActiveUniversity(), "Institución activa obtenida exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('UNIVERSIDAD_VIEW')")
    @Operation(summary = "Obtener institución por ID", description = "Devuelve el detalle de una institución universitaria")
    public ResponseEntity<DtoRespuestaApi<DtoUniversidad>> getUniversityById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(universityService.getUniversityById(id), "Institución encontrada"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('UNIVERSIDAD_EDIT')")
    @Operation(summary = "Registrar institución", description = "Registra una nueva institución universitaria matriz")
    public ResponseEntity<DtoRespuestaApi<DtoUniversidad>> createUniversity(
            @Valid @RequestBody DtoUniversidad dto, HttpServletRequest request) {
        DtoUniversidad created = universityService.createUniversity(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Institución registrada exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UNIVERSIDAD_EDIT')")
    @Operation(summary = "Actualizar institución", description = "Actualiza la información institucional de una universidad")
    public ResponseEntity<DtoRespuestaApi<DtoUniversidad>> updateUniversity(
            @PathVariable Long id, @Valid @RequestBody DtoUniversidad dto, HttpServletRequest request) {
        DtoUniversidad updated = universityService.updateUniversity(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Institución actualizada exitosamente"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('UNIVERSIDAD_EDIT')")
    @Operation(summary = "Habilitar/Deshabilitar institución", description = "Actualiza el estado de activación de la institución")
    public ResponseEntity<DtoRespuestaApi<Void>> toggleStatus(
            @PathVariable Long id, @RequestParam boolean active, HttpServletRequest request) {
        universityService.toggleUniversityStatus(id, active, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Estado de la institución actualizado correctamente"));
    }
}
