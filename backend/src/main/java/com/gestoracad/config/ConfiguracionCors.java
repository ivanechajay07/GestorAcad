package com.gestoracad.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Configuración de CORS de la API.
 * Permite los orígenes exactos definidos por entorno y patrones de red local
 * (localhost, 127.0.0.1, 192.168.*, 10.*, 172.*) para habilitar el acceso
 * desde otros dispositivos de la misma red.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Configuration
public class ConfiguracionCors {

    @Value("${application.security.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Value("${application.security.cors.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*,http://192.168.*.*:*,http://10.*.*.*:*,http://172.*.*.*:*}")
    private String allowedOriginPatterns;

    @Value("${application.security.cors.allowed-methods:GET,POST,PUT,DELETE,PATCH,OPTIONS}")
    private String allowedMethods;

    @Value("${application.security.cors.allow-credentials:true}")
    private boolean allowCredentials;

    /** Configura y registra el filtro CORS con orígenes, métodos y cabeceras permitidas. */
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Orígenes exactos (env) + patrones para red local (otro dispositivo en la LAN)
        List<String> patterns = new ArrayList<>();
        patterns.addAll(limpiarLista(allowedOrigins));
        patterns.addAll(limpiarLista(allowedOriginPatterns));
        config.setAllowedOriginPatterns(patterns);

        List<String> methods = limpiarLista(allowedMethods);
        config.setAllowedMethods(methods);

        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(allowCredentials);
        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }

    /**
     * Convierte una lista separada por comas en valores limpios, ignorando vacíos.
     * Permite desactivar los patrones de red local en producción configurando
     * {@code allowed-origin-patterns} como cadena vacía.
     */
    private List<String> limpiarLista(String valor) {
        if (valor == null || valor.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(valor.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
