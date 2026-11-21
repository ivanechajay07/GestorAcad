package com.gestoracad.service.impl;

import com.gestoracad.dto.DtoSaludSistema;
import com.gestoracad.service.ServicioSalud;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * Implementación del servicio de diagnóstico (salud del sistema).
 * Verifica la conectividad con la base de datos y reporta el estado de los
 * componentes principales de la plataforma.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Service
public class ServicioSaludImpl implements ServicioSalud {

    private final Environment environment;
    private final DataSource dataSource;

    @Value("${spring.application.name:gestoracad-backend}")
    private String applicationName;

    public ServicioSaludImpl(Environment environment, DataSource dataSource) {
        this.environment = environment;
        this.dataSource = dataSource;
    }

    @Override
    public DtoSaludSistema getSystemHealth() {
        Map<String, Object> components = new HashMap<>();

        // Verificar la conectividad con la base de datos
        boolean dbConnected = false;
        String dbMessage = "Desconectado";
        try (Connection conn = dataSource.getConnection()) {
            dbConnected = !conn.isClosed();
            dbMessage = "Conectado (" + conn.getMetaData().getDatabaseProductName() + " " + conn.getMetaData().getDatabaseProductVersion() + ")";
        } catch (Exception e) {
            dbMessage = "Error de conexión: " + e.getMessage();
        }

        components.put("database", Map.of(
                "status", dbConnected ? "UP" : "DOWN",
                "details", dbMessage
        ));

        components.put("security", Map.of(
                "status", "UP",
                "type", "Spring Security + BCrypt + JWT (listo)"
        ));

        components.put("apiDocs", Map.of(
                "status", "UP",
                "endpoint", "/swagger-ui.html"
        ));

        String activeProfile = Arrays.stream(environment.getActiveProfiles())
                .findFirst()
                .orElse("default");

        return new DtoSaludSistema(
                applicationName,
                dbConnected ? "UP" : "DEGRADED",
                "1.0.0",
                "FASE 1: Arquitectura, configuración inicial y análisis",
                activeProfile,
                components
        );
    }

    @Override
    public String ping() {
        return "pong - Gestor Académico Virtual Activo";
    }
}
