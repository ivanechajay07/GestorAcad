package com.gestoracad.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * Proveedor de utilidades JWT.
 * Genera y valida tokens de acceso y de refresco, diferenciados por el claim
 * {@code tipo}. Los tokens de refresco incluyen un identificador {@code jti}
 * que permite su rotación y revocación.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class ProveedorTokenJwt {

    private static final Logger log = LoggerFactory.getLogger(ProveedorTokenJwt.class);

    /** Tipos de token emitidos por la plataforma. */
    public static final String TIPO_ACCESO = "access";
    public static final String TIPO_REFRESCO = "refresh";

    private static final String CLAIM_TIPO = "tipo";

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Value("${application.security.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Value("${application.security.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(String username, Map<String, Object> extraClaims) {
        return construirToken(username, extraClaims, jwtExpirationMs, TIPO_ACCESO);
    }

    public String generateToken(String username) {
        return generateToken(username, Map.of());
    }

    /** Genera un token de refresco de larga duración con identificador único. */
    public String generateRefreshToken(String username) {
        return construirToken(username, Map.of(), refreshExpirationMs, TIPO_REFRESCO);
    }

    private String construirToken(String username, Map<String, Object> extraClaims, long expiracionMs, String tipo) {
        return Jwts.builder()
                .claims(extraClaims)
                .claim(CLAIM_TIPO, tipo)
                .subject(username)
                .id(UUID.randomUUID().toString())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiracionMs))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Firma JWT inválida: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Token JWT expirado: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Token JWT no soportado: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Claims JWT vacíos: {}", e.getMessage());
        }
        return false;
    }

    /** Devuelve el tipo de token ({@code access} o {@code refresh}). */
    public String extractTipoToken(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_TIPO, String.class));
    }

    /** Devuelve el identificador único del token (para rotación y revocación). */
    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
