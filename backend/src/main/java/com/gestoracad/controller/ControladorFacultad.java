package com.gestoracad.controller;

import com.gestoracad.dto.DtoFacultad;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioFacultad;
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
 * Controlador REST del catálogo de facultades.
 * Expone el CRUD que alimenta las pestañas del módulo Universidad y la relación
 * con carreras, estudiantes y docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/faculties")
@Tag(name = "Facultades", description = "Gestión del catálogo de facultades de la universidad")
public class ControladorFacultad {

    private final ServicioFacultad facultyService;

    public ControladorFacultad(ServicioFacultad facultyService) {
        this.facultyService = facultyService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('FACULTAD_VIEW')")
    @Operation(summary = "Listar facultades", description = "Devuelve el catálogo de facultades con sus contadores de carreras, estudiantes y docentes")
    public ResponseEntity<DtoRespuestaApi<List<DtoFacultad>>> getAllFaculties() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(facultyService.getAllFaculties(), "Facultades obtenidas exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('FACULTAD_VIEW')")
    @Operation(summary = "Obtener facultad por ID", description = "Devuelve el detalle de una facultad del catálogo")
    public ResponseEntity<DtoRespuestaApi<DtoFacultad>> getFacultyById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(facultyService.getFacultyById(id), "Facultad encontrada"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('FACULTAD_CREATE')")
    @Operation(summary = "Registrar facultad", description = "Registra una nueva facultad en el catálogo académico")
    public ResponseEntity<DtoRespuestaApi<DtoFacultad>> createFaculty(
            @Valid @RequestBody DtoFacultad dto, HttpServletRequest request) {
        DtoFacultad created = facultyService.createFaculty(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Facultad registrada exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FACULTAD_EDIT')")
    @Operation(summary = "Actualizar facultad", description = "Actualiza el nombre y la descripción de una facultad")
    public ResponseEntity<DtoRespuestaApi<DtoFacultad>> updateFaculty(
            @PathVariable Long id, @Valid @RequestBody DtoFacultad dto, HttpServletRequest request) {
        DtoFacultad updated = facultyService.updateFaculty(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Facultad actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('FACULTAD_DELETE')")
    @Operation(summary = "Desactivar facultad", description = "Realiza un borrado lógico si no tiene carreras, estudiantes ni docentes activos")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteFaculty(@PathVariable Long id, HttpServletRequest request) {
        facultyService.deleteFaculty(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Facultad desactivada correctamente"));
    }
}
