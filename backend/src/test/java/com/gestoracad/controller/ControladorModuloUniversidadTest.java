package com.gestoracad.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestoracad.dto.DtoAutoridad;
import com.gestoracad.dto.DtoSede;
import com.gestoracad.dto.DtoParametroSistema;
import com.gestoracad.dto.DtoUniversidad;
import com.gestoracad.entity.Universidad;
import com.gestoracad.repository.RepositorioUniversidad;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorModuloUniversidadTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RepositorioUniversidad universityRepository;

    @BeforeEach
    void setUp() {
        if (universityRepository.findFirstByActiveTrueOrderByIdAsc().isEmpty()) {
            Universidad university = new Universidad();
            university.setName("Universidad Nacional de Innovación Tecnológica del Perú");
            university.setShortName("UNINTEP");
            university.setInstitutionType("PUBLICA");
            university.setTaxId("20998877665");
            universityRepository.save(university);
        }
    }

    @Test
    @DisplayName("Debe rechazar con 401 sin token en GET /api/v1/university")
    void testUniversityUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/university").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "usuario.test", authorities = {"USUARIO_VIEW"})
    @DisplayName("Debe rechazar con 403 al no tener permiso UNIVERSIDAD_VIEW")
    void testUniversityForbiddenWithoutPermission() throws Exception {
        mockMvc.perform(get("/api/v1/university").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"UNIVERSIDAD_VIEW"})
    @DisplayName("Debe obtener la institución activa en GET /api/v1/university/active")
    void testGetActiveUniversity() throws Exception {
        mockMvc.perform(get("/api/v1/university/active").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.shortName").value("UNINTEP"));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"UNIVERSIDAD_EDIT"})
    @DisplayName("Debe registrar institución en POST /api/v1/university")
    void testCreateUniversity() throws Exception {
        DtoUniversidad dto = new DtoUniversidad();
        dto.setName("Universidad Tecnológica del Norte");
        dto.setShortName("UTN");
        dto.setInstitutionType("PRIVADA");
        dto.setTaxId("20111122233");

        mockMvc.perform(post("/api/v1/university")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.shortName").value("UTN"))
                .andExpect(jsonPath("$.data.taxId").value("20111122233"));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"UNIVERSIDAD_EDIT"})
    @DisplayName("Debe rechazar institución con RUC duplicado")
    void testCreateUniversityDuplicateTaxId() throws Exception {
        DtoUniversidad dto = new DtoUniversidad();
        dto.setName("Universidad Duplicada");
        dto.setInstitutionType("PRIVADA");
        dto.setTaxId("20998877665");

        mockMvc.perform(post("/api/v1/university")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"SEDE_VIEW"})
    @DisplayName("Debe listar sedes en GET /api/v1/campuses")
    void testGetCampuses() throws Exception {
        mockMvc.perform(get("/api/v1/campuses").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"SEDE_CREATE"})
    @DisplayName("Debe registrar sede y rechazar código duplicado")
    void testCreateCampusAndDuplicateCode() throws Exception {
        Long universityId = universityRepository.findFirstByActiveTrueOrderByIdAsc().orElseThrow().getId();

        DtoSede dto = new DtoSede();
        dto.setUniversityId(universityId);
        dto.setName("Sede Central");
        dto.setCode("SED-CEN");
        dto.setCampusType("CAMPUS");

        mockMvc.perform(post("/api/v1/campuses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value("SED-CEN"));

        mockMvc.perform(post("/api/v1/campuses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"AUTORIDAD_CREATE"})
    @DisplayName("Debe registrar autoridad universitaria")
    void testCreateAuthority() throws Exception {
        DtoAutoridad dto = new DtoAutoridad();
        dto.setPosition("Rector");
        dto.setFirstName("Elena");
        dto.setLastName("Quispe");
        dto.setEmail("rector@unintep.edu.pe");

        mockMvc.perform(post("/api/v1/authorities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.position").value("Rector"))
                .andExpect(jsonPath("$.data.lastName").value("Quispe"));
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"PARAMETRO_VIEW"})
    @DisplayName("Debe listar parámetros en GET /api/v1/parameters")
    void testGetParameters() throws Exception {
        mockMvc.perform(get("/api/v1/parameters").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "rector.test", authorities = {"PARAMETRO_EDIT"})
    @DisplayName("Debe registrar parámetro y rechazar clave duplicada")
    void testCreateParameterAndDuplicateKey() throws Exception {
        DtoParametroSistema dto = new DtoParametroSistema();
        dto.setKey("FORMATO_FECHA");
        dto.setValue("dd/MM/yyyy");
        dto.setValueType("STRING");
        dto.setModule("SISTEMA");
        dto.setDescription("Formato de fecha del sistema");

        mockMvc.perform(post("/api/v1/parameters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.key").value("FORMATO_FECHA"));

        mockMvc.perform(post("/api/v1/parameters")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
