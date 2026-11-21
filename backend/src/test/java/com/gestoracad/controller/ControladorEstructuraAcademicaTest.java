package com.gestoracad.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestoracad.dto.DtoCurso;
import com.gestoracad.dto.DtoPeriodoAcademico;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.concurrent.ThreadLocalRandom;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pruebas de integración del módulo de estructura académica (periodos y cursos).
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorEstructuraAcademicaTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String uniqueCode(String prefix) {
        return prefix + "-" + ThreadLocalRandom.current().nextInt(100000, 999999);
    }

    private DtoPeriodoAcademico periodPayload(String code) {
        DtoPeriodoAcademico dto = new DtoPeriodoAcademico();
        dto.setCode(code);
        dto.setName("Periodo de prueba " + code);
        dto.setStartDate(LocalDate.of(2099, 3, 1));
        dto.setEndDate(LocalDate.of(2099, 7, 15));
        dto.setEnrollmentStart(LocalDate.of(2099, 2, 1));
        dto.setEnrollmentEnd(LocalDate.of(2099, 2, 20));
        return dto;
    }

    private DtoCurso coursePayload(String code) {
        DtoCurso dto = new DtoCurso();
        dto.setCode(code);
        dto.setName("Curso de prueba " + code);
        dto.setCredits(4);
        dto.setTheoryHours(3);
        dto.setPracticeHours(2);
        dto.setType("GENERAL");
        dto.setDescription("Curso creado por la suite de pruebas");
        return dto;
    }

    @Test
    @DisplayName("Rechaza con 401 el listado de periodos sin autenticación")
    void periodsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/academic-periods"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "usuario.test", authorities = {"CURSO_VIEW"})
    @DisplayName("Rechaza con 403 el listado de periodos sin PERIODO_VIEW")
    void periodsRequirePermission() throws Exception {
        mockMvc.perform(get("/api/v1/academic-periods"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"PERIODO_CREATE"})
    @DisplayName("Registra un periodo y rechaza el código duplicado")
    void createPeriodAndRejectDuplicate() throws Exception {
        String code = uniqueCode("PER");
        DtoPeriodoAcademico dto = periodPayload(code);

        mockMvc.perform(post("/api/v1/academic-periods")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value(code))
                .andExpect(jsonPath("$.data.active").value(true));

        mockMvc.perform(post("/api/v1/academic-periods")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"PERIODO_CREATE", "PERIODO_EDIT", "PERIODO_VIEW"})
    @DisplayName("Activa un periodo y desmarca el anterior")
    void activatePeriod() throws Exception {
        String first = uniqueCode("PA");
        String second = uniqueCode("PB");

        String firstResponse = mockMvc.perform(post("/api/v1/academic-periods")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(periodPayload(first))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long firstId = objectMapper.readTree(firstResponse).path("data").path("id").asLong();

        String secondResponse = mockMvc.perform(post("/api/v1/academic-periods")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(periodPayload(second))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long secondId = objectMapper.readTree(secondResponse).path("data").path("id").asLong();

        mockMvc.perform(patch("/api/v1/academic-periods/{id}/activate", secondId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.current").value(true));

        mockMvc.perform(get("/api/v1/academic-periods/{id}", firstId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.current").value(false));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"PERIODO_CREATE", "PERIODO_EDIT", "PERIODO_DELETE"})
    @DisplayName("No permite desactivar el periodo vigente")
    void cannotDeleteCurrentPeriod() throws Exception {
        String code = uniqueCode("PC");
        String response = mockMvc.perform(post("/api/v1/academic-periods")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(periodPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long id = objectMapper.readTree(response).path("data").path("id").asLong();

        // Solo es vigente si no existía otro; si no lo es, se activa primero.
        mockMvc.perform(patch("/api/v1/academic-periods/{id}/activate", id))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/academic-periods/{id}", id))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"CURSO_CREATE"})
    @DisplayName("Registra un curso y calcula las horas totales")
    void createCourseAndRejectDuplicate() throws Exception {
        String code = uniqueCode("CUR");
        DtoCurso dto = coursePayload(code);

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value(code))
                .andExpect(jsonPath("$.data.totalHours").value(5))
                .andExpect(jsonPath("$.data.active").value(true));

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "usuario.test", authorities = {"PERIODO_VIEW"})
    @DisplayName("Rechaza con 403 el listado de cursos sin CURSO_VIEW")
    void coursesRequirePermission() throws Exception {
        mockMvc.perform(get("/api/v1/courses"))
                .andExpect(status().isForbidden());
    }
}
