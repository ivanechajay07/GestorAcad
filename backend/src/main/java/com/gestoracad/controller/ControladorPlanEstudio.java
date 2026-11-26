package com.gestoracad.controller;

import com.gestoracad.dto.DtoPlanCurso;
import com.gestoracad.dto.DtoPlanEstudio;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioPlanEstudio;
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
 * Controlador REST de planes de estudio y malla curricular.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/study-plans")
@Tag(name = "Planes de estudio", description = "Planes de estudio por carrera y malla curricular")
public class ControladorPlanEstudio {

    private final ServicioPlanEstudio planService;

    public ControladorPlanEstudio(ServicioPlanEstudio planService) {
        this.planService = planService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PLAN_VIEW')")
    @Operation(summary = "Listar planes de estudio")
    public ResponseEntity<DtoRespuestaApi<List<DtoPlanEstudio>>> getAllPlans() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(planService.getAllPlans(), "Planes obtenidos exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PLAN_VIEW')")
    @Operation(summary = "Obtener plan por ID")
    public ResponseEntity<DtoRespuestaApi<DtoPlanEstudio>> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(planService.getPlanById(id), "Plan encontrado"));
    }

    @GetMapping("/{id}/courses")
    @PreAuthorize("hasAuthority('PLAN_VIEW')")
    @Operation(summary = "Listar cursos de la malla curricular")
    public ResponseEntity<DtoRespuestaApi<List<DtoPlanCurso>>> getPlanCourses(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(planService.getPlanCourses(id), "Malla curricular obtenida"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PLAN_CREATE')")
    @Operation(summary = "Registrar plan de estudios")
    public ResponseEntity<DtoRespuestaApi<DtoPlanEstudio>> createPlan(
            @Valid @RequestBody DtoPlanEstudio dto, HttpServletRequest request) {
        DtoPlanEstudio created = planService.createPlan(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Plan registrado exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PLAN_EDIT')")
    @Operation(summary = "Actualizar plan de estudios")
    public ResponseEntity<DtoRespuestaApi<DtoPlanEstudio>> updatePlan(
            @PathVariable Long id, @Valid @RequestBody DtoPlanEstudio dto, HttpServletRequest request) {
        DtoPlanEstudio updated = planService.updatePlan(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Plan actualizado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PLAN_DELETE')")
    @Operation(summary = "Desactivar plan de estudios")
    public ResponseEntity<DtoRespuestaApi<Void>> deletePlan(@PathVariable Long id, HttpServletRequest request) {
        planService.deletePlan(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Plan desactivado correctamente"));
    }

    @PostMapping("/{id}/courses")
    @PreAuthorize("hasAuthority('PLAN_EDIT')")
    @Operation(summary = "Agregar curso a la malla curricular")
    public ResponseEntity<DtoRespuestaApi<DtoPlanCurso>> addCourse(
            @PathVariable Long id, @Valid @RequestBody DtoPlanCurso dto, HttpServletRequest request) {
        DtoPlanCurso created = planService.addCourse(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Curso agregado a la malla"), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}/courses/{planCourseId}")
    @PreAuthorize("hasAuthority('PLAN_EDIT')")
    @Operation(summary = "Retirar curso de la malla curricular")
    public ResponseEntity<DtoRespuestaApi<Void>> removeCourse(
            @PathVariable Long id, @PathVariable Long planCourseId, HttpServletRequest request) {
        planService.removeCourse(id, planCourseId, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Curso retirado de la malla"));
    }
}
