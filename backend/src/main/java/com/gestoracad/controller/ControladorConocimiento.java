package com.gestoracad.controller;

import com.gestoracad.dto.DtoConsultaAsistente;
import com.gestoracad.dto.DtoEstadoAsistente;
import com.gestoracad.dto.DtoFuenteConocimiento;
import com.gestoracad.dto.DtoGuardarConocimiento;
import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoRespuestaAsistente;
import com.gestoracad.service.ServicioAsistenteGpt;
import com.gestoracad.service.ServicioConocimiento;
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
 * Base de conocimiento y asistente académico local.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/knowledge")
@Tag(name = "Asistente académico", description = "Fuentes documentales y búsqueda local")
public class ControladorConocimiento {

    private final ServicioConocimiento knowledgeService;
    private final ServicioAsistenteGpt assistantService;

    public ControladorConocimiento(ServicioConocimiento knowledgeService,
                                   ServicioAsistenteGpt assistantService) {
        this.knowledgeService = knowledgeService;
        this.assistantService = assistantService;
    }

    @GetMapping("/sources")
    @PreAuthorize("hasAuthority('CONOCIMIENTO_VIEW')")
    @Operation(summary = "Listar fuentes de conocimiento activas")
    public ResponseEntity<DtoRespuestaApi<List<DtoFuenteConocimiento>>> listSources() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                knowledgeService.listSources(), "Fuentes de conocimiento obtenidas"));
    }

    @PostMapping("/sources")
    @PreAuthorize("hasAuthority('CONOCIMIENTO_CREATE')")
    @Operation(summary = "Registrar una fuente de conocimiento")
    public ResponseEntity<DtoRespuestaApi<DtoFuenteConocimiento>> createSource(
            @Valid @RequestBody DtoGuardarConocimiento dto, HttpServletRequest request) {
        DtoFuenteConocimiento created = knowledgeService.createSource(
                dto, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return new ResponseEntity<>(DtoRespuestaApi.ok(created, "Fuente registrada"), HttpStatus.CREATED);
    }

    @DeleteMapping("/sources/{id}")
    @PreAuthorize("hasAuthority('CONOCIMIENTO_DELETE')")
    @Operation(summary = "Desactivar una fuente de conocimiento")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteSource(
            @PathVariable Long id, HttpServletRequest request) {
        knowledgeService.deleteSource(id, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Fuente desactivada"));
    }

    @GetMapping("/status")
    @PreAuthorize("hasAuthority('CONOCIMIENTO_VIEW')")
    @Operation(summary = "Estado del asistente", description = "Indica si el modo activo es local o RAG con GPT")
    public ResponseEntity<DtoRespuestaApi<DtoEstadoAsistente>> status() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                assistantService.status(), "Estado del asistente obtenido"));
    }

    @PostMapping("/ask")
    @PreAuthorize("hasAuthority('CONOCIMIENTO_VIEW')")
    @Operation(summary = "Consultar la búsqueda local",
            description = "Búsqueda léxica sobre las fuentes; no utiliza un proveedor de IA externo")
    public ResponseEntity<DtoRespuestaApi<DtoRespuestaAsistente>> ask(
            @Valid @RequestBody DtoConsultaAsistente dto) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                knowledgeService.ask(dto.getQuestion()), "Consulta procesada"));
    }

    @PostMapping("/chat")
    @PreAuthorize("hasAuthority('CONOCIMIENTO_VIEW')")
    @Operation(summary = "Conversar con el asistente",
            description = "Usa GPT con contexto local e historial si está configurado; si no, responde con búsqueda local")
    public ResponseEntity<DtoRespuestaApi<DtoRespuestaAsistente>> chat(
            @Valid @RequestBody DtoConsultaAsistente dto) {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                assistantService.chat(dto.getQuestion(), dto.getHistory()), "Consulta procesada"));
    }
}
