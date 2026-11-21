package com.gestoracad.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Validación de configuración para el perfil de producción.
 * Impide arrancar con secretos de ejemplo, contraseñas débiles o CORS de
 * desarrollo, forzando el uso de variables de entorno seguras.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
@Profile("prod")
public class ValidacionConfiguracionProductiva {

    private static final Logger log = LoggerFactory.getLogger(ValidacionConfiguracionProductiva.class);

    private static final String SECRETO_POR_DEFECTO =
            "dGhpc0lzQVZlcnlTZWN1cmVTZWNyZXRLZXlGb3JHYXN0b3JBY2FkZW1pY29WaXJ0dWFsMjAyNg==";

    @Value("${application.security.jwt.secret-key:}")
    private String secretoJwt;

    @Value("${spring.datasource.password:}")
    private String contrasenaBd;

    @Value("${application.security.cors.allowed-origins:}")
    private String origenesPermitidos;

    @PostConstruct
    public void validar() {
        if (secretoJwt == null || secretoJwt.isBlank() || secretoJwt.length() < 32
                || SECRETO_POR_DEFECTO.equals(secretoJwt)) {
            throw new IllegalStateException(
                    "JWT_SECRET_KEY inseguro: en producción debe definir un secreto propio de al menos 32 caracteres");
        }

        if (contrasenaBd == null || contrasenaBd.isBlank()
                || contrasenaBd.contains("gestor_root_pass_2026")
                || contrasenaBd.contains("gestor_secure_pass_2026")
                || "rootpassword".equals(contrasenaBd)) {
            throw new IllegalStateException(
                    "DB_PASSWORD insegura: en producción debe definir una contraseña distinta a la de ejemplo");
        }

        if (origenesPermitidos == null || origenesPermitidos.isBlank()
                || origenesPermitidos.contains("localhost")
                || origenesPermitidos.contains("127.0.0.1")) {
            throw new IllegalStateException(
                    "CORS_ALLOWED_ORIGINS debe contener únicamente los dominios reales de producción");
        }

        log.info("Configuración de producción validada correctamente");
    }
}
