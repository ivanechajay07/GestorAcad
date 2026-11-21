package com.gestoracad.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestoracad.dto.DtoAdmisionEstudiante;
import com.gestoracad.dto.DtoEstudiante;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.repository.RepositorioEstudiante;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorModuloEstudianteTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RepositorioEstudiante studentRepository;

    @BeforeEach
    void setUp() {
        if (studentRepository.findByCode("EST-TEST-01").isEmpty()) {
            Estudiante student = new Estudiante();
            student.setCode("EST-TEST-01");
            student.setFirstName("Ana");
            student.setLastName("Torres");
            student.setDocumentId("90112233");
            student.setCurrentCycle(5);
            student.setApprovedCredits(100);
            student.setWeightedAverage(new BigDecimal("16.50"));
            student.setCondition("REGULAR");
            student.setEnrollmentStatus("MATRICULADO");
            student.setActive(true);
            studentRepository.save(student);
        }
    }

    private Long studentId() {
        return studentRepository.findByCode("EST-TEST-01").orElseThrow().getId();
    }

    private DtoEstudiante studentDto(String code, String documentId) {
        DtoEstudiante dto = new DtoEstudiante();
        dto.setCode(code);
        dto.setFirstName("Luis");
        dto.setLastName("Gómez");
        dto.setEmail("luis.gomez@gestoracad.edu");
        dto.setDocumentId(documentId);
        dto.setCurrentCycle(3);
        dto.setApprovedCredits(48);
        dto.setWeightedAverage(new BigDecimal("14.75"));
        dto.setCondition("OBSERVADO");
        dto.setEnrollmentStatus("MATRICULADO");
        dto.setCareer("Ingeniería de Sistemas e Informática");
        dto.setFaculty("Facultad de Ingeniería y Arquitectura");
        return dto;
    }

    @Test
    @DisplayName("Debe rechazar con 401 sin token en GET /api/v1/students")
    void testStudentsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/students").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "usuario.test", authorities = {"USUARIO_VIEW"})
    @DisplayName("Debe rechazar con 403 al no tener permiso ESTUDIANTE_VIEW")
    void testStudentsForbiddenWithoutPermission() throws Exception {
        mockMvc.perform(get("/api/v1/students").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ESTUDIANTE_VIEW"})
    @DisplayName("Debe listar estudiantes en GET /api/v1/students")
    void testGetStudents() throws Exception {
        mockMvc.perform(get("/api/v1/students").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ESTUDIANTE_CREATE"})
    @DisplayName("Debe registrar estudiante y rechazar código duplicado")
    void testCreateStudentAndDuplicateCode() throws Exception {
        DtoEstudiante dto = studentDto("EST-NUEVO-01", "88887777");

        mockMvc.perform(post("/api/v1/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value("EST-NUEVO-01"))
                .andExpect(jsonPath("$.data.fullName").value("Luis Gómez"));

        mockMvc.perform(post("/api/v1/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ESTUDIANTE_EDIT"})
    @DisplayName("Debe actualizar un estudiante existente")
    void testUpdateStudent() throws Exception {
        DtoEstudiante dto = studentDto("EST-TEST-01", "90112233");
        dto.setFirstName("Ana María");
        dto.setLastName("Torres");
        dto.setWeightedAverage(new BigDecimal("17.25"));

        mockMvc.perform(put("/api/v1/students/" + studentId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Ana María Torres"));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ADMISION_CREATE"})
    @DisplayName("Debe registrar admisión y rechazar periodo duplicado")
    void testCreateAdmissionAndDuplicatePeriod() throws Exception {
        DtoAdmisionEstudiante dto = new DtoAdmisionEstudiante();
        dto.setModality("ORDINARIO");
        dto.setPeriod("2027-I");
        dto.setHighSchool("I.E. Colegio Nacional");
        dto.setScore(new BigDecimal("16.40"));
        dto.setStatus("ADMITIDO");

        mockMvc.perform(post("/api/v1/student-admissions/student/" + studentId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.period").value("2027-I"))
                .andExpect(jsonPath("$.data.modality").value("ORDINARIO"));

        mockMvc.perform(post("/api/v1/student-admissions/student/" + studentId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "usuario.test", authorities = {"ESTUDIANTE_VIEW"})
    @DisplayName("Debe rechazar con 403 al no tener permiso ADMISION_VIEW")
    void testAdmissionsForbiddenWithoutPermission() throws Exception {
        mockMvc.perform(get("/api/v1/student-admissions/student/" + studentId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ADMISION_VIEW"})
    @DisplayName("Debe listar admisiones de un estudiante")
    void testGetAdmissions() throws Exception {
        mockMvc.perform(get("/api/v1/student-admissions/student/" + studentId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ESTUDIANTE_EDIT"})
    @DisplayName("Debe actualizar el estado del estudiante en PATCH /api/v1/students/{id}/status")
    void testToggleStudentStatus() throws Exception {
        Long id = studentId();

        mockMvc.perform(patch("/api/v1/students/" + id + "/status")
                        .param("active", "false")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(studentRepository.findById(id).orElseThrow().isActive()).isFalse();
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ESTUDIANTE_DELETE"})
    @DisplayName("Debe desactivar un estudiante (soft delete)")
    void testDeleteStudent() throws Exception {
        mockMvc.perform(delete("/api/v1/students/" + studentId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
