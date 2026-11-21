package com.gestoracad.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registro en memoria de tokens de refresco revocados (rotación).
 * Permite invalidar el token anterior cuando se emite uno nuevo y limita el
 * crecimiento del mapa descartando las entradas ya expiradas.
 *
 * <p>Nota: al ser un registro local, en un despliegue con varias instancias se
 * debe sustituir por un almacén compartido (Redis o tabla en base de datos).</p>
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class RegistroTokensRevocados {

    private static final Logger log = LoggerFactory.getLogger(RegistroTokensRevocados.class);

    private final Map<String, Instant> revocados = new ConcurrentHashMap<>();

    /** Marca un token como revocado hasta su fecha de expiración. */
    public void revocar(String jti, Instant expiraEn) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        Instant limite = expiraEn != null ? expiraEn : Instant.now().plusSeconds(60);
        revocados.put(jti, limite);
        log.debug("Token de refresco revocado: jti={}", jti);
    }

    /** Indica si un token ya fue revocado (rotado o cerrado sesión). */
    public boolean estaRevocado(String jti) {
        limpiarExpirados();
        return jti != null && revocados.containsKey(jti);
    }

    private void limpiarExpirados() {
        Instant ahora = Instant.now();
        revocados.entrySet().removeIf(entrada -> entrada.getValue().isBefore(ahora));
    }
}
