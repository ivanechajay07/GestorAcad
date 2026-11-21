package com.gestoracad.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pruebas de integración del resumen de actividad de auditoría.
 * Verifican la autenticación obligatoria, el permiso del módulo, la estructura
 * de la respuesta y el acotado de la ventana solicitada.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorAuditoriaTest {

    private static final String ENDPOINT = "/api/v1/audit/summary";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Rechaza con 401 el resumen sin token JWT")
    void rechazaSinAutenticacion() throws Exception {
        mockMvc.perform(get(ENDPOINT).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @WithMockUser(username = "consulta.test", authorities = {"UNIVERSIDAD_VIEW"})
    @DisplayName("Rechaza con 403 a un usuario sin permiso de auditoría")
    void rechazaSinPermiso() throws Exception {
        mockMvc.perform(get(ENDPOINT).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "auditor.test", authorities = {"AUDITORIA_VIEW"})
    @DisplayName("Devuelve el resumen con siete días por defecto")
    void devuelveResumenPorDefecto() throws Exception {
        mockMvc.perform(get(ENDPOINT).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dias").value(7))
                .andExpect(jsonPath("$.data.total").isNumber())
                .andExpect(jsonPath("$.data.promedioDiario").isNumber())
                .andExpect(jsonPath("$.data.porDia", hasSize(7)))
                .andExpect(jsonPath("$.data.porAccion").isArray())
                .andExpect(jsonPath("$.data.generadoEn", notNullValue()));
    }

    @Test
    @WithMockUser(username = "auditor.test", authorities = {"AUDITORIA_VIEW"})
    @DisplayName("Acota a 90 días la ventana solicitada y respeta un rango válido")
    void acotaLaVentana() throws Exception {
        mockMvc.perform(get(ENDPOINT).param("dias", "500").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.dias").value(90))
                .andExpect(jsonPath("$.data.porDia", hasSize(90)));

        mockMvc.perform(get(ENDPOINT).param("dias", "14").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.dias").value(14))
                .andExpect(jsonPath("$.data.porDia", hasSize(14)));
    }
}
