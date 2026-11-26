package com.gestoracad.entity;

import com.gestoracad.audit.AccionAuditoria;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Entidad JPA que registra un evento de auditoría del sistema.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_auditoria")
public class RegistroAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario user;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "accion", nullable = false, length = 20)
    private AccionAuditoria action;

    @Column(name = "modulo", nullable = false, length = 50)
    private String module;

    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "endpoint", nullable = false, length = 255)
    private String endpoint;

    @Column(name = "metodo_http", nullable = false, length = 10)
    private String httpMethod;

    @Column(name = "ip_origen", length = 45)
    private String clientIp;

    @Column(name = "entidad", length = 100)
    private String entityName;

    @Column(name = "id_entidad")
    private Long entityId;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "resultado", nullable = false, length = 20)
    private String result;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public RegistroAuditoria() {
    }

    public RegistroAuditoria(Usuario user, String username, AccionAuditoria action, String module, String description, String endpoint, String httpMethod, String clientIp, String result) {
        this(user, username, action, module, description, endpoint, httpMethod, clientIp, null, null, null, result);
    }

    public RegistroAuditoria(Usuario user, String username, AccionAuditoria action, String module, String description, String endpoint, String httpMethod, String clientIp, String entityName, Long entityId, String userAgent, String result) {
        this.user = user;
        this.username = username;
        this.action = action;
        this.module = module;
        this.description = description;
        this.endpoint = endpoint;
        this.httpMethod = httpMethod;
        this.clientIp = clientIp;
        this.entityName = entityName;
        this.entityId = entityId;
        this.userAgent = userAgent;
        this.result = result;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUser() {
        return user;
    }

    public void setUser(Usuario user) {
        this.user = user;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public AccionAuditoria getAction() {
        return action;
    }

    public void setAction(AccionAuditoria action) {
        this.action = action;
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public void setHttpMethod(String httpMethod) {
        this.httpMethod = httpMethod;
    }

    public String getClientIp() {
        return clientIp;
    }

    public void setClientIp(String clientIp) {
        this.clientIp = clientIp;
    }

    public String getEntityName() {
        return entityName;
    }

    public void setEntityName(String entityName) {
        this.entityName = entityName;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
