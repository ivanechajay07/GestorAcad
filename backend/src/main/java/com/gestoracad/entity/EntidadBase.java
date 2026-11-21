package com.gestoracad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Clase base para todas las entidades JPA de la plataforma Gestor Académico.
 * Proporciona campos de auditoría estándar y soporte para borrado lógico (soft delete).
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class EntidadBase {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", length = 100, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

/** Obtiene el valor de {@code createdAt}. */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

/** Establece el valor de {@code createdAt}. */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

/** Obtiene el valor de {@code updatedAt}. */
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

/** Establece el valor de {@code updatedAt}. */
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

/** Obtiene el valor de {@code createdBy}. */
    public String getCreatedBy() {
        return createdBy;
    }

/** Establece el valor de {@code createdBy}. */
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

/** Obtiene el valor de {@code updatedBy}. */
    public String getUpdatedBy() {
        return updatedBy;
    }

/** Establece el valor de {@code updatedBy}. */
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

/** Obtiene el valor de {@code deletedAt}. */
    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

/** Establece el valor de {@code deletedAt}. */
    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }

/** Indica si {@code active}. */
    public boolean isActive() {
        return active;
    }

/** Establece el valor de {@code active}. */
    public void setActive(boolean active) {
        this.active = active;
    }
}
