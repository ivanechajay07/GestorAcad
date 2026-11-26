package com.gestoracad.controller;

import com.gestoracad.dto.DtoCarrera;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioCarrera;
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
 * Controlador REST del catálogo de carreras profesionales.
 * Cada carrera está vinculada a una facultad y agrupa a los estudiantes del
 * padrón; el controlador expone ese CRUD para el módulo Universidad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/careers")
@Tag(name = "Carreras", description = "Gestión del catálogo de carreras profesionales por facultad")
public class ControladorCarrera {

    private final ServicioCarrera careerService;

    public ControladorCarrera(ServicioCarrera careerService) {
        this.careerService = careerService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CARRERA_VIEW')")
    @Operation(summary = "Listar carreras", description = "Devuelve el catálogo completo de carreras con su facultad y número de estudiantes")
    public ResponseEntity<DtoRespuestaApi<List<DtoCarrera>>> getAllCareers() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(careerService.getAllCareers(), "Carreras obtenidas exitosamente"));
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAuthority('CARRERA_VIEW')")
    @Operation(summary = "Listar carreras por facultad", description = "Devuelve las carreras adscritas a una facultad")
    public ResponseEntity<DtoRespuestaApi<List<DtoCarrera>>> getCareersByFaculty(@PathVariable Long facultyId) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(careerService.getCareersByFaculty(facultyId), "Carreras obtenidas exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CARRERA_VIEW')")
    @Operation(summary = "Obtener carrera por ID", description = "Devuelve el detalle de una carrera del catálogo")
    public ResponseEntity<DtoRespuestaApi<DtoCarrera>> getCareerById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(careerService.getCareerById(id), "Carrera encontrada"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CARRERA_CREATE')")
    @Operation(summary = "Registrar carrera", description = "Registra una nueva carrera asociada a una facultad existente")
    public ResponseEntity<DtoRespuestaApi<DtoCarrera>> createCareer(
            @Valid @RequestBody DtoCarrera dto, HttpServletRequest request) {
        DtoCarrera created = careerService.createCareer(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Carrera registrada exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CARRERA_EDIT')")
    @Operation(summary = "Actualizar carrera", description = "Actualiza la carrera y, si cambia de facultad, reasigna a sus estudiantes")
    public ResponseEntity<DtoRespuestaApi<DtoCarrera>> updateCareer(
            @PathVariable Long id, @Valid @RequestBody DtoCarrera dto, HttpServletRequest request) {
        DtoCarrera updated = careerService.updateCareer(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Carrera actualizada exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CARRERA_DELETE')")
    @Operation(summary = "Desactivar carrera", description = "Realiza un borrado lógico si la carrera no tiene estudiantes activos")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteCareer(@PathVariable Long id, HttpServletRequest request) {
        careerService.deleteCareer(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Carrera desactivada correctamente"));
    }
}
