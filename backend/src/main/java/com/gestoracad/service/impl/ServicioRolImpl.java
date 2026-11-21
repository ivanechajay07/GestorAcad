package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoPermiso;
import com.gestoracad.dto.DtoSolicitudPermiso;
import com.gestoracad.dto.DtoRol;
import com.gestoracad.dto.DtoSolicitudRol;
import com.gestoracad.entity.Permiso;
import com.gestoracad.entity.Rol;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorRol;
import com.gestoracad.repository.ProyeccionConteoRol;
import com.gestoracad.repository.RepositorioPermiso;
import com.gestoracad.repository.RepositorioRol;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioRol;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de roles y permisos.
 * Normaliza los nombres, verifica la unicidad, resuelve los permisos por identificador
 * y registra cada operación en la auditoría. Protege el rol base del sistema.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioRolImpl implements ServicioRol {

    private static final String BASE_ROLE = "ROLE_UNIVERSIDAD";

    private final RepositorioRol roleRepository;
    private final RepositorioPermiso permissionRepository;
    private final RepositorioUsuario userRepository;
    private final MapeadorRol roleMapper;
    private final ServicioAuditoria auditService;

    public ServicioRolImpl(RepositorioRol roleRepository,
                           RepositorioPermiso permissionRepository,
                           RepositorioUsuario userRepository,
                           MapeadorRol roleMapper,
                           ServicioAuditoria auditService) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
        this.roleMapper = roleMapper;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoRol> getAllRoles() {
        Map<Long, Long> usuariosPorRol = userRepository.countUsuariosPorRol()
                .stream()
                .filter(conteo -> conteo.getRolId() != null)
                .collect(Collectors.toMap(ProyeccionConteoRol::getRolId, ProyeccionConteoRol::getTotal));

        return roleRepository.findAll()
                .stream()
                .map(roleMapper::toDto)
                .peek(dto -> dto.setUsuarios(usuariosPorRol.getOrDefault(dto.getId(), 0L)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoPermiso> getAllPermissions() {
        return permissionRepository.findAll()
                .stream()
                .map(p -> new DtoPermiso(p.getId(), p.getName(), p.getModule(), p.getDescription()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoRol getRoleByName(String name) {
        DtoRol role = roleRepository.findByName(name)
                .map(roleMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Rol", "nombre", name));
        role.setUsuarios(userRepository.countByRoleId(role.getId()));
        return role;
    }

    @Override
    @Transactional
    public DtoRol createRole(DtoSolicitudRol request, String clientIp) {
        String name = normalizeName(request.getName());
        if (roleRepository.existsByName(name)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, "ROL",
                    "Intento fallido de crear rol duplicado: " + name,
                    "/api/v1/roles", "POST", clientIp, "FAILURE");
            throw new ExcepcionApi("El rol '" + name + "' ya se encuentra registrado");
        }

        Rol role = new Rol(name, request.getDescription().trim());
        role.setPermissions(resolvePermissions(request.getPermissionIds()));
        Rol saved = roleRepository.save(role);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, "ROL",
                "Rol creado exitosamente: " + name + " con " + saved.getPermissions().size() + " permisos",
                "/api/v1/roles", "POST", clientIp, "SUCCESS", null, "tb_roles", saved.getId());

        return roleMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoRol updateRole(Long id, DtoSolicitudRol request, String clientIp) {
        Rol role = roleRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Rol", "id", id));

        String name = normalizeName(request.getName());
        roleRepository.findByName(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ExcepcionApi("El rol '" + name + "' ya se encuentra registrado");
            }
        });

        role.setName(name);
        role.setDescription(request.getDescription().trim());
        role.setPermissions(resolvePermissions(request.getPermissionIds()));
        Rol saved = roleRepository.save(role);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, "ROL",
                "Rol actualizado: " + name + " con " + saved.getPermissions().size() + " permisos",
                "/api/v1/roles/" + id, "PUT", clientIp, "SUCCESS", null, "tb_roles", saved.getId());

        return roleMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deleteRole(Long id, String clientIp) {
        Rol role = roleRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Rol", "id", id));

        if (BASE_ROLE.equals(role.getName())) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, "ROL",
                    "Intento fallido de eliminar el rol base " + BASE_ROLE,
                    "/api/v1/roles/" + id, "DELETE", clientIp, "FAILURE", null, "tb_roles", id);
            throw new ExcepcionApi("No se puede eliminar el rol base " + BASE_ROLE);
        }

        long asignados = userRepository.countByRoleId(id);
        if (asignados > 0) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, "ROL",
                    "Intento fallido de eliminar el rol " + role.getName() + " con " + asignados + " usuarios asignados",
                    "/api/v1/roles/" + id, "DELETE", clientIp, "FAILURE", null, "tb_roles", id);
            throw new ExcepcionApi("No se puede eliminar el rol '" + role.getName() + "' porque tiene "
                    + asignados + (asignados == 1 ? " usuario asignado" : " usuarios asignados")
                    + ". Reasigna esos usuarios antes de continuar.");
        }

        roleRepository.delete(role);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, "ROL",
                "Rol eliminado: " + role.getName(),
                "/api/v1/roles/" + id, "DELETE", clientIp, "SUCCESS", null, "tb_roles", id);
    }

    @Override
    @Transactional
    public DtoPermiso createPermission(DtoSolicitudPermiso request, String clientIp) {
        String name = normalizePermissionName(request.getName());
        if (permissionRepository.existsByName(name)) {
            auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, "PERMISO",
                    "Intento fallido de crear permiso duplicado: " + name,
                    "/api/v1/roles/permissions", "POST", clientIp, "FAILURE");
            throw new ExcepcionApi("El permiso '" + name + "' ya se encuentra registrado");
        }

        Permiso permission = new Permiso(name, request.getModule().trim().toUpperCase(), request.getDescription().trim());
        Permiso saved = permissionRepository.save(permission);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.CREATE, "PERMISO",
                "Permiso creado: " + name,
                "/api/v1/roles/permissions", "POST", clientIp, "SUCCESS", null, "tb_permisos", saved.getId());

        return new DtoPermiso(saved.getId(), saved.getName(), saved.getModule(), saved.getDescription());
    }

    @Override
    @Transactional
    public DtoPermiso updatePermission(Long id, DtoSolicitudPermiso request, String clientIp) {
        Permiso permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Permiso", "id", id));

        String name = normalizePermissionName(request.getName());
        permissionRepository.findByName(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ExcepcionApi("El permiso '" + name + "' ya se encuentra registrado");
            }
        });

        permission.setName(name);
        permission.setModule(request.getModule().trim().toUpperCase());
        permission.setDescription(request.getDescription().trim());
        Permiso saved = permissionRepository.save(permission);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.UPDATE, "PERMISO",
                "Permiso actualizado: " + name,
                "/api/v1/roles/permissions/" + id, "PUT", clientIp, "SUCCESS", null, "tb_permisos", saved.getId());

        return new DtoPermiso(saved.getId(), saved.getName(), saved.getModule(), saved.getDescription());
    }

    @Override
    @Transactional
    public void deletePermission(Long id, String clientIp) {
        Permiso permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Permiso", "id", id));

        // Desasociar el permiso de todos los roles para preservar la integridad referencial
        for (Rol role : roleRepository.findAll()) {
            if (role.getPermissions().removeIf(p -> p.getId().equals(id))) {
                roleRepository.save(role);
            }
        }

        permissionRepository.delete(permission);

        auditService.log(UtilidadesSeguridad.getCurrentUsername(), AccionAuditoria.DELETE, "PERMISO",
                "Permiso eliminado: " + permission.getName(),
                "/api/v1/roles/permissions/" + id, "DELETE", clientIp, "SUCCESS", null, "tb_permisos", id);
    }

    private Set<Permiso> resolvePermissions(List<Long> permissionIds) {
        Set<Permiso> permissions = new HashSet<>();
        if (permissionIds != null) {
            for (Long permissionId : permissionIds) {
                Permiso permission = permissionRepository.findById(permissionId)
                        .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Permiso", "id", permissionId));
                permissions.add(permission);
            }
        }
        return permissions;
    }

    private String normalizeName(String raw) {
        String value = raw == null ? "" : raw.trim().toUpperCase().replace(' ', '_');
        if (!value.startsWith("ROLE_")) {
            value = "ROLE_" + value;
        }
        return value;
    }

    private String normalizePermissionName(String raw) {
        return raw == null ? "" : raw.trim().toUpperCase().replace(' ', '_');
    }
}
