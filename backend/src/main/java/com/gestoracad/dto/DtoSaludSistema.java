package com.gestoracad.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Modelo de respuesta con el estado de salud del sistema.
 * Describe el nombre de la aplicación, su estado, versión, fase actual,
 * entorno y el detalle de cada componente verificado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoSaludSistema {
    private String applicationName;
    private String status;
    private String version;
    private String currentPhase;
    private String environment;
    private LocalDateTime timestamp;
    private Map<String, Object> components;

    public DtoSaludSistema() {
        this.timestamp = LocalDateTime.now();
    }

    public DtoSaludSistema(String applicationName, String status, String version, String currentPhase, String environment, Map<String, Object> components) {
        this.applicationName = applicationName;
        this.status = status;
        this.version = version;
        this.currentPhase = currentPhase;
        this.environment = environment;
        this.timestamp = LocalDateTime.now();
        this.components = components;
    }

    public String getApplicationName() {
        return applicationName;
    }

    public void setApplicationName(String applicationName) {
        this.applicationName = applicationName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getCurrentPhase() {
        return currentPhase;
    }

    public void setCurrentPhase(String currentPhase) {
        this.currentPhase = currentPhase;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Object> getComponents() {
        return components;
    }

    public void setComponents(Map<String, Object> components) {
        this.components = components;
    }
}
