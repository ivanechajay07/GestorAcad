package com.gestoracad.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Configuración de auditoría automática de JPA.
 * Habilita el relleno de campos de auditoría (creación/modificación) usando el
 * auditor resuelto por {@code auditorActualImpl}.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorActualImpl")
public class ConfiguracionAuditoriaJpa {
}
