package com.gestoracad.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Limita los intentos de inicio de sesión por dirección IP para mitigar
 * ataques de fuerza bruta. Responde 429 cuando se supera el umbral.
 */
@Component
public class FiltroLimiteIntentosLogin extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(FiltroLimiteIntentosLogin.class);
    private static final String LOGIN_PATH = "/api/v1/auth/login";

    private final ServicioLimiteIntentos rateLimitService;

    @Value("${application.security.rate-limit.login.max-attempts:10}")
    private int maxAttempts;

    @Value("${application.security.rate-limit.login.window-seconds:60}")
    private long windowSeconds;

    public FiltroLimiteIntentosLogin(ServicioLimiteIntentos rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        boolean isLoginAttempt = LOGIN_PATH.equals(request.getRequestURI())
                && "POST".equalsIgnoreCase(request.getMethod());

        if (isLoginAttempt) {
            String clientKey = "login:" + ResolutorIpCliente.resolve(request);
            if (!rateLimitService.tryConsume(clientKey, maxAttempts, windowSeconds * 1000L)) {
                log.warn("Límite de intentos de login excedido para {}", clientKey);
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\","
                        + "\"message\":\"Demasiados intentos de inicio de sesión. Intente nuevamente en unos minutos.\","
                        + "\"path\":\"" + request.getRequestURI() + "\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    static final class ResolutorIpCliente {
        private ResolutorIpCliente() {
        }

        static String resolve(HttpServletRequest request) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (StringUtils.hasText(forwarded)) {
                int comma = forwarded.indexOf(',');
                String first = comma > 0 ? forwarded.substring(0, comma) : forwarded;
                return first.trim();
            }
            String realIp = request.getHeader("X-Real-IP");
            if (StringUtils.hasText(realIp)) {
                return realIp.trim();
            }
            return request.getRemoteAddr();
        }
    }
}
