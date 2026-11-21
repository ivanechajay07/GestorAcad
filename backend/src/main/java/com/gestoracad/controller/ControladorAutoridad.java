package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoAutoridad;
import com.gestoracad.service.ServicioAutoridad;
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
 * Controlador REST de autoridades. Gestiona el catálogo de autoridades institucionales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/authorities")
@Tag(name = "Autoridades Universitarias", description = "Gestión de autoridades rectorales y de gobierno universitario")
public class ControladorAutoridad {

    private final ServicioAutoridad authorityService;

    public ControladorAutoridad(ServicioAutoridad authorityService) {
        this.authorityService = authorityService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('AUTORIDAD_VIEW')")
    @Operation(summary = "Listar autoridades", description = "Devuelve el padrón completo de autoridades universitarias")
    public ResponseEntity<DtoRespuestaApi<List<DtoAutoridad>>> getAllAuthorities() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(authorityService.getAllAuthorities(), "Autoridades obtenidas exitosamente"));
    }

    @GetMapping("/university/{universityId}")
    @PreAuthorize("hasAuthority('AUTORIDAD_VIEW')")
    @Operation(summary = "Listar autoridades por universidad", description = "Devuelve las autoridades asociadas a una institución")
    public ResponseEntity<DtoRespuestaApi<List<DtoAutoridad>>> getAuthoritiesByUniversity(@PathVariable Long universityId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(authorityService.getAuthoritiesByUniversity(universityId), "Autoridades obtenidas exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('AUTORIDAD_VIEW')")
    @Operation(summary = "Obtener autoridad por ID", description = "Devuelve el detalle de una autoridad universitaria")
    public ResponseEntity<DtoRespuestaApi<DtoAutoridad>> getAuthorityById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(authorityService.getAuthorityById(id), "Autoridad encontrada"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('AUTORIDAD_CREATE')")
    @Operation(summary = "Registrar autoridad", description = "Registra una nueva autoridad universitaria")
    public ResponseEntity<DtoRespuestaApi<DtoAutoridad>> createAuthority(
            @Valid @RequestBody DtoAutoridad dto, HttpServletRequest request) {
        DtoAutoridad created = authorityService.createAuthority(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Autoridad registrada exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('AUTORIDAD_EDIT')")
    @Operation(summary = "Actualizar autoridad", description = "Actualiza los datos de una autoridad universitaria")
    public ResponseEntity<DtoRespuestaApi<DtoAutoridad>> updateAuthority(
            @PathVariable Long id, @Valid @RequestBody DtoAutoridad dto, HttpServletRequest request) {
        DtoAutoridad updated = authorityService.updateAuthority(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Autoridad actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('AUTORIDAD_DELETE')")
    @Operation(summary = "Desactivar autoridad", description = "Realiza un borrado lógico (soft delete) de la autoridad")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteAuthority(@PathVariable Long id, HttpServletRequest request) {
        authorityService.deleteAuthority(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Autoridad desactivada correctamente"));
    }
}
