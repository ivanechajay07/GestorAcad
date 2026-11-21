package com.gestoracad.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestoracad.dto.DtoAsignacionDocente;
import com.gestoracad.dto.DtoDocente;
import com.gestoracad.dto.DtoEspecialidadDocente;
import com.gestoracad.entity.Docente;
import com.gestoracad.repository.RepositorioDocente;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorModuloDocenteTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RepositorioDocente teacherRepository;

    @BeforeEach
    void setUp() {
        if (teacherRepository.findByCode("DOC-TEST-01").isEmpty()) {
            Docente teacher = new Docente();
            teacher.setCode("DOC-TEST-01");
            teacher.setFirstName("Ana");
            teacher.setLastName("Torres");
            teacher.setCategory("PRINCIPAL");
            teacher.setDedication("TIEMPO_COMPLETO");
            teacher.setDocumentId("11112222");
            teacher.setActive(true);
            teacherRepository.save(teacher);
        }
    }

    private Long teacherId() {
        return teacherRepository.findByCode("DOC-TEST-01").orElseThrow().getId();
    }

    private DtoDocente teacherDto(String code, String documentId) {
        DtoDocente dto = new DtoDocente();
        dto.setCode(code);
        dto.setFirstName("Luis");
        dto.setLastName("Gómez");
        dto.setCategory("ASOCIADO");
        dto.setDedication("TIEMPO_PARCIAL");
        dto.setEmail("luis.gomez@unintep.edu.pe");
        dto.setDocumentId(documentId);
        return dto;
    }

    @Test
    @DisplayName("Debe rechazar con 401 sin token en GET /api/v1/teachers")
    void testTeachersUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/teachers").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "usuario.test", authorities = {"USUARIO_VIEW"})
    @DisplayName("Debe rechazar con 403 al no tener permiso DOCENTE_VIEW")
    void testTeachersForbiddenWithoutPermission() throws Exception {
        mockMvc.perform(get("/api/v1/teachers").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"DOCENTE_VIEW"})
    @DisplayName("Debe listar docentes en GET /api/v1/teachers")
    void testGetTeachers() throws Exception {
        mockMvc.perform(get("/api/v1/teachers").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"DOCENTE_CREATE"})
    @DisplayName("Debe registrar docente y rechazar código duplicado")
    void testCreateTeacherAndDuplicateCode() throws Exception {
        DtoDocente dto = teacherDto("DOC-NUEVO-01", "33334444");

        mockMvc.perform(post("/api/v1/teachers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value("DOC-NUEVO-01"))
                .andExpect(jsonPath("$.data.fullName").value("Luis Gómez"));

        mockMvc.perform(post("/api/v1/teachers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ESPECIALIDAD_CREATE"})
    @DisplayName("Debe registrar especialidad y rechazar duplicada")
    void testCreateSpecialtyAndDuplicate() throws Exception {
        DtoEspecialidadDocente dto = new DtoEspecialidadDocente();
        dto.setName("Machine Learning");
        dto.setArea("Inteligencia Artificial");
        dto.setLevel("MAESTRIA");
        dto.setInstitution("Universidad Nacional de Ingeniería");
        dto.setYear(2020);

        mockMvc.perform(post("/api/v1/teacher-specialties/teacher/" + teacherId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Machine Learning"));

        mockMvc.perform(post("/api/v1/teacher-specialties/teacher/" + teacherId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ESPECIALIDAD_VIEW"})
    @DisplayName("Debe listar especialidades de un docente")
    void testGetSpecialties() throws Exception {
        mockMvc.perform(get("/api/v1/teacher-specialties/teacher/" + teacherId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ASIGNACION_CREATE"})
    @DisplayName("Debe registrar asignación lectiva y rechazar curso duplicado en el periodo")
    void testCreateAssignmentAndDuplicate() throws Exception {
        DtoAsignacionDocente dto = new DtoAsignacionDocente();
        dto.setPeriod("2026-I");
        dto.setCourse("Algoritmos y Estructuras de Datos");
        dto.setCourseCode("ISW-301");
        dto.setSection("A");
        dto.setCredits(4);
        dto.setTheoryHours(3);
        dto.setPracticeHours(2);
        dto.setStatus("ASIGNADA");

        mockMvc.perform(post("/api/v1/teacher-assignments/teacher/" + teacherId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.courseCode").value("ISW-301"))
                .andExpect(jsonPath("$.data.totalHours").value(5));

        mockMvc.perform(post("/api/v1/teacher-assignments/teacher/" + teacherId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"ASIGNACION_VIEW"})
    @DisplayName("Debe listar asignaciones lectivas de un docente")
    void testGetAssignments() throws Exception {
        mockMvc.perform(get("/api/v1/teacher-assignments/teacher/" + teacherId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"DOCENTE_EDIT"})
    @DisplayName("Debe actualizar el estado del docente en PATCH /api/v1/teachers/{id}/status")
    void testToggleTeacherStatus() throws Exception {
        Long id = teacherId();

        mockMvc.perform(patch("/api/v1/teachers/" + id + "/status")
                        .param("active", "false")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(teacherRepository.findById(id).orElseThrow().isActive()).isFalse();
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"DOCENTE_DELETE"})
    @DisplayName("Debe desactivar un docente (soft delete)")
    void testDeleteTeacher() throws Exception {
        mockMvc.perform(delete("/api/v1/teachers/" + teacherId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
