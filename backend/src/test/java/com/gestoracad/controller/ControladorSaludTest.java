package com.gestoracad.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorSaludTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Debe responder pong exitosamente en /api/v1/health/ping")
    void testPingEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health/ping")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("pong - Gestor Académico Virtual Activo"));
    }

    @Test
    @DisplayName("Debe responder diagnóstico del sistema en /api/v1/health")
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.applicationName").value("gestoracad-backend"))
                .andExpect(jsonPath("$.data.currentPhase").value("FASE 1: Arquitectura, configuración inicial y análisis"))
                .andExpect(jsonPath("$.data.components.security.status").value("UP"));
    }

    @Test
    @DisplayName("Debe bloquear con 401 un endpoint protegido no autenticado")
    void testUnauthorizedEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/academic/courses")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }
}
