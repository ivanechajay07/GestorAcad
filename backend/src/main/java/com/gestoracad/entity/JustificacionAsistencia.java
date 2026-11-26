package com.gestoracad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Solicitud de justificación de una inasistencia o tardanza.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_justificaciones_asistencia")
public class JustificacionAsistencia extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "asistencia_id", nullable = false)
    private Asistencia attendance;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante student;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "seccion_id", nullable = false)
    private Seccion section;

    @Column(name = "motivo", nullable = false, length = 500)
    private String reason;

    @Column(name = "estado", nullable = false, length = 20)
    private String status = "PENDIENTE";

    @Column(name = "respuesta", length = 500)
    private String response;

    @Column(name = "resuelto_por", length = 100)
    private String resolvedBy;

    @Column(name = "fecha_resolucion")
    private LocalDateTime resolvedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Asistencia getAttendance() {
        return attendance;
    }

    public void setAttendance(Asistencia attendance) {
        this.attendance = attendance;
    }

    public Estudiante getStudent() {
        return student;
    }

    public void setStudent(Estudiante student) {
        this.student = student;
    }

    public Seccion getSection() {
        return section;
    }

    public void setSection(Seccion section) {
        this.section = section;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(String resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
