package com.gestoracad.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pruebas de la resolución de IP real detrás de un proxy inverso.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
class ResolutorIpClienteTest {

    @Test
    @DisplayName("Toma la primera IP reenviada cuando el par directo es el proxy interno")
    void usaCabeceraReenviadaDesdeProxyPrivado() {
        assertEquals("203.0.113.8",
                ResolutorIpCliente.resolver("172.23.0.5", "203.0.113.8, 172.23.0.5", null));
    }

    @Test
    @DisplayName("Usa X-Real-IP cuando no existe X-Forwarded-For")
    void usaCabeceraReal() {
        assertEquals("198.51.100.4",
                ResolutorIpCliente.resolver("172.23.0.5", null, "198.51.100.4"));
    }

    @Test
    @DisplayName("Ignora encabezados falsificados si el cliente se conecta directamente")
    void ignoraCabecerasDeClienteExterno() {
        assertEquals("203.0.113.20",
                ResolutorIpCliente.resolver("203.0.113.20", "10.0.0.1", "10.0.0.2"));
    }

    @Test
    @DisplayName("Descarta cabeceras con formato inválido")
    void descartaValoresInvalidos() {
        assertEquals("172.23.0.5",
                ResolutorIpCliente.resolver("172.23.0.5", "no-es-una-ip", "<script>"));
        assertEquals("127.0.0.1",
                ResolutorIpCliente.resolver("127.0.0.1", "1111111111111111111111111111111111111111111111111", null));
    }

    @Test
    @DisplayName("Reconoce loopback, rangos privados IPv4 e IPv6 local")
    void reconoceRangosConfidables() {
        assertTrue(ResolutorIpCliente.esProxyConfiable("127.0.0.1"));
        assertTrue(ResolutorIpCliente.esProxyConfiable("10.1.2.3"));
        assertTrue(ResolutorIpCliente.esProxyConfiable("172.16.0.1"));
        assertTrue(ResolutorIpCliente.esProxyConfiable("192.168.1.10"));
        assertTrue(ResolutorIpCliente.esProxyConfiable("::1"));
        assertTrue(ResolutorIpCliente.esProxyConfiable("fd00::1"));
        assertFalse(ResolutorIpCliente.esProxyConfiable("8.8.8.8"));
        assertFalse(ResolutorIpCliente.esProxyConfiable("172.32.0.1"));
        assertFalse(ResolutorIpCliente.esProxyConfiable(null));
    }
}
