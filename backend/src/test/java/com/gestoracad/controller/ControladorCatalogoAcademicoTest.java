package com.gestoracad.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestoracad.dto.DtoCarrera;
import com.gestoracad.dto.DtoFacultad;
import com.gestoracad.entity.Carrera;
import com.gestoracad.entity.Estudiante;
import com.gestoracad.entity.Facultad;
import com.gestoracad.repository.RepositorioCarrera;
import com.gestoracad.repository.RepositorioEstudiante;
import com.gestoracad.repository.RepositorioFacultad;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pruebas del CRUD del catálogo académico (facultades y carreras) y de sus
 * reglas de relación con estudiantes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorCatalogoAcademicoTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RepositorioFacultad facultyRepository;

    @Autowired
    private RepositorioCarrera careerRepository;

    @Autowired
    private RepositorioEstudiante studentRepository;

    private Facultad faculty(String name) {
        return facultyRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> facultyRepository.save(new Facultad(name)));
    }

    private Carrera career(String name, Facultad faculty) {
        return careerRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> careerRepository.save(new Carrera(name, faculty)));
    }

    private DtoFacultad facultyPayload(String name) {
        DtoFacultad dto = new DtoFacultad();
        dto.setName(name);
        dto.setDescription("Facultad creada por la suite de pruebas");
        return dto;
    }

    private DtoCarrera careerPayload(String name, Long facultyId) {
        DtoCarrera dto = new DtoCarrera();
        dto.setName(name);
        dto.setDescription("Carrera creada por la suite de pruebas");
        dto.setFacultyId(facultyId);
        return dto;
    }

    @Test
    @DisplayName("Debe rechazar con 401 sin token en GET /api/v1/faculties")
    void testFacultiesUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/faculties").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "usuario.test", authorities = {"SEDE_VIEW"})
    @DisplayName("Debe rechazar con 403 al no tener permiso FACULTAD_VIEW")
    void testFacultiesForbiddenWithoutPermission() throws Exception {
        mockMvc.perform(get("/api/v1/faculties").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"FACULTAD_CREATE"})
    @DisplayName("Debe registrar una facultad y rechazar el nombre duplicado")
    void testCreateFacultyAndDuplicateName() throws Exception {
        DtoFacultad dto = facultyPayload("Facultad de Pruebas API 09");

        mockMvc.perform(post("/api/v1/faculties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Facultad de Pruebas API 09"))
                .andExpect(jsonPath("$.data.active").value(true));

        mockMvc.perform(post("/api/v1/faculties")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"FACULTAD_VIEW"})
    @DisplayName("Debe listar facultades con contadores de carreras y estudiantes")
    void testGetFacultiesWithCounters() throws Exception {
        Facultad f = faculty("Facultad de Pruebas Contadores 09");
        career("Carrera de Pruebas Contadores 09", f);

        mockMvc.perform(get("/api/v1/faculties").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[?(@.name == 'Facultad de Pruebas Contadores 09')].careerCount",
                        org.hamcrest.Matchers.hasItem(1)));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"CARRERA_CREATE"})
    @DisplayName("Debe registrar una carrera asociada a una facultad y rechazar el nombre duplicado")
    void testCreateCareerAndDuplicateName() throws Exception {
        Facultad f = faculty("Facultad de Pruebas Carreras 09");
        DtoCarrera dto = careerPayload("Carrera de Pruebas API 09", f.getId());

        mockMvc.perform(post("/api/v1/careers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Carrera de Pruebas API 09"))
                .andExpect(jsonPath("$.data.facultyId").value(f.getId()))
                .andExpect(jsonPath("$.data.facultyName").value("Facultad de Pruebas Carreras 09"));

        mockMvc.perform(post("/api/v1/careers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"CARRERA_EDIT"})
    @DisplayName("Al cambiar la carrera de facultad debe reasignar a sus estudiantes")
    void testMoveCareerSyncsStudentFaculty() throws Exception {
        Facultad origin = faculty("Facultad Origen Sync 09");
        Facultad target = faculty("Facultad Destino Sync 09");
        Carrera c = career("Carrera Sync 09", origin);

        Estudiante student = new Estudiante();
        student.setCode("SYNC-09-001");
        student.setFirstName("Estudiante");
        student.setLastName("Sync");
        student.setFaculty(origin);
        student.setCareer(c);
        studentRepository.save(student);

        DtoCarrera dto = careerPayload("Carrera Sync 09", target.getId());

        mockMvc.perform(put("/api/v1/careers/" + c.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.facultyId").value(target.getId()));

        Estudiante reloaded = studentRepository.findById(student.getId()).orElseThrow();
        assertThat(reloaded.getFaculty().getId()).isEqualTo(target.getId());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"FACULTAD_DELETE"})
    @DisplayName("No debe desactivar una facultad con carreras activas")
    void testDeleteFacultyWithActiveCareersIsRejected() throws Exception {
        Facultad f = faculty("Facultad con Carreras 09");
        Carrera c = career("Carrera Dependiente 09", f);

        mockMvc.perform(delete("/api/v1/faculties/" + f.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        assertThat(careerRepository.findById(c.getId())).isPresent();
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"CARRERA_DELETE"})
    @DisplayName("No debe desactivar una carrera con estudiantes activos")
    void testDeleteCareerWithActiveStudentsIsRejected() throws Exception {
        Facultad f = faculty("Facultad con Estudiantes 09");
        Carrera c = career("Carrera con Estudiantes 09", f);

        Estudiante student = new Estudiante();
        student.setCode("SYNC-09-002");
        student.setFirstName("Estudiante");
        student.setLastName("Dependiente");
        student.setFaculty(f);
        student.setCareer(c);
        studentRepository.save(student);

        mockMvc.perform(delete("/api/v1/careers/" + c.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
