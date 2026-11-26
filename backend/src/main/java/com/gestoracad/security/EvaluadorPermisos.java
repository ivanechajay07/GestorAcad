package com.gestoracad.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Evalúa si el usuario autenticado en la petición actual posee un permiso.
 * <p>
 * Se usa para construir respuestas parciales (por ejemplo el resumen del panel)
 * sin acoplar la capa de servicio a anotaciones de la capa web.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class EvaluadorPermisos {

    /**
     * Indica si el usuario autenticado tiene la autoridad indicada.
     *
     * @param permiso nombre de la autoridad, por ejemplo {@code ESTUDIANTE_VIEW}
     * @return {@code true} solo si existe una autenticación real con ese permiso
     */
    public boolean tiene(String permiso) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (permiso == null
                || authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(permiso::equals);
    }
}
