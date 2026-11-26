package com.gestoracad.service;

import com.gestoracad.dto.DtoCrearUsuario;
import com.gestoracad.dto.DtoRespuestaUsuario;
import com.gestoracad.entity.Rol;
import com.gestoracad.entity.Usuario;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.repository.RepositorioRol;
import com.gestoracad.repository.RepositorioUsuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ServicioUsuarioTest {

    @Autowired
    private ServicioUsuario userService;

    @Autowired
    private RepositorioUsuario userRepository;

    @Autowired
    private RepositorioRol roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        if (!roleRepository.existsByName("ROLE_UNIVERSIDAD")) {
            roleRepository.save(new Rol("ROLE_UNIVERSIDAD", "Rol Universidad"));
        }
    }

    @Test
    @DisplayName("Debe crear usuario correctamente y cifrar la contraseña con BCrypt (nunca texto plano)")
    void testCreateUserSuccessAndBCryptHashing() {
        DtoCrearUsuario createDto = new DtoCrearUsuario();
        createDto.setUsername("profesor.nuevo");
        createDto.setEmail("profesor.nuevo@gestoracad.edu");
        createDto.setPassword("PasswordSegura2026!");
        createDto.setFirstName("Pedro");
        createDto.setLastName("Castillo");
        createDto.setRoles(Set.of("ROLE_UNIVERSIDAD"));

        DtoRespuestaUsuario created = userService.createUser(createDto, "192.168.1.100");

        assertNotNull(created.getId());
        assertEquals("profesor.nuevo", created.getUsername());
        assertEquals("profesor.nuevo@gestoracad.edu", created.getEmail());
        assertTrue(created.isActive());

        // Comprobación de seguridad en Base de Datos
        Usuario userInDb = userRepository.findById(created.getId()).orElseThrow();
        assertNotEquals("PasswordSegura2026!", userInDb.getPasswordHash(), "La contraseña jamás debe guardarse en texto plano");
        assertTrue(passwordEncoder.matches("PasswordSegura2026!", userInDb.getPasswordHash()), "El hash BCrypt debe coincidir con la contraseña original");
    }

    @Test
    @DisplayName("Debe rechazar la creación de usuarios con username duplicado")
    void testDuplicateUsernameFails() {
        DtoCrearUsuario firstUser = new DtoCrearUsuario();
        firstUser.setUsername("usuario.duplicado");
        firstUser.setEmail("usuario1@gestoracad.edu");
        firstUser.setPassword("ClaveSegura2026!");
        firstUser.setFirstName("Juan");
        firstUser.setLastName("Perez");
        firstUser.setRoles(Set.of("ROLE_UNIVERSIDAD"));
        userService.createUser(firstUser, "127.0.0.1");

        DtoCrearUsuario secondUser = new DtoCrearUsuario();
        secondUser.setUsername("usuario.duplicado");
        secondUser.setEmail("usuario2@gestoracad.edu");
        secondUser.setPassword("OtraClave2026!");
        secondUser.setFirstName("Pedro");
        secondUser.setLastName("Gomez");
        secondUser.setRoles(Set.of("ROLE_UNIVERSIDAD"));

        assertThrows(ExcepcionApi.class, () -> userService.createUser(secondUser, "127.0.0.1"));
    }

    @Test
    @DisplayName("Debe rechazar la creación de usuarios con email duplicado")
    void testDuplicateEmailFails() {
        DtoCrearUsuario firstUser = new DtoCrearUsuario();
        firstUser.setUsername("usuario.email1");
        firstUser.setEmail("mismo.correo@gestoracad.edu");
        firstUser.setPassword("ClaveSegura2026!");
        firstUser.setFirstName("Ana");
        firstUser.setLastName("Torres");
        firstUser.setRoles(Set.of("ROLE_UNIVERSIDAD"));
        userService.createUser(firstUser, "127.0.0.1");

        DtoCrearUsuario secondUser = new DtoCrearUsuario();
        secondUser.setUsername("usuario.email2");
        secondUser.setEmail("mismo.correo@gestoracad.edu");
        secondUser.setPassword("OtraClave2026!");
        secondUser.setFirstName("Maria");
        secondUser.setLastName("Lopez");
        secondUser.setRoles(Set.of("ROLE_UNIVERSIDAD"));

        assertThrows(ExcepcionApi.class, () -> userService.createUser(secondUser, "127.0.0.1"));
    }
}
