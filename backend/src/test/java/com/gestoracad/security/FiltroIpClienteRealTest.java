package com.gestoracad.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Pruebas del filtro que sustituye la IP del par directo por la del cliente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
class FiltroIpClienteRealTest {

    private final FiltroIpClienteReal filtro = new FiltroIpClienteReal();

    @Test
    @DisplayName("Los controladores ven la IP reenviada por Nginx")
    void exponeIpReenviada() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/audit/recent");
        request.setRemoteAddr("172.23.0.5");
        request.addHeader("X-Forwarded-For", "203.0.113.9, 172.23.0.5");
        MockHttpServletResponse response = new MockHttpServletResponse();
        String[] ipVista = new String[1];
        FilterChain chain = (req, res) -> ipVista[0] = req.getRemoteAddr();

        filtro.doFilter(request, response, chain);

        assertEquals("203.0.113.9", ipVista[0]);
    }

    @Test
    @DisplayName("Sin encabezados de proxy conserva la IP directa")
    void conservaIpDirecta() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/audit/recent");
        request.setRemoteAddr("203.0.113.30");
        MockHttpServletResponse response = new MockHttpServletResponse();
        String[] ipVista = new String[1];
        FilterChain chain = (req, res) -> ipVista[0] = req.getRemoteAddr();

        filtro.doFilter(request, response, chain);

        assertEquals("203.0.113.30", ipVista[0]);
    }
}
