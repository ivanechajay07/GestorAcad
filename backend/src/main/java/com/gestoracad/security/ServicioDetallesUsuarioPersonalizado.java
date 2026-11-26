package com.gestoracad.security;

import com.gestoracad.entity.Usuario;
import com.gestoracad.repository.RepositorioUsuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de carga de usuarios para Spring Security.
 * Convierte un {@link Usuario} del dominio en un {@code UserDetails}, mapeando sus
 * roles y permisos a las autoridades de seguridad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioDetallesUsuarioPersonalizado implements UserDetailsService {

    private final RepositorioUsuario userRepository;

    public ServicioDetallesUsuarioPersonalizado(RepositorioUsuario userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        Usuario user = userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> userRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con username o email: " + usernameOrEmail)));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPasswordHash())
                .disabled(!user.isActive() || user.isAccountLocked())
                .accountExpired(user.isAccountExpired())
                .credentialsExpired(user.isCredentialsExpired())
                .authorities(getAuthorities(user))
                .build();
    }

    private Collection<? extends GrantedAuthority> getAuthorities(Usuario user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream()
                        .map(permission -> new SimpleGrantedAuthority(permission.getName())))
                .collect(Collectors.toList());

        user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .forEach(authorities::add);

        return authorities;
    }
}
