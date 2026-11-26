package com.gestoracad.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro que expone la IP real del cliente a todos los controladores.
 * <p>
 * Envoltura la petición para que {@code getRemoteAddr()} devuelva la dirección
 * reenviada por el proxy de confianza. De este modo, la auditoría y cualquier
 * otro registro de origen usan la IP del cliente y no la del contenedor Nginx.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class FiltroIpClienteReal extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ipDirecta = request.getRemoteAddr();
        String ipCliente = ResolutorIpCliente.resolver(
                ipDirecta,
                request.getHeader("X-Forwarded-For"),
                request.getHeader("X-Real-IP"));

        if (ipCliente == null || ipCliente.equals(ipDirecta)) {
            filterChain.doFilter(request, response);
            return;
        }

        filterChain.doFilter(new PeticionConIpCliente(request, ipCliente), response);
    }

    /**
     * Envoltura de solo lectura que sustituye la IP del par directo.
     */
    private static final class PeticionConIpCliente extends HttpServletRequestWrapper {

        private final String ipCliente;

        private PeticionConIpCliente(HttpServletRequest request, String ipCliente) {
            super(request);
            this.ipCliente = ipCliente;
        }

        @Override
        public String getRemoteAddr() {
            return ipCliente;
        }
    }
}
