package com.gestoracad.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utilidades de seguridad para resolver el usuario autenticado en la petición actual.
 */
public final class UtilidadesSeguridad {

    private UtilidadesSeguridad() {
    }

    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return "SISTEMA";
        }
        return authentication.getName();
    }
}
