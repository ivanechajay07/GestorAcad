package com.gestoracad.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestoracad.dto.DtoCambiarContrasena;
import com.gestoracad.dto.DtoSolicitudLogin;
import com.gestoracad.entity.Rol;
import com.gestoracad.repository.RepositorioRol;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.entity.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
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
class ControladorAutenticacionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RepositorioRol roleRepository;

    @Autowired
    private RepositorioUsuario userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        if (!roleRepository.existsByName("ROLE_UNIVERSIDAD")) {
            roleRepository.save(new Rol("ROLE_UNIVERSIDAD", "Rol Universidad"));
        }
        Usuario user = userRepository.findByUsername("auth.test").orElseGet(() -> {
            Usuario newUser = new Usuario();
            newUser.setUsername("auth.test");
            newUser.setEmail("auth.test@gestoracad.edu");
            newUser.setFirstName("Auth");
            newUser.setLastName("Test");
            newUser.setActive(true);
            newUser.setRoles(Set.of(roleRepository.findByName("ROLE_UNIVERSIDAD").orElseThrow()));
            return newUser;
        });
        user.setPasswordHash(passwordEncoder.encode("ClaveSegura2026!"));
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setAccountLocked(false);
        user.setActive(true);
        userRepository.save(user);
    }

    @Test
    @DisplayName("Debe autenticar correctamente y devolver token JWT en POST /api/v1/auth/login")
    void testLoginSuccess() throws Exception {
        DtoSolicitudLogin loginRequestDto = new DtoSolicitudLogin();
        loginRequestDto.setUsernameOrEmail("auth.test");
        loginRequestDto.setPassword("ClaveSegura2026!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.username").value("auth.test"))
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.roles").isArray())
                .andExpect(jsonPath("$.data.permissions").isArray());
    }

    @Test
    @DisplayName("Debe rechazar con 401 cuando la contraseña es incorrecta")
    void testLoginBadPassword() throws Exception {
        DtoSolicitudLogin loginRequestDto = new DtoSolicitudLogin();
        loginRequestDto.setUsernameOrEmail("auth.test");
        loginRequestDto.setPassword("ClaveIncorrecta!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequestDto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Debe rechazar con 401 cuando el usuario no existe")
    void testLoginUnknownUser() throws Exception {
        DtoSolicitudLogin loginRequestDto = new DtoSolicitudLogin();
        loginRequestDto.setUsernameOrEmail("usuario.inexistente");
        loginRequestDto.setPassword("ClaveSegura2026!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequestDto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Debe rechazar con 400 cuando faltan credenciales")
    void testLoginValidationFails() throws Exception {
        DtoSolicitudLogin invalidDto = new DtoSolicitudLogin();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors").exists());
    }

    @Test
    @DisplayName("Debe requerir autenticación para GET /api/v1/auth/me")
    void testGetCurrentUserUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Debe bloquear la cuenta tras 5 intentos de login fallidos")
    void testAccountLockoutAfterFailedAttempts() throws Exception {
        for (int i = 0; i < 4; i++) {
            DtoSolicitudLogin attempt = new DtoSolicitudLogin();
            attempt.setUsernameOrEmail("auth.test");
            attempt.setPassword("ContrasegnaErronea" + i);

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(attempt)))
                    .andExpect(status().isUnauthorized());
        }

        DtoSolicitudLogin fifthAttempt = new DtoSolicitudLogin();
        fifthAttempt.setUsernameOrEmail("auth.test");
        fifthAttempt.setPassword("ContrasegnaErroneaFinal");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fifthAttempt)))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.status").value(423))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("15 minutos")));

        DtoSolicitudLogin blockedAttempt = new DtoSolicitudLogin();
        blockedAttempt.setUsernameOrEmail("auth.test");
        blockedAttempt.setPassword("ClaveSegura2026!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockedAttempt)))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.status").value(423))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("minutos")));
    }

    @Test
    @DisplayName("Debe registrar la solicitud de recuperación sin revelar si el correo existe")
    void testForgotPassword() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"correo.existente@gestoracad.edu\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "auth.test")
    @DisplayName("Debe devolver el perfil del usuario autenticado en GET /api/v1/auth/me")
    void testGetCurrentUserAuthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("auth.test"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
    }

    @Test
    @WithMockUser(username = "auth.test")
    @DisplayName("Debe cambiar la contraseña con la contraseña actual correcta")
    void testChangePasswordSuccess() throws Exception {
        DtoCambiarContrasena dto = new DtoCambiarContrasena();
        dto.setCurrentPassword("ClaveSegura2026!");
        dto.setNewPassword("NuevaClave2026!");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        dto.setCurrentPassword("NuevaClave2026!");
        dto.setNewPassword("ClaveSegura2026!");
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "auth.test")
    @DisplayName("Debe rechazar el cambio de contraseña con la contraseña actual incorrecta")
    void testChangePasswordWrongCurrent() throws Exception {
        DtoCambiarContrasena dto = new DtoCambiarContrasena();
        dto.setCurrentPassword("ContrasegnaIncorrecta!");
        dto.setNewPassword("NuevaClave2026!");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
