package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoParametroSistema;
import com.gestoracad.service.ServicioParametroSistema;
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
 * Controlador REST de parámetros del sistema. Gestiona la configuración institucional.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/parameters")
@Tag(name = "Parametrización Global", description = "Configuración global y parámetros del sistema")
public class ControladorParametroSistema {

    private final ServicioParametroSistema parameterService;

    public ControladorParametroSistema(ServicioParametroSistema parameterService) {
        this.parameterService = parameterService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PARAMETRO_VIEW')")
    @Operation(summary = "Listar parámetros", description = "Devuelve todos los parámetros de configuración global")
    public ResponseEntity<DtoRespuestaApi<List<DtoParametroSistema>>> getAllParameters() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(parameterService.getAllParameters(), "Parámetros obtenidos exitosamente"));
    }

    @GetMapping("/{key}")
    @PreAuthorize("hasAuthority('PARAMETRO_VIEW')")
    @Operation(summary = "Obtener parámetro por clave", description = "Devuelve el valor de un parámetro identificado por su clave")
    public ResponseEntity<DtoRespuestaApi<DtoParametroSistema>> getParameterByKey(@PathVariable String key) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(parameterService.getParameterByKey(key), "Parámetro encontrado"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PARAMETRO_EDIT')")
    @Operation(summary = "Registrar parámetro", description = "Registra un nuevo parámetro de configuración global")
    public ResponseEntity<DtoRespuestaApi<DtoParametroSistema>> createParameter(
            @Valid @RequestBody DtoParametroSistema dto, HttpServletRequest request) {
        DtoParametroSistema created = parameterService.createParameter(dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Parámetro registrado exitosamente"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PARAMETRO_EDIT')")
    @Operation(summary = "Actualizar parámetro", description = "Actualiza el valor de un parámetro de configuración global")
    public ResponseEntity<DtoRespuestaApi<DtoParametroSistema>> updateParameter(
            @PathVariable Long id, @Valid @RequestBody DtoParametroSistema dto, HttpServletRequest request) {
        DtoParametroSistema updated = parameterService.updateParameter(id, dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Parámetro actualizado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PARAMETRO_EDIT')")
    @Operation(summary = "Desactivar parámetro", description = "Realiza un borrado lógico (soft delete) del parámetro")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteParameter(@PathVariable Long id, HttpServletRequest request) {
        parameterService.deleteParameter(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Parámetro desactivado correctamente"));
    }
}
