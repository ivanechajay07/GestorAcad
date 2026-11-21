package com.gestoracad.security;

import java.util.regex.Pattern;

/**
 * Resuelve la IP real del cliente cuando la aplicación está detrás de un proxy
 * inverso (por ejemplo Nginx en el contenedor {@code frontend}).
 * <p>
 * El backend recibe la petición desde el proxy, por lo que
 * {@code getRemoteAddr()} devuelve la IP interna del contenedor. Los encabezados
 * {@code X-Forwarded-For} y {@code X-Real-IP} contienen la IP original, pero
 * solo se confían cuando el par directo es una dirección privada o de loopback
 * (es decir, un proxy de la propia red). Así se evita que un cliente externo
 * falsifique su origen enviando esos encabezados directamente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public final class ResolutorIpCliente {

    /** Longitud máxima de una dirección IPv6 textual. */
    private static final int LONGITUD_MAXIMA_IP = 45;

    /** Solo se aceptan caracteres propios de una dirección IPv4 o IPv6. */
    private static final Pattern FORMATO_IP = Pattern.compile("[0-9a-fA-F:.]+");

    private ResolutorIpCliente() {
    }

    /**
     * Obtiene la IP del cliente a partir de la conexión y de los encabezados del proxy.
     *
     * @param remoteAddr   IP del par directo según el servidor
     * @param forwardedFor valor de {@code X-Forwarded-For} (puede ser una lista)
     * @param realIp       valor de {@code X-Real-IP}
     * @return IP del cliente, o {@code remoteAddr} si no se puede confiar en el proxy
     */
    public static String resolver(String remoteAddr, String forwardedFor, String realIp) {
        String directa = normalizar(remoteAddr);
        if (!esProxyConfiable(directa)) {
            return directa;
        }

        String reenviada = primeraIp(forwardedFor);
        if (reenviada != null) {
            return reenviada;
        }

        String cabeceraReal = normalizar(realIp);
        return cabeceraReal != null ? cabeceraReal : directa;
    }

    /**
     * Indica si la IP corresponde a un proxy de confianza: loopback, red privada
     * IPv4 o rango local IPv6.
     *
     * @param ip dirección a evaluar
     * @return {@code true} si la dirección es privada o de loopback
     */
    public static boolean esProxyConfiable(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        if ("::1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip)) {
            return true;
        }
        if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
            return true;
        }
        String[] partes = ip.split("\\.");
        if (partes.length != 4) {
            return false;
        }
        try {
            int primero = Integer.parseInt(partes[0]);
            int segundo = Integer.parseInt(partes[1]);
            return primero == 10
                    || primero == 127
                    || (primero == 172 && segundo >= 16 && segundo <= 31)
                    || (primero == 192 && segundo == 168)
                    || (primero == 169 && segundo == 254);
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    private static String primeraIp(String forwardedFor) {
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return null;
        }
        return normalizar(forwardedFor.split(",")[0]);
    }

    private static String normalizar(String valor) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.trim();
        if (limpio.isEmpty() || limpio.length() > LONGITUD_MAXIMA_IP || !FORMATO_IP.matcher(limpio).matches()) {
            return null;
        }
        return limpio;
    }
}
