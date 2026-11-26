package com.gestoracad.controller;

import com.gestoracad.dto.DtoPeriodoAcademico;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.service.ServicioPeriodoAcademico;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de periodos académicos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/academic-periods")
@Tag(name = "Periodos académicos", description = "Calendario lectivo, matrícula y periodo vigente")
public class ControladorPeriodoAcademico {

    private final ServicioPeriodoAcademico periodService;

    public ControladorPeriodoAcademico(ServicioPeriodoAcademico periodService) {
        this.periodService = periodService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERIODO_VIEW')")
    @Operation(summary = "Listar periodos académicos")
    public ResponseEntity<DtoRespuestaApi<List<DtoPeriodoAcademico>>> getAllPeriods() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(periodService.getAllPeriods(), "Periodos obtenidos exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERIODO_VIEW')")
    @Operation(summary = "Obtener periodo por ID")
    public ResponseEntity<DtoRespuestaApi<DtoPeriodoAcademico>> getPeriodById(@PathVariable Long id) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(periodService.getPeriodById(id), "Periodo encontrado"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERIODO_CREATE')")
    @Operation(summary = "Registrar periodo académico")
    public ResponseEntity<DtoRespuestaApi<DtoPeriodoAcademico>> createPeriod(
            @Valid @RequestBody DtoPeriodoAcademico dto, HttpServletRequest request) {
        DtoPeriodoAcademico created = periodService.createPeriod(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Periodo registrado exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERIODO_EDIT')")
    @Operation(summary = "Actualizar periodo académico")
    public ResponseEntity<DtoRespuestaApi<DtoPeriodoAcademico>> updatePeriod(
            @PathVariable Long id, @Valid @RequestBody DtoPeriodoAcademico dto, HttpServletRequest request) {
        DtoPeriodoAcademico updated = periodService.updatePeriod(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Periodo actualizado exitosamente"));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('PERIODO_EDIT')")
    @Operation(summary = "Marcar periodo como vigente",
            description = "Desmarca el periodo anterior y sincroniza el parámetro PERIODO_ACADEMICO_ACTUAL")
    public ResponseEntity<DtoRespuestaApi<DtoPeriodoAcademico>> activatePeriod(
            @PathVariable Long id, HttpServletRequest request) {
        DtoPeriodoAcademico updated = periodService.activatePeriod(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Periodo vigente actualizado correctamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERIODO_DELETE')")
    @Operation(summary = "Desactivar periodo académico")
    public ResponseEntity<DtoRespuestaApi<Void>> deletePeriod(@PathVariable Long id, HttpServletRequest request) {
        periodService.deletePeriod(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Periodo desactivado correctamente"));
    }
}
