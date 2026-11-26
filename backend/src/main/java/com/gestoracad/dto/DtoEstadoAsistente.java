package com.gestoracad.dto;

/**
 * Estado del proveedor del asistente académico.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoEstadoAsistente {

    private String mode;
    private String provider;
    private boolean gptEnabled;
    private String model;

    public DtoEstadoAsistente() {
    }

    public DtoEstadoAsistente(String mode, String provider, boolean gptEnabled, String model) {
        this.mode = mode;
        this.provider = provider;
        this.gptEnabled = gptEnabled;
        this.model = model;
    }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public boolean isGptEnabled() { return gptEnabled; }
    public void setGptEnabled(boolean gptEnabled) { this.gptEnabled = gptEnabled; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
}
