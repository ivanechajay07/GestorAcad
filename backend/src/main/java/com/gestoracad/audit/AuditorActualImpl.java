package com.gestoracad.audit;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Resuelve el auditor actual para la auditoría automática de JPA.
 * Devuelve el usuario autenticado en el contexto de seguridad o "SISTEMA" si no hay sesión.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class AuditorActualImpl implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.of("SISTEMA");
        }

        return Optional.ofNullable(authentication.getName());
    }
}
