package com.gestoracad.dto;

/**
 * Indicadores accionables del panel institucional.
 * Solo se completa si el usuario tiene permiso sobre el módulo correspondiente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoGestionDashboard {

    private Long estudiantesSinCuenta;
    private Long docentesSinCuenta;
    private Long estudiantesSinFoto;
    private Long docentesSinFoto;
    private Long cuentasBloqueadas;
    private Long estudiantesObservados;
    private Long estudiantesBajoPromedio;

    public Long getEstudiantesSinCuenta() {
        return estudiantesSinCuenta;
    }

    public void setEstudiantesSinCuenta(Long estudiantesSinCuenta) {
        this.estudiantesSinCuenta = estudiantesSinCuenta;
    }

    public Long getDocentesSinCuenta() {
        return docentesSinCuenta;
    }

    public void setDocentesSinCuenta(Long docentesSinCuenta) {
        this.docentesSinCuenta = docentesSinCuenta;
    }

    public Long getEstudiantesSinFoto() {
        return estudiantesSinFoto;
    }

    public void setEstudiantesSinFoto(Long estudiantesSinFoto) {
        this.estudiantesSinFoto = estudiantesSinFoto;
    }

    public Long getDocentesSinFoto() {
        return docentesSinFoto;
    }

    public void setDocentesSinFoto(Long docentesSinFoto) {
        this.docentesSinFoto = docentesSinFoto;
    }

    public Long getCuentasBloqueadas() {
        return cuentasBloqueadas;
    }

    public void setCuentasBloqueadas(Long cuentasBloqueadas) {
        this.cuentasBloqueadas = cuentasBloqueadas;
    }

    public Long getEstudiantesObservados() {
        return estudiantesObservados;
    }

    public void setEstudiantesObservados(Long estudiantesObservados) {
        this.estudiantesObservados = estudiantesObservados;
    }

    public Long getEstudiantesBajoPromedio() {
        return estudiantesBajoPromedio;
    }

    public void setEstudiantesBajoPromedio(Long estudiantesBajoPromedio) {
        this.estudiantesBajoPromedio = estudiantesBajoPromedio;
    }
}
