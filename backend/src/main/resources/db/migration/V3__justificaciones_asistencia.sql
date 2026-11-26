-- Justificaciones de inasistencia presentadas por los estudiantes.
-- Cada registro representa una solicitud asociada a un registro de asistencia.
CREATE TABLE tb_justificaciones_asistencia (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asistencia_id BIGINT NOT NULL,
    estudiante_id BIGINT NOT NULL,
    seccion_id BIGINT NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    respuesta VARCHAR(500) NULL,
    resuelto_por VARCHAR(100) NULL,
    fecha_resolucion TIMESTAMP NULL DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    updated_by VARCHAR(100) NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_justificacion_asistencia (asistencia_id),
    KEY idx_justificaciones_seccion_estado (seccion_id, estado, is_active),
    KEY idx_justificaciones_estudiante (estudiante_id, is_active),
    CONSTRAINT fk_justificaciones_asistencia FOREIGN KEY (asistencia_id) REFERENCES tb_asistencias (id) ON DELETE CASCADE,
    CONSTRAINT fk_justificaciones_estudiante FOREIGN KEY (estudiante_id) REFERENCES tb_estudiantes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_justificaciones_seccion FOREIGN KEY (seccion_id) REFERENCES tb_secciones (id) ON DELETE CASCADE,
    CONSTRAINT chk_justificacion_estado CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Solicitudes de justificación de inasistencia';
