package com.gestoracad.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pruebas de integración del endpoint de avisos del encabezado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorNotificacionesTest {

    private static final String ENDPOINT = "/api/v1/notifications";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Rechaza con 401 la consulta de avisos sin token JWT")
    void rechazaSinAutenticacion() throws Exception {
        mockMvc.perform(get(ENDPOINT))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @WithMockUser(username = "admin.test", authorities = {
            "ESTUDIANTE_VIEW", "DOCENTE_VIEW", "USUARIO_VIEW", "AUDITORIA_VIEW", "UNIVERSIDAD_VIEW"})
    @DisplayName("Devuelve un arreglo de avisos para un usuario autenticado")
    void devuelveAvisosAutenticado() throws Exception {
        mockMvc.perform(get(ENDPOINT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
