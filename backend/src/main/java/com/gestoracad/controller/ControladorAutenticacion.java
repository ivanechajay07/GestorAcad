package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoCambiarContrasena;
import com.gestoracad.dto.DtoSolicitudLogin;
import com.gestoracad.dto.DtoRespuestaLogin;
import com.gestoracad.dto.DtoSolicitudRefreshToken;
import com.gestoracad.dto.DtoActualizarPerfil;
import com.gestoracad.dto.DtoRespuestaUsuario;
import com.gestoracad.security.ProveedorTokenJwt;
import com.gestoracad.service.ServicioAutenticacion;
import com.gestoracad.service.ServicioUsuario;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST de autenticación.
 * Expone login, logout, perfil, cambio de contraseña, actualización de perfil y
 * el latido de presencia del usuario autenticado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación", description = "Endpoints de autenticación, login, logout, perfil y cambio de contraseña")
public class ControladorAutenticacion {

    private final ServicioAutenticacion authService;
    private final ServicioUsuario userService;
    private final ProveedorTokenJwt jwtTokenProvider;

    public ControladorAutenticacion(ServicioAutenticacion authService, ServicioUsuario userService, ProveedorTokenJwt jwtTokenProvider) {
        this.authService = authService;
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica al usuario con username o email y contraseña, retorna token JWT con roles y permisos")
    public ResponseEntity<DtoRespuestaApi<DtoRespuestaLogin>> login(
            @Valid @RequestBody DtoSolicitudLogin loginRequestDto,
            HttpServletRequest request) {
        DtoRespuestaLogin response = authService.login(loginRequestDto, request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.ok(DtoRespuestaApi.ok(response, "Inicio de sesión exitoso"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar token de acceso", description = "Valida el token de refresco, lo rota y emite un nuevo par de tokens JWT")
    public ResponseEntity<DtoRespuestaApi<DtoRespuestaLogin>> refresh(
            @Valid @RequestBody DtoSolicitudRefreshToken refreshRequest,
            HttpServletRequest request) {
        DtoRespuestaLogin response = authService.refresh(refreshRequest.getRefreshToken(), request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.ok(DtoRespuestaApi.ok(response, "Token renovado correctamente"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión", description = "Cierra la sesión del usuario autenticado, revoca el token de refresco y registra el evento en auditoría")
    public ResponseEntity<DtoRespuestaApi<Void>> logout(
            Authentication authentication,
            @Valid @RequestBody(required = false) DtoSolicitudRefreshToken refreshRequest,
            HttpServletRequest request) {
        if (refreshRequest != null && refreshRequest.getRefreshToken() != null) {
            authService.revocarTokenRefresco(refreshRequest.getRefreshToken());
        }
        if (authentication != null && authentication.isAuthenticated()) {
            authService.logout(authentication.getName(), request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
        }
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Sesión cerrada correctamente"));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener perfil del usuario autenticado", description = "Devuelve el perfil, roles y permisos del usuario del token JWT actual")
    public ResponseEntity<DtoRespuestaApi<DtoRespuestaUsuario>> getCurrentUser(Authentication authentication, HttpServletRequest request) {
        String username = resolveUsername(authentication, request);
        DtoRespuestaUsuario user = userService.getUserByUsername(username);
        return ResponseEntity.ok(DtoRespuestaApi.ok(user, "Perfil obtenido correctamente"));
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cambiar contraseña", description = "Permite al usuario autenticado cambiar su contraseña validando la contraseña actual")
    public ResponseEntity<DtoRespuestaApi<Void>> changePassword(
            @Valid @RequestBody DtoCambiarContrasena changePasswordDto,
            Authentication authentication,
            HttpServletRequest request) {
        String username = resolveUsername(authentication, request);
        userService.changePassword(username, changePasswordDto, request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Contraseña actualizada correctamente"));
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Actualizar perfil propio", description = "Permite al usuario autenticado actualizar sus datos personales y avatar")
    public ResponseEntity<DtoRespuestaApi<DtoRespuestaUsuario>> updateProfile(
            @Valid @RequestBody DtoActualizarPerfil updateDto,
            Authentication authentication,
            HttpServletRequest request) {
        String username = resolveUsername(authentication, request);
        DtoRespuestaUsuario updated = userService.updateOwnProfile(username, updateDto, request.getRemoteAddr());
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Perfil actualizado correctamente"));
    }

    @PostMapping("/heartbeat")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Latido de presencia", description = "Actualiza la última conexión del usuario autenticado")
    public ResponseEntity<DtoRespuestaApi<Void>> heartbeat(Authentication authentication, HttpServletRequest request) {
        String username = resolveUsername(authentication, request);
        authService.heartbeat(username);
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "OK"));
    }

    private String resolveUsername(Authentication authentication, HttpServletRequest request) {
        String bearer = extractBearerToken(request);
        if (!bearer.isEmpty()) {
            return jwtTokenProvider.extractUsername(bearer);
        }
        return authentication.getName();
    }

    private String extractBearerToken(HttpServletRequest request) {
        String bearer = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return "";
    }
}
