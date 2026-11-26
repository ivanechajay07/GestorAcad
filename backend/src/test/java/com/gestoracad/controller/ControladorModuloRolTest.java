package com.gestoracad.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestoracad.dto.DtoSolicitudRol;
import com.gestoracad.entity.Permiso;
import com.gestoracad.entity.Rol;
import com.gestoracad.repository.RepositorioPermiso;
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

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ControladorModuloRolTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RepositorioRol roleRepository;

    @Autowired
    private RepositorioPermiso permissionRepository;

    private Long permissionId;

    @BeforeEach
    void setUp() {
        Permiso permission = permissionRepository.findByName("ROL_TEST_VIEW")
                .orElseGet(() -> permissionRepository.save(new Permiso("ROL_TEST_VIEW", "ROL", "Permiso de prueba")));
        permissionId = permission.getId();

        if (!roleRepository.existsByName("ROLE_UNIVERSIDAD")) {
            roleRepository.save(new Rol("ROLE_UNIVERSIDAD", "Rol base del sistema"));
        }
    }

    private DtoSolicitudRol roleRequest(String name, String description) {
        DtoSolicitudRol dto = new DtoSolicitudRol();
        dto.setName(name);
        dto.setDescription(description);
        dto.setPermissionIds(List.of(permissionId));
        return dto;
    }

    @Test
    @DisplayName("GET /api/v1/roles requiere autenticación")
    void listUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/roles")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = {"ROL_VIEW"})
    @DisplayName("Lista roles y permisos")
    void listRolesAndPermissions() throws Exception {
        mockMvc.perform(get("/api/v1/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
        mockMvc.perform(get("/api/v1/roles/permissions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(authorities = {"ROL_CREATE"})
    @DisplayName("Crea un rol con permisos")
    void createRole() throws Exception {
        mockMvc.perform(post("/api/v1/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleRequest("ROLE_TEST_CREATE", "Rol de prueba"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("ROLE_TEST_CREATE"))
                .andExpect(jsonPath("$.data.permissions").isArray());
    }

    @Test
    @WithMockUser(authorities = {"ROL_CREATE"})
    @DisplayName("Rechaza la creación de un rol duplicado")
    void createDuplicateRole() throws Exception {
        roleRepository.save(new Rol("ROLE_TEST_DUP", "Duplicado"));
        mockMvc.perform(post("/api/v1/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleRequest("ROLE_TEST_DUP", "Duplicado"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(authorities = {"ROL_CREATE"})
    @DisplayName("Valida los campos requeridos al crear rol")
    void createRoleValidationFails() throws Exception {
        DtoSolicitudRol dto = new DtoSolicitudRol();
        dto.setName("");
        dto.setDescription("");
        mockMvc.perform(post("/api/v1/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors").exists());
    }

    @Test
    @WithMockUser(authorities = {"ROL_EDIT"})
    @DisplayName("Actualiza un rol existente")
    void updateRole() throws Exception {
        Rol role = roleRepository.save(new Rol("ROLE_TEST_UPD", "Original"));
        mockMvc.perform(put("/api/v1/roles/" + role.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleRequest("ROLE_TEST_UPD", "Actualizado"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.description").value("Actualizado"));
    }

    @Test
    @WithMockUser(authorities = {"ROL_DELETE"})
    @DisplayName("Elimina un rol que no es base")
    void deleteRole() throws Exception {
        Rol role = roleRepository.save(new Rol("ROLE_TEST_DEL", "Eliminar"));
        mockMvc.perform(delete("/api/v1/roles/" + role.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = {"ROL_DELETE"})
    @DisplayName("No permite eliminar el rol base")
    void deleteBaseRoleFails() throws Exception {
        Long baseId = roleRepository.findByName("ROLE_UNIVERSIDAD").orElseThrow().getId();
        mockMvc.perform(delete("/api/v1/roles/" + baseId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
