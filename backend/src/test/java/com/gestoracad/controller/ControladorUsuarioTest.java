package com.gestoracad.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestoracad.dto.DtoCrearUsuario;
import com.gestoracad.entity.Rol;
import com.gestoracad.repository.RepositorioRol;
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

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorUsuarioTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RepositorioRol roleRepository;

    @BeforeEach
    void setUp() {
        if (!roleRepository.existsByName("ROLE_UNIVERSIDAD")) {
            roleRepository.save(new Rol("ROLE_UNIVERSIDAD", "Rol Universidad"));
        }
    }

    @Test
    @DisplayName("Debe rechazar con 401 cuando no hay token JWT en GET /api/v1/users")
    void testGetAllUsersUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @WithMockUser(username = "admin.test", authorities = {"USUARIO_VIEW"})
    @DisplayName("Debe listar usuarios correctamente en GET /api/v1/users")
    void testGetAllUsers() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(username = "admin.test", authorities = {"USUARIO_CREATE", "ROLE_UNIVERSIDAD"})
    @DisplayName("Debe registrar usuario correctamente en POST /api/v1/users")
    void testCreateUserEndpoint() throws Exception {
        DtoCrearUsuario createDto = new DtoCrearUsuario();
        createDto.setUsername("docente.test");
        createDto.setEmail("docente.test@gestoracad.edu");
        createDto.setPassword("ClaveSegura2026!");
        createDto.setFirstName("Marco");
        createDto.setLastName("Rios");
        createDto.setRoles(Set.of("ROLE_UNIVERSIDAD"));

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("docente.test"))
                .andExpect(jsonPath("$.data.email").value("docente.test@gestoracad.edu"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    @WithMockUser(username = "admin.test", authorities = {"USUARIO_CREATE"})
    @DisplayName("Debe retornar 400 Bad Request cuando faltan campos requeridos")
    void testCreateUserValidationFails() throws Exception {
        DtoCrearUsuario invalidDto = new DtoCrearUsuario();
        invalidDto.setUsername(""); // En blanco
        invalidDto.setEmail("no-es-un-email");

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors").exists());
    }
}

