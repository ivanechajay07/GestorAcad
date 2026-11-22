package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoRespuestaLogin;
import com.gestoracad.dto.DtoSolicitudLogin;
import com.gestoracad.entity.Permiso;
import com.gestoracad.entity.Rol;
import com.gestoracad.entity.Usuario;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.mapper.MapeadorUsuario;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.ProveedorTokenJwt;
import com.gestoracad.security.RegistroTokensRevocados;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioAutenticacion;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de autenticación.
 * Valida credenciales, aplica el bloqueo por intentos fallidos, emite los tokens
 * de acceso y de refresco con roles y permisos, rota los tokens de refresco y
 * registra el latido de presencia del usuario.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioAutenticacionImpl implements ServicioAutenticacion {

    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final ProveedorTokenJwt jwtTokenProvider;
    private final RepositorioUsuario userRepository;
    private final MapeadorUsuario userMapper;
    private final ServicioAuditoria auditService;
    private final PasswordEncoder passwordEncoder;
    private final RegistroTokensRevocados revokedTokens;

    public ServicioAutenticacionImpl(ProveedorTokenJwt jwtTokenProvider,
                                     RepositorioUsuario userRepository,
                                     MapeadorUsuario userMapper,
                                     ServicioAuditoria auditService,
                                     PasswordEncoder passwordEncoder,
                                     RegistroTokensRevocados revokedTokens) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.auditService = auditService;
        this.passwordEncoder = passwordEncoder;
        this.revokedTokens = revokedTokens;
    }

    @Override
    @Transactional(noRollbackFor = ExcepcionApi.class)
    public DtoRespuestaLogin login(DtoSolicitudLogin loginRequestDto, String clientIp, String userAgent) {
        String usernameOrEmail = loginRequestDto.getUsernameOrEmail().trim();
        Optional<Usuario> userOpt = findUser(usernameOrEmail);

        if (userOpt.isEmpty()) {
            auditService.log(usernameOrEmail, AccionAuditoria.LOGIN, "SEGURIDAD", "Intento de login con usuario inexistente: " + usernameOrEmail, "/api/v1/auth/login", "POST", clientIp, "FAILURE", userAgent, "tb_usuarios", null);
            throw new ExcepcionApi("Credenciales inválidas", HttpStatus.UNAUTHORIZED);
        }

        Usuario user = userOpt.get();

        if (!user.isActive()) {
            auditService.log(user.getUsername(), AccionAuditoria.LOGIN, "SEGURIDAD", "Intento de login a cuenta deshabilitada: " + user.getUsername(), "/api/v1/auth/login", "POST", clientIp, "FAILURE", userAgent, "tb_usuarios", user.getId());
            throw new ExcepcionApi("La cuenta está deshabilitada. Contacte al administrador.", HttpStatus.FORBIDDEN);
        }

        if (isLocked(user)) {
            long minutes = remainingLockMinutes(user);
            String message = minutes > 0
                    ? "Cuenta bloqueada temporalmente por " + user.getFailedAttempts()
                        + " intentos fallidos. Intenta nuevamente en " + minutes
                        + (minutes == 1 ? " minuto." : " minutos.")
                    : "Cuenta bloqueada. Contacte al administrador.";
            auditService.log(user.getUsername(), AccionAuditoria.LOGIN, "SEGURIDAD", "Intento de login a cuenta bloqueada por intentos fallidos: " + user.getUsername(), "/api/v1/auth/login", "POST", clientIp, "FAILURE", userAgent, "tb_usuarios", user.getId());
            throw new ExcepcionApi(message, HttpStatus.LOCKED);
        }

        if (!passwordEncoder.matches(loginRequestDto.getPassword(), user.getPasswordHash())) {
            int attempts = registerFailedAttempt(user, clientIp, userAgent);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                throw new ExcepcionApi(
                        "Cuenta bloqueada temporalmente por " + MAX_FAILED_ATTEMPTS
                                + " intentos fallidos. Intenta nuevamente en 15 minutos.",
                        HttpStatus.LOCKED);
            }
            throw new ExcepcionApi(
                    "Credenciales inválidas. Intento " + attempts + " de " + MAX_FAILED_ATTEMPTS
                            + ". Te quedan " + (MAX_FAILED_ATTEMPTS - attempts) + " intento(s).",
                    HttpStatus.UNAUTHORIZED);
        }

        String accessToken = jwtTokenProvider.generateToken(user.getUsername());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUsername());

        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setAccountLocked(false);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        DtoRespuestaLogin response = construirRespuesta(user, accessToken, refreshToken);

        auditService.log(user.getUsername(), AccionAuditoria.LOGIN, "SEGURIDAD", "Inicio de sesión exitoso: " + user.getUsername(), "/api/v1/auth/login", "POST", clientIp, "SUCCESS", userAgent, "tb_usuarios", user.getId());
        SecurityContextHolder.clearContext();
        return response;
    }

    @Override
    @Transactional
    public DtoRespuestaLogin refresh(String refreshToken, String clientIp, String userAgent) {
        if (refreshToken == null || refreshToken.isBlank()
                || !jwtTokenProvider.validateToken(refreshToken)
                || !ProveedorTokenJwt.TIPO_REFRESCO.equals(jwtTokenProvider.extractTipoToken(refreshToken))) {
            auditService.log("SISTEMA", AccionAuditoria.LOGIN, "SEGURIDAD", "Intento de renovación con token de refresco inválido", "/api/v1/auth/refresh", "POST", clientIp, "FAILURE", userAgent, "tb_usuarios", null);
            throw new ExcepcionApi("Token de refresco inválido o expirado", HttpStatus.UNAUTHORIZED);
        }

        String username = jwtTokenProvider.extractUsername(refreshToken);
        String jti = jwtTokenProvider.extractJti(refreshToken);

        if (revokedTokens.estaRevocado(jti)) {
            auditService.log(username, AccionAuditoria.LOGIN, "SEGURIDAD", "Intento de reutilizar un token de refresco revocado: " + username, "/api/v1/auth/refresh", "POST", clientIp, "FAILURE", userAgent, "tb_usuarios", null);
            throw new ExcepcionApi("Token de refresco revocado", HttpStatus.UNAUTHORIZED);
        }

        Usuario user = userRepository.findByUsernameWithRolesAndPermissions(username)
                .orElseThrow(() -> new ExcepcionApi("Token de refresco inválido", HttpStatus.UNAUTHORIZED));

        if (!user.isActive()) {
            auditService.log(username, AccionAuditoria.LOGIN, "SEGURIDAD", "Intento de renovación de una cuenta deshabilitada: " + username, "/api/v1/auth/refresh", "POST", clientIp, "FAILURE", userAgent, "tb_usuarios", user.getId());
            throw new ExcepcionApi("La cuenta está deshabilitada. Contacte al administrador.", HttpStatus.FORBIDDEN);
        }

        // Rotación: el token usado queda revocado y se emite uno nuevo.
        revokedTokens.revocar(jti, jwtTokenProvider.extractExpiration(refreshToken).toInstant());

        String nuevoAcceso = jwtTokenProvider.generateToken(username);
        String nuevoRefresco = jwtTokenProvider.generateRefreshToken(username);
        DtoRespuestaLogin response = construirRespuesta(user, nuevoAcceso, nuevoRefresco);

        auditService.log(username, AccionAuditoria.LOGIN, "SEGURIDAD", "Token de acceso renovado correctamente: " + username, "/api/v1/auth/refresh", "POST", clientIp, "SUCCESS", userAgent, "tb_usuarios", user.getId());
        return response;
    }

    @Override
    @Transactional
    public void logout(String username, String clientIp, String userAgent) {
        auditService.log(username, AccionAuditoria.LOGOUT, "SEGURIDAD", "Cierre de sesión: " + username, "/api/v1/auth/logout", "POST", clientIp, "SUCCESS", userAgent, "tb_usuarios", null);
        SecurityContextHolder.clearContext();
    }

    @Override
    public void revocarTokenRefresco(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank() || !jwtTokenProvider.validateToken(refreshToken)) {
            return;
        }
        if (ProveedorTokenJwt.TIPO_REFRESCO.equals(jwtTokenProvider.extractTipoToken(refreshToken))) {
            revokedTokens.revocar(jwtTokenProvider.extractJti(refreshToken),
                    jwtTokenProvider.extractExpiration(refreshToken).toInstant());
        }
    }

    @Override
    @Transactional
    public void heartbeat(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    private DtoRespuestaLogin construirRespuesta(Usuario user, String accessToken, String refreshToken) {
        Set<String> roles = user.getRoles().stream().map(Rol::getName).collect(Collectors.toSet());
        Set<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permiso::getName)
                .collect(Collectors.toSet());

        DtoRespuestaLogin response = new DtoRespuestaLogin();
        response.setToken(accessToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(jwtTokenProvider.getJwtExpirationMs());
        response.setRefreshToken(refreshToken);
        response.setRefreshExpiresIn(jwtTokenProvider.getRefreshExpirationMs());
        response.setUser(userMapper.toDto(user));
        response.setRoles(roles);
        response.setPermissions(permissions);
        return response;
    }

    private Optional<Usuario> findUser(String usernameOrEmail) {
        String identifier = usernameOrEmail.toLowerCase(Locale.ROOT);
        Optional<Usuario> user = userRepository.findByUsername(usernameOrEmail);
        if (user.isEmpty()) {
            user = userRepository.findByEmail(identifier);
        }
        return user;
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email, String clientIp, String userAgent) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        Optional<Usuario> user = normalized.isEmpty() ? Optional.empty() : userRepository.findByEmail(normalized);
        if (user.isPresent()) {
            auditService.log(user.get().getUsername(), AccionAuditoria.LOGIN, "SEGURIDAD",
                    "Solicitud de restablecimiento de contraseña registrada para: " + normalized,
                    "/api/v1/auth/forgot-password", "POST", clientIp, "SUCCESS", userAgent,
                    "tb_usuarios", user.get().getId());
        } else {
            auditService.log(normalized, AccionAuditoria.LOGIN, "SEGURIDAD",
                    "Solicitud de restablecimiento para correo no registrado: " + normalized,
                    "/api/v1/auth/forgot-password", "POST", clientIp, "FAILURE", userAgent,
                    "tb_usuarios", null);
        }
    }

    private boolean isLocked(Usuario user) {
        LocalDateTime now = LocalDateTime.now();
        if (user.getLockedUntil() != null && !user.getLockedUntil().isAfter(now)) {
            user.setAccountLocked(false);
            user.setFailedAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
            return false;
        }
        return user.isAccountLocked()
                || (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now));
    }

    private long remainingLockMinutes(Usuario user) {
        if (user.getLockedUntil() == null) {
            return 0;
        }
        long seconds = Duration.between(LocalDateTime.now(), user.getLockedUntil()).getSeconds();
        return seconds <= 0 ? 0 : Math.max(1, (seconds + 59) / 60);
    }

    private int registerFailedAttempt(Usuario user, String clientIp, String userAgent) {
        int attempts = user.getFailedAttempts() + 1;
        user.setFailedAttempts(attempts);

        boolean shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
        if (shouldLock) {
            user.setAccountLocked(true);
            user.setLockedUntil(LocalDateTime.now().plusMinutes(15));
        }
        userRepository.save(user);

        String description = shouldLock
                ? "Cuenta bloqueada tras " + attempts + " intentos fallidos: " + user.getUsername()
                : "Intento de login fallido (" + attempts + "/" + MAX_FAILED_ATTEMPTS + ") para: " + user.getUsername();

        auditService.log(user.getUsername(), AccionAuditoria.LOGIN, "SEGURIDAD", description, "/api/v1/auth/login", "POST", clientIp, "FAILURE", userAgent, "tb_usuarios", user.getId());
        return attempts;
    }
}
