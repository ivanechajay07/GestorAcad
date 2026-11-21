package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoSede;
import com.gestoracad.service.ServicioSede;
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
 * Controlador REST de sedes. Gestiona el catálogo de sedes (campus) de la universidad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/campuses")
@Tag(name = "Sedes y Sede", description = "Gestión de sedes, campus y filiales de la universidad")
public class ControladorSede {

    private final ServicioSede campusService;

    public ControladorSede(ServicioSede campusService) {
        this.campusService = campusService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SEDE_VIEW')")
    @Operation(summary = "Listar sedes", description = "Devuelve el catálogo completo de sedes y campus")
    public ResponseEntity<DtoRespuestaApi<List<DtoSede>>> getAllCampuses() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(campusService.getAllCampuses(), "Sedes obtenidas exitosamente"));
    }

    @GetMapping("/university/{universityId}")
    @PreAuthorize("hasAuthority('SEDE_VIEW')")
    @Operation(summary = "Listar sedes por universidad", description = "Devuelve las sedes asociadas a una institución")
    public ResponseEntity<DtoRespuestaApi<List<DtoSede>>> getCampusesByUniversity(@PathVariable Long universityId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(campusService.getCampusesByUniversity(universityId), "Sedes obtenidas exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SEDE_VIEW')")
    @Operation(summary = "Obtener sede por ID", description = "Devuelve el detalle de una sede o campus")
    public ResponseEntity<DtoRespuestaApi<DtoSede>> getCampusById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(campusService.getCampusById(id), "Sede encontrada"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SEDE_CREATE')")
    @Operation(summary = "Registrar sede", description = "Registra una nueva sede o campus")
    public ResponseEntity<DtoRespuestaApi<DtoSede>> createCampus(
            @Valid @RequestBody DtoSede dto, HttpServletRequest request) {
        DtoSede created = campusService.createCampus(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Sede registrada exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SEDE_EDIT')")
    @Operation(summary = "Actualizar sede", description = "Actualiza los datos de una sede o campus")
    public ResponseEntity<DtoRespuestaApi<DtoSede>> updateCampus(
            @PathVariable Long id, @Valid @RequestBody DtoSede dto, HttpServletRequest request) {
        DtoSede updated = campusService.updateCampus(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Sede actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SEDE_DELETE')")
    @Operation(summary = "Desactivar sede", description = "Realiza un borrado lógico (soft delete) de la sede")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteCampus(@PathVariable Long id, HttpServletRequest request) {
        campusService.deleteCampus(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Sede desactivada correctamente"));
    }
}
