package com.gestoracad.service.impl;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoCambiarContrasena;
import com.gestoracad.dto.DtoActualizarPerfil;
import com.gestoracad.dto.DtoCrearUsuario;
import com.gestoracad.dto.DtoRespuestaUsuario;
import com.gestoracad.dto.DtoActualizarUsuario;
import com.gestoracad.entity.Rol;
import com.gestoracad.entity.Usuario;
import com.gestoracad.exception.ExcepcionApi;
import com.gestoracad.exception.ExcepcionRecursoNoEncontrado;
import com.gestoracad.mapper.MapeadorUsuario;
import com.gestoracad.repository.RepositorioRol;
import com.gestoracad.repository.RepositorioUsuario;
import com.gestoracad.security.UtilidadesSeguridad;
import com.gestoracad.service.ServicioAuditoria;
import com.gestoracad.service.ServicioUsuario;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de usuarios institucionales.
 * Gestiona el ciclo de vida de las cuentas, la asignación de roles, el perfil propio,
 * el cambio de contraseña y el estado de activación, con registro en auditoría.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioUsuarioImpl implements ServicioUsuario {

    private static final String BASE_ROLE = "ROLE_UNIVERSIDAD";

    private final RepositorioUsuario userRepository;
    private final RepositorioRol roleRepository;
    private final MapeadorUsuario userMapper;
    private final PasswordEncoder passwordEncoder;
    private final ServicioAuditoria auditService;

    public ServicioUsuarioImpl(RepositorioUsuario userRepository, RepositorioRol roleRepository, MapeadorUsuario userMapper, PasswordEncoder passwordEncoder, ServicioAuditoria auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DtoRespuestaUsuario> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DtoRespuestaUsuario getUserById(Long id) {
        return userRepository.findById(id)
                .map(userMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "id", id));
    }

    @Override
    @Transactional
    public DtoRespuestaUsuario createUser(DtoCrearUsuario createDto, String clientIp) {
        if (userRepository.existsByUsername(createDto.getUsername())) {
            auditService.log("SISTEMA", AccionAuditoria.CREATE, "USUARIOS", "Intento fallido de crear usuario con username duplicado: " + createDto.getUsername(), "/api/v1/users", "POST", clientIp, "FAILURE");
            throw new ExcepcionApi("El nombre de usuario '" + createDto.getUsername() + "' ya se encuentra registrado en el sistema");
        }

        if (userRepository.existsByEmail(createDto.getEmail())) {
            auditService.log("SISTEMA", AccionAuditoria.CREATE, "USUARIOS", "Intento fallido de crear usuario con email duplicado: " + createDto.getEmail(), "/api/v1/users", "POST", clientIp, "FAILURE");
            throw new ExcepcionApi("El correo electrónico '" + createDto.getEmail() + "' ya se encuentra registrado en el sistema");
        }

        ensureCanAssignBaseRole(createDto.getRoles());

        Set<Rol> assignedRoles = new HashSet<>();
        for (String roleName : createDto.getRoles()) {
            Rol role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Rol", "nombre", roleName));
            assignedRoles.add(role);
        }

        Usuario user = new Usuario();
        user.setUsername(createDto.getUsername().toLowerCase().trim());
        user.setEmail(createDto.getEmail().toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(createDto.getPassword()));
        user.setFirstName(createDto.getFirstName().trim());
        user.setLastName(createDto.getLastName().trim());
        user.setPhone(createDto.getPhone());
        user.setDepartment(createDto.getDepartment());
        user.setAvatar(createDto.getAvatar());
        user.setRoles(assignedRoles);
        user.setActive(true);

        Usuario savedUser = userRepository.save(user);

        auditService.log(savedUser.getUsername(), AccionAuditoria.CREATE, "USUARIOS", "Usuario registrado exitosamente con ID: " + savedUser.getId(), "/api/v1/users", "POST", clientIp, "SUCCESS");

        return userMapper.toDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public DtoRespuestaUsuario getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(userMapper::toDto)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "username", username));
    }

    @Override
    @Transactional
    public DtoRespuestaUsuario updateUser(Long id, DtoActualizarUsuario updateDto, String clientIp) {
        Usuario user = userRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "id", id));

        String username = updateDto.getUsername() == null ? user.getUsername() : updateDto.getUsername().toLowerCase().trim();
        if (!username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
            auditService.log(user.getUsername(), AccionAuditoria.UPDATE, "USUARIOS",
                    "Intento fallido de actualizar usuario con username duplicado: " + username,
                    "/api/v1/users/" + id, "PUT", clientIp, "FAILURE");
            throw new ExcepcionApi("El nombre de usuario '" + username + "' ya se encuentra registrado en el sistema");
        }

        String email = updateDto.getEmail().toLowerCase().trim();
        if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            auditService.log(user.getUsername(), AccionAuditoria.UPDATE, "USUARIOS",
                    "Intento fallido de actualizar usuario con email duplicado: " + email,
                    "/api/v1/users/" + id, "PUT", clientIp, "FAILURE");
            throw new ExcepcionApi("El correo electrónico '" + email + "' ya se encuentra registrado en el sistema");
        }

        ensureCanAssignBaseRole(updateDto.getRoles());
        if (user.isActive() && hasBaseRole(user) && !updateDto.getRoles().contains(BASE_ROLE)
                && userRepository.countActiveByRoleName(BASE_ROLE) <= 1) {
            throw new ExcepcionApi("No se puede retirar el rol base al último administrador activo");
        }

        Set<Rol> assignedRoles = new HashSet<>();
        for (String roleName : updateDto.getRoles()) {
            Rol role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Rol", "nombre", roleName));
            assignedRoles.add(role);
        }

        user.setFirstName(updateDto.getFirstName().trim());
        user.setLastName(updateDto.getLastName().trim());
        user.setUsername(username);
        user.setEmail(email);
        user.setPhone(updateDto.getPhone());
        user.setDepartment(updateDto.getDepartment());
        user.setRoles(assignedRoles);
        if (updateDto.getAvatar() != null) {
            user.setAvatar(updateDto.getAvatar().isEmpty() ? null : updateDto.getAvatar());
        }

        boolean passwordChanged = false;
        if (updateDto.getNewPassword() != null && !updateDto.getNewPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(updateDto.getNewPassword()));
            user.setFailedAttempts(0);
            user.setAccountLocked(false);
            user.setLockedUntil(null);
            user.setCredentialsExpired(false);
            passwordChanged = true;
        }

        Usuario saved = userRepository.save(user);

        auditService.log(saved.getUsername(), AccionAuditoria.UPDATE, "USUARIOS",
                "Usuario actualizado" + (passwordChanged ? " (contraseña restablecida)" : "") + ": " + saved.getUsername(),
                "/api/v1/users/" + id, "PUT", clientIp, "SUCCESS", null, "tb_usuarios", saved.getId());

        return userMapper.toDto(saved);
    }

    @Override
    @Transactional
    public DtoRespuestaUsuario updateOwnProfile(String username, DtoActualizarPerfil updateDto, String clientIp) {
        Usuario user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "username", username));

        user.setFirstName(updateDto.getFirstName().trim());
        user.setLastName(updateDto.getLastName().trim());
        user.setPhone(updateDto.getPhone());
        user.setDepartment(updateDto.getDepartment());
        if (updateDto.getAvatar() != null) {
            user.setAvatar(updateDto.getAvatar().isEmpty() ? null : updateDto.getAvatar());
        }

        Usuario saved = userRepository.save(user);

        auditService.log(username, AccionAuditoria.UPDATE, "SEGURIDAD", "Perfil actualizado por el propio usuario",
                "/api/v1/auth/profile", "PUT", clientIp, "SUCCESS", null, "tb_usuarios", saved.getId());

        return userMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void changePassword(String username, DtoCambiarContrasena changePasswordDto, String clientIp, String userAgent) {
        Usuario user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "username", username));

        if (!passwordEncoder.matches(changePasswordDto.getCurrentPassword(), user.getPasswordHash())) {
            auditService.log(username, AccionAuditoria.UPDATE, "SEGURIDAD", "Cambio de contraseña rechazado: contraseña actual incorrecta", "/api/v1/auth/change-password", "POST", clientIp, "FAILURE", userAgent, "tb_usuarios", user.getId());
            throw new ExcepcionApi("La contraseña actual es incorrecta", HttpStatus.UNAUTHORIZED);
        }

        if (passwordEncoder.matches(changePasswordDto.getNewPassword(), user.getPasswordHash())) {
            auditService.log(username, AccionAuditoria.UPDATE, "SEGURIDAD", "Cambio de contraseña rechazado: la nueva contraseña es igual a la actual", "/api/v1/auth/change-password", "POST", clientIp, "FAILURE", userAgent, "tb_usuarios", user.getId());
            throw new ExcepcionApi("La nueva contraseña debe ser diferente a la actual");
        }

        user.setPasswordHash(passwordEncoder.encode(changePasswordDto.getNewPassword()));
        user.setCredentialsExpired(false);
        userRepository.save(user);

        auditService.log(username, AccionAuditoria.UPDATE, "SEGURIDAD", "Contraseña actualizada exitosamente", "/api/v1/auth/change-password", "POST", clientIp, "SUCCESS", userAgent, "tb_usuarios", user.getId());
    }

    @Override
    @Transactional
    public void toggleUserStatus(Long id, boolean active, String clientIp) {
        Usuario user = userRepository.findById(id)
                .orElseThrow(() -> new ExcepcionRecursoNoEncontrado("Usuario", "id", id));

        if (!active) {
            ensureCanDisable(user);
        }

        user.setActive(active);
        userRepository.save(user);

        String accionStr = active ? "Habilitación de cuenta" : "Deshabilitación de cuenta";
        auditService.log(user.getUsername(), AccionAuditoria.UPDATE, "USUARIOS", accionStr + " para ID: " + id, "/api/v1/users/" + id + "/status", "PATCH", clientIp, "SUCCESS");
    }

    private boolean hasBaseRole(Usuario user) {
        return user.getRoles().stream().anyMatch(role -> BASE_ROLE.equals(role.getName()));
    }

    private boolean currentUserIsAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return true;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> BASE_ROLE.equals(authority.getAuthority()));
    }

    private void ensureCanAssignBaseRole(Set<String> roleNames) {
        if (roleNames != null && roleNames.contains(BASE_ROLE) && !currentUserIsAdmin()) {
            throw new ExcepcionApi("Solo un administrador puede asignar el rol base " + BASE_ROLE, HttpStatus.FORBIDDEN);
        }
    }

    private void ensureCanDisable(Usuario user) {
        if (!user.isActive()) {
            return;
        }
        String username = UtilidadesSeguridad.getCurrentUsername();
        if (!"SISTEMA".equals(username) && user.getUsername().equals(username)) {
            throw new ExcepcionApi("No puedes deshabilitar tu propia cuenta");
        }
        if (hasBaseRole(user) && userRepository.countActiveByRoleName(BASE_ROLE) <= 1) {
            throw new ExcepcionApi("No se puede deshabilitar al último administrador activo");
        }
    }
}
