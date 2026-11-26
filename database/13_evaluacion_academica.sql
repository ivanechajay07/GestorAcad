-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL
-- Fase 8 — Evaluación académica
--   * Evaluaciones por sección
--   * Calificaciones por estudiante
--   * Asistencia por fecha
--   * Actas y cierre de periodo
-- ==============================================================================

USE `gestoracad_db`;

-- ------------------------------------------------------------------------------
-- 1. EVALUACIONES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_evaluaciones` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT,
    `seccion_id`   BIGINT       NOT NULL,
    `nombre`       VARCHAR(120) NOT NULL,
    `tipo`         VARCHAR(20)  NOT NULL DEFAULT 'PRACTICA',
    `peso`         DECIMAL(5,2) NOT NULL DEFAULT 0,
    `fecha`        DATE         NULL,
    `nota_maxima`  DECIMAL(5,2) NOT NULL DEFAULT 20,
    `is_active`    TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`   VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`   VARCHAR(100) NULL,
    `deleted_at`   TIMESTAMP    NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_evaluacion_seccion_nombre` (`seccion_id`, `nombre`),
    KEY `idx_evaluaciones_seccion` (`seccion_id`, `is_active`),
    CONSTRAINT `fk_evaluaciones_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_evaluacion_peso` CHECK (`peso` BETWEEN 0 AND 100),
    CONSTRAINT `chk_evaluacion_nota` CHECK (`nota_maxima` > 0 AND `nota_maxima` <= 20),
    CONSTRAINT `chk_evaluacion_tipo` CHECK (`tipo` IN ('PRACTICA','PARCIAL','FINAL','OTRO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Evaluaciones de una sección';

-- ------------------------------------------------------------------------------
-- 2. CALIFICACIONES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_calificaciones` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT,
    `evaluacion_id`  BIGINT       NOT NULL,
    `estudiante_id`  BIGINT       NOT NULL,
    `nota`           DECIMAL(5,2) NOT NULL DEFAULT 0,
    `observacion`    VARCHAR(255) NULL,
    `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`     VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`     VARCHAR(100) NULL,
    `deleted_at`     TIMESTAMP    NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_calificacion_evaluacion_estudiante` (`evaluacion_id`, `estudiante_id`),
    KEY `idx_calificaciones_estudiante` (`estudiante_id`, `is_active`),
    CONSTRAINT `fk_calificaciones_evaluacion` FOREIGN KEY (`evaluacion_id`) REFERENCES `tb_evaluaciones` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_calificaciones_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_calificacion_nota` CHECK (`nota` BETWEEN 0 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Notas por evaluación y estudiante';

-- ------------------------------------------------------------------------------
-- 3. ASISTENCIA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_asistencias` (
    `id`            BIGINT      NOT NULL AUTO_INCREMENT,
    `seccion_id`    BIGINT      NOT NULL,
    `estudiante_id` BIGINT      NOT NULL,
    `fecha`         DATE        NOT NULL,
    `estado`        VARCHAR(20) NOT NULL DEFAULT 'PRESENTE',
    `observacion`   VARCHAR(255) NULL,
    `is_active`     TINYINT(1)  NOT NULL DEFAULT 1,
    `created_at`    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP   NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`    VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`    VARCHAR(100) NULL,
    `deleted_at`    TIMESTAMP   NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_asistencia_seccion_estudiante_fecha` (`seccion_id`, `estudiante_id`, `fecha`),
    KEY `idx_asistencias_seccion_fecha` (`seccion_id`, `fecha`),
    CONSTRAINT `fk_asistencias_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_asistencias_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_asistencia_estado` CHECK (`estado` IN ('PRESENTE','AUSENTE','TARDANZA','JUSTIFICADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Asistencia por sección y fecha';

-- ------------------------------------------------------------------------------
-- 4. ACTAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_actas` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `seccion_id`  BIGINT      NOT NULL,
    `estado`      VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',
    `fecha_cierre` DATETIME   NULL,
    `cerrada_por` VARCHAR(100) NULL,
    `is_active`   TINYINT(1)  NOT NULL DEFAULT 1,
    `created_at`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP   NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`  VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`  VARCHAR(100) NULL,
    `deleted_at`  TIMESTAMP   NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_acta_seccion` (`seccion_id`),
    CONSTRAINT `fk_actas_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_acta_estado` CHECK (`estado` IN ('ABIERTA','CERRADA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Acta de evaluación por sección';

CREATE TABLE IF NOT EXISTS `tb_actas_detalle` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `acta_id`       BIGINT       NOT NULL,
    `estudiante_id` BIGINT       NOT NULL,
    `promedio`      DECIMAL(5,2) NOT NULL DEFAULT 0,
    `aprobado`      TINYINT(1)   NOT NULL DEFAULT 0,
    `creditos`      INT          NOT NULL DEFAULT 0,
    `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`    VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`    VARCHAR(100) NULL,
    `deleted_at`    TIMESTAMP    NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_acta_detalle_estudiante` (`acta_id`, `estudiante_id`),
    CONSTRAINT `fk_acta_detalle_acta` FOREIGN KEY (`acta_id`) REFERENCES `tb_actas` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_acta_detalle_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_acta_detalle_promedio` CHECK (`promedio` BETWEEN 0 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Resultado final por estudiante en el acta';

-- ------------------------------------------------------------------------------
-- 5. PERMISOS
-- ------------------------------------------------------------------------------
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
    ('EVALUACION_VIEW',   'EVALUACION',  'Permite consultar evaluaciones',              'DBA_SENIOR'),
    ('EVALUACION_EDIT',   'EVALUACION',  'Permite crear y editar evaluaciones',         'DBA_SENIOR'),
    ('NOTA_VIEW',         'EVALUACION',  'Permite consultar calificaciones',            'DBA_SENIOR'),
    ('NOTA_EDIT',         'EVALUACION',  'Permite registrar y corregir calificaciones', 'DBA_SENIOR'),
    ('ASISTENCIA_VIEW',   'EVALUACION',  'Permite consultar asistencia',                'DBA_SENIOR'),
    ('ASISTENCIA_EDIT',   'EVALUACION',  'Permite registrar asistencia',                'DBA_SENIOR'),
    ('ACTA_VIEW',         'EVALUACION',  'Permite consultar actas',                     'DBA_SENIOR'),
    ('ACTA_CLOSE',        'EVALUACION',  'Permite cerrar actas de evaluación',          'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `is_active` = 1;

INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id
FROM `tb_roles` r CROSS JOIN `tb_permisos` p
WHERE r.nombre = 'ROLE_UNIVERSIDAD'
  AND p.nombre IN (
      'EVALUACION_VIEW','EVALUACION_EDIT','NOTA_VIEW','NOTA_EDIT',
      'ASISTENCIA_VIEW','ASISTENCIA_EDIT','ACTA_VIEW','ACTA_CLOSE'
  );

-- ------------------------------------------------------------------------------
-- 6. VERSIÓN
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_13', 'Evaluación académica — notas, asistencia y actas',
       'Tablas tb_evaluaciones, tb_calificaciones, tb_asistencias, tb_actas y tb_actas_detalle; permisos EVALUACION/NOTA/ASISTENCIA/ACTA.',
       'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_13');
