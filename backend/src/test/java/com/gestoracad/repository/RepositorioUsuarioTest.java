package com.gestoracad.repository;

import com.gestoracad.config.ConfiguracionAuditoriaJpa;
import com.gestoracad.entity.Permiso;
import com.gestoracad.entity.Rol;
import com.gestoracad.entity.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.AuditorAware;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pruebas de la capa DAO (Spring Data JPA) sobre base de datos H2.
 * Validan las consultas JPQL personalizadas y la carga de relaciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@DataJpaTest
@ActiveProfiles("test")
@Import({ConfiguracionAuditoriaJpa.class, RepositorioUsuarioTest.AuditoriaTestConfig.class})
class RepositorioUsuarioTest {

    @TestConfiguration
    static class AuditoriaTestConfig {
        @Bean(name = "auditorActualImpl")
        AuditorAware<String> auditorActualImpl() {
            return () -> Optional.of("JUNIT");
        }
    }

    @Autowired
    private RepositorioUsuario usuarioRepository;

    @Autowired
    private RepositorioRol rolRepository;

    @Autowired
    private RepositorioPermiso permisoRepository;

    private Usuario crearUsuario(String username, String email) {
        Permiso permiso = permisoRepository.save(new Permiso("USUARIO_VIEW", "USUARIO", "Ver usuarios"));
        Rol rol = new Rol("ROLE_TEST", "Rol de prueba");
        rol.setPermissions(Set.of(permiso));
        Rol rolGuardado = rolRepository.save(rol);

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setPasswordHash("$2a$10$hashbcryptdeprueba");
        usuario.setFirstName("Usuario");
        usuario.setLastName("Prueba");
        usuario.setActive(true);
        usuario.setRoles(Set.of(rolGuardado));
        return usuarioRepository.saveAndFlush(usuario);
    }

    /** Crea un usuario sin permisos para aislar el conteo por rol. */
    private Usuario crearUsuarioConRol(String username, Rol rol) {
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setEmail(username + "@gestoracad.edu");
        usuario.setPasswordHash("$2a$10$hashbcryptdeprueba");
        usuario.setFirstName("Usuario");
        usuario.setLastName("Prueba");
        usuario.setActive(true);
        usuario.setRoles(Set.of(rol));
        return usuarioRepository.saveAndFlush(usuario);
    }

    @Test
    @DisplayName("findByUsernameWithRolesAndPermissions carga roles y permisos en una sola consulta")
    void buscaUsuarioConRolesYPermisos() {
        crearUsuario("dao.user", "dao.user@gestoracad.edu");

        Optional<Usuario> encontrado = usuarioRepository.findByUsernameWithRolesAndPermissions("dao.user");

        assertTrue(encontrado.isPresent());
        assertEquals(1, encontrado.get().getRoles().size());
        assertEquals(1, encontrado.get().getRoles().iterator().next().getPermissions().size());
    }

    @Test
    @DisplayName("findByEmailWithRolesAndPermissions encuentra al usuario por correo")
    void buscaUsuarioPorEmailConRelaciones() {
        crearUsuario("dao.email", "dao.email@gestoracad.edu");

        Optional<Usuario> encontrado = usuarioRepository.findByEmailWithRolesAndPermissions("dao.email@gestoracad.edu");

        assertTrue(encontrado.isPresent());
        assertEquals("dao.email", encontrado.get().getUsername());
    }

    @Test
    @DisplayName("existsByUsername y existsByEmail detectan duplicados")
    void detectaDuplicados() {
        crearUsuario("dao.duplicado", "dao.duplicado@gestoracad.edu");

        assertTrue(usuarioRepository.existsByUsername("dao.duplicado"));
        assertTrue(usuarioRepository.existsByEmail("dao.duplicado@gestoracad.edu"));
        assertFalse(usuarioRepository.existsByUsername("no.existe"));
    }

    @Test
    @DisplayName("countUsuariosPorRol agrupa en una sola consulta los usuarios de cada rol")
    void cuentaUsuariosPorRol() {
        Rol docente = rolRepository.saveAndFlush(new Rol("ROLE_CONTEO_DOCENTE", "Docente"));
        Rol estudiante = rolRepository.saveAndFlush(new Rol("ROLE_CONTEO_ESTUDIANTE", "Estudiante"));
        rolRepository.saveAndFlush(new Rol("ROLE_CONTEO_SIN_USUARIOS", "Rol sin usuarios"));

        crearUsuarioConRol("conteo.uno", docente);
        crearUsuarioConRol("conteo.dos", docente);
        crearUsuarioConRol("conteo.tres", estudiante);

        Map<Long, Long> totales = usuarioRepository.countUsuariosPorRol().stream()
                .filter(conteo -> conteo.getRolId() != null)
                .collect(Collectors.toMap(ProyeccionConteoRol::getRolId, ProyeccionConteoRol::getTotal));

        assertEquals(2L, totales.get(docente.getId()));
        assertEquals(1L, totales.get(estudiante.getId()));
        assertFalse(totales.containsKey(rolRepository.findByName("ROLE_CONTEO_SIN_USUARIOS").orElseThrow().getId()));
    }

    @Test
    @DisplayName("countByRoleId cuenta solo los usuarios del rol solicitado")
    void cuentaUsuariosDeUnRol() {
        Rol docente = rolRepository.saveAndFlush(new Rol("ROLE_CONTEO_UNO", "Docente"));
        Rol estudiante = rolRepository.saveAndFlush(new Rol("ROLE_CONTEO_DOS", "Estudiante"));

        crearUsuarioConRol("rol.uno", docente);
        crearUsuarioConRol("rol.dos", estudiante);

        assertEquals(1L, usuarioRepository.countByRoleId(docente.getId()));
        assertEquals(1L, usuarioRepository.countByRoleId(estudiante.getId()));
        assertEquals(0L, usuarioRepository.countByRoleId(999_999L));
    }
}
