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
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pruebas de integración del endpoint del panel institucional.
 * Verifican autenticación obligatoria y que la respuesta respete los permisos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorDashboardTest {

    private static final String ENDPOINT = "/api/v1/dashboard/summary";

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
    @WithMockUser(username = "admin.test", authorities = {
            "ESTUDIANTE_VIEW", "DOCENTE_VIEW", "USUARIO_VIEW", "AUDITORIA_VIEW", "SEDE_VIEW"})
    @DisplayName("Devuelve el resumen completo cuando el usuario tiene todos los permisos")
    void devuelveResumenConPermisos() throws Exception {
        mockMvc.perform(get(ENDPOINT).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.institucion", notNullValue()))
                .andExpect(jsonPath("$.data.estudiantes.total").isNumber())
                .andExpect(jsonPath("$.data.docentes.total").isNumber())
                .andExpect(jsonPath("$.data.usuarios.total").isNumber())
                .andExpect(jsonPath("$.data.auditoria.eventosPorDia", hasSize(7)))
                .andExpect(jsonPath("$.data.estudiantesPorCiclo").isArray())
                .andExpect(jsonPath("$.data.generadoEn", notNullValue()));
    }

    @Test
    @WithMockUser(username = "consulta.test", authorities = {"UNIVERSIDAD_VIEW"})
    @DisplayName("Omite los bloques para los que el usuario no tiene permiso")
    void omiteBloquesSinPermiso() throws Exception {
        mockMvc.perform(get(ENDPOINT).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.institucion", notNullValue()))
                .andExpect(jsonPath("$.data.estudiantes").value(nullValue()))
                .andExpect(jsonPath("$.data.docentes").value(nullValue()))
                .andExpect(jsonPath("$.data.usuarios").value(nullValue()))
                .andExpect(jsonPath("$.data.auditoria").value(nullValue()))
                .andExpect(jsonPath("$.data.institucion.sedesActivas").value(nullValue()));
    }
}
