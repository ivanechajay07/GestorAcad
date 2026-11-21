package com.gestoracad.service;

import com.gestoracad.dto.DtoRespuestaLogin;
import com.gestoracad.dto.DtoRespuestaUsuario;
import com.gestoracad.dto.DtoSolicitudLogin;
import com.gestoracad.entity.Permiso;
import com.gestoracad.entity.Rol;
import com.gestoracad.entity.Usuario;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorUsuario;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.ProveedorTokenJwt;
import com.gestoracad.security.RegistroTokensRevocados;
import com.gestoracad.service.impl.ServicioAutenticacionImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pruebas unitarias del servicio de autenticación (TDD).
 * Aíslan la lógica de negocio con Mockito para validar credenciales, bloqueo de
 * cuentas, auditoría y emisión de tokens sin depender de la base de datos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@ExtendWith(MockitoExtension.class)
class ServicioAutenticacionTest {

    private static final String PASSWORD = "ClaveSegura2026!";
    private static final String HASH = "$2a$10$hashbcryptdeprueba";

    @Mock
    private ProveedorTokenJwt jwtTokenProvider;

    @Mock
    private RepositorioUsuario userRepository;

    @Mock
    private MapeadorUsuario userMapper;

    @Mock
    private ServicioAuditoria auditService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RegistroTokensRevocados revokedTokens;

    @InjectMocks
    private ServicioAutenticacionImpl authService;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        Permiso permiso = new Permiso("USUARIO_VIEW", "USUARIO", "Ver usuarios");
        Rol rol = new Rol("ROLE_UNIVERSIDAD", "Rol base del sistema");
        rol.setPermissions(Set.of(permiso));

        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setUsername("admin.rectoria");
        usuario.setEmail("admin@gestoracad.edu");
        usuario.setPasswordHash(HASH);
        usuario.setFirstName("Admin");
        usuario.setLastName("Rectoria");
        usuario.setActive(true);
        usuario.setRoles(Set.of(rol));
    }

    private DtoSolicitudLogin solicitud(String identificador, String password) {
        DtoSolicitudLogin dto = new DtoSolicitudLogin();
        dto.setUsernameOrEmail(identificador);
        dto.setPassword(password);
        return dto;
    }

    @Test
    @DisplayName("Login exitoso: emite token, roles y permisos, y reinicia los intentos fallidos")
    void loginExitosoEmiteTokenConAutorizaciones() {
        when(userRepository.findByUsername("admin.rectoria")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(PASSWORD, HASH)).thenReturn(true);
        when(jwtTokenProvider.generateToken("admin.rectoria")).thenReturn("jwt-de-acceso");
        when(jwtTokenProvider.generateRefreshToken("admin.rectoria")).thenReturn("jwt-de-refresco");
        when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(3_600_000L);
        when(jwtTokenProvider.getRefreshExpirationMs()).thenReturn(604_800_000L);
        when(userMapper.toDto(usuario)).thenReturn(new DtoRespuestaUsuario());

        DtoRespuestaLogin respuesta = authService.login(solicitud("admin.rectoria", PASSWORD), "127.0.0.1", "JUnit");

        assertEquals("jwt-de-acceso", respuesta.getToken());
        assertEquals("jwt-de-refresco", respuesta.getRefreshToken());
        assertEquals("Bearer", respuesta.getTokenType());
        assertEquals(3_600_000L, respuesta.getExpiresIn());
        assertEquals(604_800_000L, respuesta.getRefreshExpiresIn());
        assertTrue(respuesta.getRoles().contains("ROLE_UNIVERSIDAD"));
        assertTrue(respuesta.getPermissions().contains("USUARIO_VIEW"));
        assertEquals(0, usuario.getFailedAttempts());
        verify(userRepository).save(usuario);
    }

    @Test
    @DisplayName("Contraseña incorrecta: incrementa el contador de intentos fallidos y devuelve 401")
    void passwordIncorrectaIncrementaIntentos() {
        when(userRepository.findByUsername("admin.rectoria")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(PASSWORD, HASH)).thenReturn(false);

        ExcepcionApi excepcion = assertThrows(ExcepcionApi.class,
                () -> authService.login(solicitud("admin.rectoria", PASSWORD), "127.0.0.1", "JUnit"));

        assertEquals(HttpStatus.UNAUTHORIZED, excepcion.getStatus());
        assertEquals(1, usuario.getFailedAttempts());
        verify(userRepository).save(usuario);
        verify(jwtTokenProvider, never()).generateToken(anyString());
    }

    @Test
    @DisplayName("Cuenta bloqueada: rechaza el acceso con 403 sin verificar la contraseña")
    void cuentaBloqueadaRechazaAcceso() {
        usuario.setAccountLocked(true);
        when(userRepository.findByUsername("admin.rectoria")).thenReturn(Optional.of(usuario));

        ExcepcionApi excepcion = assertThrows(ExcepcionApi.class,
                () -> authService.login(solicitud("admin.rectoria", PASSWORD), "127.0.0.1", "JUnit"));

        assertEquals(HttpStatus.FORBIDDEN, excepcion.getStatus());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("Usuario inexistente: devuelve 401 y registra el intento en auditoría")
    void usuarioInexistenteDevuelveNoAutorizado() {
        when(userRepository.findByUsername("desconocido")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("desconocido")).thenReturn(Optional.empty());

        ExcepcionApi excepcion = assertThrows(ExcepcionApi.class,
                () -> authService.login(solicitud("desconocido", PASSWORD), "127.0.0.1", "JUnit"));

        assertEquals(HttpStatus.UNAUTHORIZED, excepcion.getStatus());
        verify(auditService).log(anyString(), any(), anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), any(), any(), any());
        assertFalse(usuario.isAccountLocked());
    }

    @Test
    @DisplayName("Refresh válido: rota el token, revoca el jti usado y emite un nuevo par de tokens")
    void refreshValidoRotaYRevocaTokenAnterior() {
        Date expiracion = new Date(System.currentTimeMillis() + 600_000L);
        when(jwtTokenProvider.validateToken("refresh-antiguo")).thenReturn(true);
        when(jwtTokenProvider.extractTipoToken("refresh-antiguo")).thenReturn(ProveedorTokenJwt.TIPO_REFRESCO);
        when(jwtTokenProvider.extractUsername("refresh-antiguo")).thenReturn("admin.rectoria");
        when(jwtTokenProvider.extractJti("refresh-antiguo")).thenReturn("jti-antiguo");
        when(jwtTokenProvider.extractExpiration("refresh-antiguo")).thenReturn(expiracion);
        when(revokedTokens.estaRevocado("jti-antiguo")).thenReturn(false);
        when(userRepository.findByUsernameWithRolesAndPermissions("admin.rectoria")).thenReturn(Optional.of(usuario));
        when(jwtTokenProvider.generateToken("admin.rectoria")).thenReturn("jwt-de-acceso-nuevo");
        when(jwtTokenProvider.generateRefreshToken("admin.rectoria")).thenReturn("refresh-nuevo");
        when(jwtTokenProvider.getJwtExpirationMs()).thenReturn(3_600_000L);
        when(jwtTokenProvider.getRefreshExpirationMs()).thenReturn(604_800_000L);
        when(userMapper.toDto(usuario)).thenReturn(new DtoRespuestaUsuario());

        DtoRespuestaLogin respuesta = authService.refresh("refresh-antiguo", "127.0.0.1", "JUnit");

        assertEquals("jwt-de-acceso-nuevo", respuesta.getToken());
        assertEquals("refresh-nuevo", respuesta.getRefreshToken());
        verify(revokedTokens).revocar("jti-antiguo", expiracion.toInstant());
        verify(userRepository, never()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("Refresh con token revocado: devuelve 401 y no emite tokens nuevos")
    void refreshConTokenRevocadoDevuelveNoAutorizado() {
        when(jwtTokenProvider.validateToken("refresh-revocado")).thenReturn(true);
        when(jwtTokenProvider.extractTipoToken("refresh-revocado")).thenReturn(ProveedorTokenJwt.TIPO_REFRESCO);
        when(jwtTokenProvider.extractUsername("refresh-revocado")).thenReturn("admin.rectoria");
        when(jwtTokenProvider.extractJti("refresh-revocado")).thenReturn("jti-revocado");
        when(revokedTokens.estaRevocado("jti-revocado")).thenReturn(true);

        ExcepcionApi excepcion = assertThrows(ExcepcionApi.class,
                () -> authService.refresh("refresh-revocado", "127.0.0.1", "JUnit"));

        assertEquals(HttpStatus.UNAUTHORIZED, excepcion.getStatus());
        verify(jwtTokenProvider, never()).generateToken(anyString());
        verify(jwtTokenProvider, never()).generateRefreshToken(anyString());
    }

    @Test
    @DisplayName("Refresh con un token de acceso: se rechaza porque el tipo no es refresh")
    void refreshConTokenDeAccesoEsRechazado() {
        when(jwtTokenProvider.validateToken("jwt-de-acceso")).thenReturn(true);
        when(jwtTokenProvider.extractTipoToken("jwt-de-acceso")).thenReturn(ProveedorTokenJwt.TIPO_ACCESO);

        ExcepcionApi excepcion = assertThrows(ExcepcionApi.class,
                () -> authService.refresh("jwt-de-acceso", "127.0.0.1", "JUnit"));

        assertEquals(HttpStatus.UNAUTHORIZED, excepcion.getStatus());
        verify(revokedTokens, never()).estaRevocado(anyString());
    }
}
