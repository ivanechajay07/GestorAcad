-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL
-- Fase 7.3 — Estructura académica avanzada
--   * Prerrequisitos entre cursos
--   * Horarios estructurados por sección y detección de choques
--
-- Requiere: database/10 y 11.
-- Script idempotente.
-- ==============================================================================

USE `gestoracad_db`;

-- ------------------------------------------------------------------------------
-- 1. PRERREQUISITOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_curso_prerrequisitos` (
    `id`              BIGINT     NOT NULL AUTO_INCREMENT,
    `curso_id`        BIGINT     NOT NULL,
    `prerrequisito_id` BIGINT    NOT NULL,
    `is_active`       TINYINT(1) NOT NULL DEFAULT 1,
    `created_at`      TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      TIMESTAMP  NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`      VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`      VARCHAR(100) NULL,
    `deleted_at`      TIMESTAMP  NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_prerrequisito_curso` (`curso_id`, `prerrequisito_id`),
    KEY `idx_prerrequisito_curso` (`curso_id`, `is_active`),
    CONSTRAINT `fk_prerrequisito_curso` FOREIGN KEY (`curso_id`) REFERENCES `tb_cursos` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_prerrequisito_origen` FOREIGN KEY (`prerrequisito_id`) REFERENCES `tb_cursos` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_prerrequisito_distinto` CHECK (`curso_id` <> `prerrequisito_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cursos que deben aprobarse antes de otro curso';

-- ------------------------------------------------------------------------------
-- 2. HORARIOS ESTRUCTURADOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_seccion_horarios` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `seccion_id`  BIGINT      NOT NULL,
    `dia_semana`  VARCHAR(10) NOT NULL,
    `hora_inicio` TIME        NOT NULL,
    `hora_fin`    TIME        NOT NULL,
    `aula`        VARCHAR(50) NULL,
    `is_active`   TINYINT(1)  NOT NULL DEFAULT 1,
    `created_at`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP   NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`  VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`  VARCHAR(100) NULL,
    `deleted_at`  TIMESTAMP   NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_horario_seccion_dia_hora` (`seccion_id`, `dia_semana`, `hora_inicio`),
    KEY `idx_horario_seccion` (`seccion_id`, `is_active`),
    KEY `idx_horario_dia` (`dia_semana`, `hora_inicio`, `hora_fin`),
    CONSTRAINT `fk_horario_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_horario_horas` CHECK (`hora_fin` > `hora_inicio`),
    CONSTRAINT `chk_horario_dia` CHECK (`dia_semana` IN ('LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bloques de horario estructurados por sección';

-- ------------------------------------------------------------------------------
-- 3. SEMILLA
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO `tb_curso_prerrequisitos` (`curso_id`, `prerrequisito_id`, `created_by`)
SELECT c.id, p.id, 'DBA_SENIOR'
FROM `tb_cursos` c, `tb_cursos` p
WHERE c.codigo = 'SIS-201' AND p.codigo = 'MAT-101';

INSERT IGNORE INTO `tb_seccion_horarios`
    (`seccion_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `aula`, `created_by`)
SELECT s.id, 'LUNES', '08:00:00', '10:00:00', 'A-201', 'DBA_SENIOR'
FROM `tb_secciones` s JOIN `tb_cursos` c ON c.id = s.curso_id
WHERE c.codigo = 'MAT-101' AND s.codigo = 'A';

INSERT IGNORE INTO `tb_seccion_horarios`
    (`seccion_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `aula`, `created_by`)
SELECT s.id, 'MIERCOLES', '08:00:00', '10:00:00', 'A-201', 'DBA_SENIOR'
FROM `tb_secciones` s JOIN `tb_cursos` c ON c.id = s.curso_id
WHERE c.codigo = 'MAT-101' AND s.codigo = 'A';

INSERT IGNORE INTO `tb_seccion_horarios`
    (`seccion_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `aula`, `created_by`)
SELECT s.id, 'MARTES', '14:00:00', '16:00:00', 'B-105', 'DBA_SENIOR'
FROM `tb_secciones` s JOIN `tb_cursos` c ON c.id = s.curso_id
WHERE c.codigo = 'SIS-201' AND s.codigo = 'A';

INSERT IGNORE INTO `tb_seccion_horarios`
    (`seccion_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `aula`, `created_by`)
SELECT s.id, 'JUEVES', '14:00:00', '16:00:00', 'B-105', 'DBA_SENIOR'
FROM `tb_secciones` s JOIN `tb_cursos` c ON c.id = s.curso_id
WHERE c.codigo = 'SIS-201' AND s.codigo = 'A';

-- ------------------------------------------------------------------------------
-- 4. VERSIÓN
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_12', 'Estructura Académica 7.3 — prerrequisitos y horarios',
       'Tablas tb_curso_prerrequisitos y tb_seccion_horarios; validación de choques por docente y aula.',
       'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_12');
