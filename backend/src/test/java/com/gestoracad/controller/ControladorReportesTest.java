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
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorReportesTest {

    private static final String CSV = "text/csv";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Debe rechazar la exportación sin autenticación")
    void exportRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/reports/students"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "consulta.test", authorities = {"ESTUDIANTE_VIEW"})
    @DisplayName("Debe rechazar la exportación sin permiso específico")
    void exportRequiresSpecificPermission() throws Exception {
        mockMvc.perform(get("/api/v1/reports/students"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "consulta.test", authorities = {"ESTUDIANTE_VIEW"})
    @DisplayName("Debe rechazar el acta PDF sin permiso ACTA_VIEW")
    void actaPdfRequiresActaPermission() throws Exception {
        mockMvc.perform(get("/api/v1/reports/sections/3/acta.pdf"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ESTUDIANTE_EXPORT"})
    @DisplayName("Debe exportar el padrón estudiantil como CSV UTF-8")
    void exportStudentsCsv() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/reports/students"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("estudiantes_")))
                .andReturn();

        assertThat(result.getResponse().getContentType()).contains(CSV);
        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(body).startsWith("\uFEFF");
        assertThat(body).contains("Código;Estudiante;Documento");
        assertThat(body).contains("Promedio;Condición;Matrícula;Estado");
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"DOCENTE_EXPORT"})
    @DisplayName("Debe exportar el padrón docente como CSV")
    void exportTeachersCsv() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/reports/teachers"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("docentes_")))
                .andReturn();
        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(body).contains("Código;Docente;Documento");
        assertThat(body).contains("Horas semanales;Estado");
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"USUARIO_EXPORT"})
    @DisplayName("Debe exportar el directorio de usuarios como CSV")
    void exportUsersCsv() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/reports/users"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("usuarios_")))
                .andReturn();
        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(body).contains("Usuario;Nombre;Correo");
        assertThat(body).contains("Roles;Estado;Último acceso");
    }
}
