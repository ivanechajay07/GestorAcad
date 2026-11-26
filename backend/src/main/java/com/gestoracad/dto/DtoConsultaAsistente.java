package com.gestoracad.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * Consulta enviada al asistente académico.
 * Incluye la pregunta actual y, opcionalmente, el historial reciente de la
 * conversación para permitir seguimientos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoConsultaAsistente {

    @NotBlank(message = "La consulta no puede estar vacía")
    @Size(max = 500, message = "La consulta no puede exceder 500 caracteres")
    private String question;

    @Valid
    @Size(max = 20, message = "El historial no puede exceder 20 mensajes")
    private List<DtoMensajeAsistente> history = new ArrayList<>();

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public List<DtoMensajeAsistente> getHistory() { return history; }
    public void setHistory(List<DtoMensajeAsistente> history) {
        this.history = history == null ? new ArrayList<>() : history;
    }
}
