package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoPermiso;
import com.gestoracad.dto.DtoSolicitudPermiso;
import com.gestoracad.dto.DtoRol;
import com.gestoracad.dto.DtoSolicitudRol;
import com.gestoracad.service.ServicioRol;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de roles y permisos (RBAC).
 * Expone el catálogo de roles y permisos y su mantenimiento, protegido por los
 * permisos {@code ROL_VIEW/CREATE/EDIT/DELETE}.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/roles")
@Tag(name = "Roles y Permisos", description = "Catálogo de roles institucionales y permisos granulares")
public class ControladorRol {

    private final ServicioRol roleService;

    public ControladorRol(ServicioRol roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROL_VIEW')")
    @Operation(summary = "Listar roles", description = "Devuelve el catálogo de roles y los permisos asociados a cada uno")
    public ResponseEntity<DtoRespuestaApi<List<DtoRol>>> getAllRoles() {
        List<DtoRol> roles = roleService.getAllRoles();
        return ResponseEntity.ok(DtoRespuestaApi.ok(roles, "Roles obtenidos exitosamente"));
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('ROL_VIEW')")
    @Operation(summary = "Listar todos los permisos", description = "Devuelve la totalidad de permisos granulares del sistema")
    public ResponseEntity<DtoRespuestaApi<List<DtoPermiso>>> getAllPermissions() {
        List<DtoPermiso> permissions = roleService.getAllPermissions();
        return ResponseEntity.ok(DtoRespuestaApi.ok(permissions, "Permisos obtenidos exitosamente"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROL_CREATE')")
    @Operation(summary = "Crear rol", description = "Registra un rol con su descripción y permisos asociados")
    public ResponseEntity<DtoRespuestaApi<DtoRol>> createRole(
            @Valid @RequestBody DtoSolicitudRol request,
            HttpServletRequest httpRequest) {
        DtoRol created = roleService.createRole(request, httpRequest.getRemoteAddr());
        return new ResponseEntity<>(
                DtoRespuestaApi.ok(created, "Rol registrado exitosamente"),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROL_EDIT')")
    @Operation(summary = "Actualizar rol", description = "Actualiza nombre, descripción y permisos de un rol")
    public ResponseEntity<DtoRespuestaApi<DtoRol>> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody DtoSolicitudRol request,
            HttpServletRequest httpRequest) {
        DtoRol updated = roleService.updateRole(id, request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Rol actualizado exitosamente"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROL_DELETE')")
    @Operation(summary = "Eliminar rol", description = "Elimina un rol que no sea el rol base del sistema")
    public ResponseEntity<DtoRespuestaApi<Void>> deleteRole(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        roleService.deleteRole(id, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Rol eliminado exitosamente"));
    }

    @GetMapping("/{name}")
    @PreAuthorize("hasAuthority('ROL_VIEW')")
    @Operation(summary = "Obtener rol por nombre", description = "Obtiene los detalles y permisos de un rol específico")
    public ResponseEntity<DtoRespuestaApi<DtoRol>> getRoleByName(@PathVariable String name) {
        DtoRol role = roleService.getRoleByName(name);
        return ResponseEntity.ok(DtoRespuestaApi.ok(role, "Rol encontrado"));
    }

    @PostMapping("/permissions")
    @PreAuthorize("hasAuthority('ROL_CREATE')")
    @Operation(summary = "Crear permiso", description = "Registra un permiso atómico del sistema")
    public ResponseEntity<DtoRespuestaApi<DtoPermiso>> createPermission(
            @Valid @RequestBody DtoSolicitudPermiso request,
            HttpServletRequest httpRequest) {
        DtoPermiso created = roleService.createPermission(request, httpRequest.getRemoteAddr());
        return new ResponseEntity<>(
                DtoRespuestaApi.ok(created, "Permiso registrado exitosamente"),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/permissions/{id}")
    @PreAuthorize("hasAuthority('ROL_EDIT')")
    @Operation(summary = "Actualizar permiso", description = "Actualiza nombre, módulo y descripción de un permiso")
    public ResponseEntity<DtoRespuestaApi<DtoPermiso>> updatePermission(
            @PathVariable Long id,
            @Valid @RequestBody DtoSolicitudPermiso request,
            HttpServletRequest httpRequest) {
        DtoPermiso updated = roleService.updatePermission(id, request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(DtoRespuestaApi.ok(updated, "Permiso actualizado exitosamente"));
    }

    @DeleteMapping("/permissions/{id}")
    @PreAuthorize("hasAuthority('ROL_DELETE')")
    @Operation(summary = "Eliminar permiso", description = "Elimina un permiso y lo desasocia de todos los roles")
    public ResponseEntity<DtoRespuestaApi<Void>> deletePermission(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        roleService.deletePermission(id, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(DtoRespuestaApi.ok(null, "Permiso eliminado exitosamente"));
    }
}
