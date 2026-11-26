package com.gestoracad.service;

import com.gestoracad.dto.DtoEstadoAsistente;
import com.gestoracad.dto.DtoMensajeAsistente;
import com.gestoracad.dto.DtoRespuestaAsistente;

import java.util.List;

/**
 * Contrato del asistente conversacional con fallback local.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioAsistenteGpt {

    DtoRespuestaAsistente chat(String question, List<DtoMensajeAsistente> history);

    DtoEstadoAsistente status();
}
