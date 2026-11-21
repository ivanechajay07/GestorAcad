package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoCrearUsuario;
import com.gestoracad.dto.DtoRespuestaUsuario;
import com.gestoracad.dto.DtoActualizarUsuario;
import com.gestoracad.service.ServicioUsuario;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de usuarios institucionales.
 * Administra las cuentas, sus roles y su estado, protegido por los permisos
 * {@code USUARIO_VIEW/CREATE/EDIT/DELETE}.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Usuarios", description = "Gestión de cuentas institucionales, credenciales y perfiles")
public class ControladorUsuario {

    private final ServicioUsuario userService;

    public ControladorUsuario(ServicioUsuario userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USUARIO_VIEW')")
    @Operation(summary = "Listar todos los usuarios", description = "Obtiene el listado completo de usuarios registrados con sus roles y permisos")
    public ResponseEntity<DtoRespuestaApi<List<DtoRespuestaUsuario>>> getAllUsers() {
        List<DtoRespuestaUsuario> users = userService.getAllUsers();
        return ResponseEntity.ok(DtoRespuestaApi.ok(users, "Usuarios obtenidos exitosamente"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USUARIO_VIEW')")
    @Operation(summary = "Obtener usuario por ID", description = "Devuelve el detalle del usuario sin exponer su contraseña")
    public ResponseEntity<DtoRespuestaApi<DtoRespuestaUsuario>> getUserById(@PathVariable Long id) {
        DtoRespuestaUsuario user = userService.getUserById(id);
        return ResponseEntity.ok(DtoRespuestaApi.ok(user, "Usuario encontrado"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USUARIO_CREATE')")
    @Operation(summary = "Crear nuevo usuario", description = "Registra un usuario cifrando su contraseña con BCrypt y asociando roles válidos")
    public ResponseEntity<DtoRespuestaApi<DtoRespuestaUsuario>> createUser(
            @Valid @RequestBody DtoCrearUsuario createDto,
            HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        DtoRespuestaUsuario created = userService.createUser(createDto, clientIp);
        return new ResponseEntity<>(
                DtoRespuestaApi.ok(created, "Usuario registrado exitosamente"),
                HttpStatus.CREATED
        );
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('USUARIO_EDIT')")
    @Operation(summary = "Habilitar/Deshabilitar usuario", description = "Actualiza el estado de activación de la cuenta de usuario")
    public ResponseEntity<DtoRespuestaApi<Void>> toggleStatus(
            @PathVariable Long id,
            @RequestParam boolean active,
            HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        userService.toggleUserStatus(id, active, clientIp);
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Estado de usuario actualizado correctamente"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USUARIO_EDIT')")
    @Operation(summary = "Actualizar usuario", description = "Actualiza datos, roles, avatar y opcionalmente la contraseña del usuario")
    public ResponseEntity<DtoRespuestaApi<DtoRespuestaUsuario>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody DtoActualizarUsuario updateDto,
            HttpServletRequest request) {
        DtoRespuestaUsuario updated = userService.updateUser(id, updateDto, request.getRemoteAddr());
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Usuario actualizado exitosamente"));
    }
}
