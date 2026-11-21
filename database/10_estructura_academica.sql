-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL
-- Fase 7.1 — Estructura Académica: periodos y cursos
--
-- Alcance de este incremento:
--   * tb_periodos_academicos (calendario y periodo vigente)
--   * tb_cursos (catálogo de asignaturas)
--   * Permisos PERIODO_* y CURSO_*
--   * Semilla mínima de periodos y cursos
--
-- Pendiente para siguientes incrementos:
--   * tb_planes_estudio y tb_plan_cursos
--   * tb_secciones y tb_matriculas
--
-- Script idempotente: puede ejecutarse varias veces sin duplicar datos.
-- ==============================================================================

USE `gestoracad_db`;

-- ------------------------------------------------------------------------------
-- 1. PERIODOS ACADÉMICOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_periodos_academicos` (
    `id`               BIGINT        NOT NULL AUTO_INCREMENT,
    `codigo`           VARCHAR(20)   NOT NULL COMMENT 'Identificador del periodo, por ejemplo 2026-I',
    `nombre`           VARCHAR(120)  NOT NULL,
    `fecha_inicio`     DATE          NOT NULL,
    `fecha_fin`        DATE          NOT NULL,
    `matricula_inicio` DATE          NULL,
    `matricula_fin`    DATE          NULL,
    `es_actual`        TINYINT(1)    NOT NULL DEFAULT 0 COMMENT 'Solo un periodo puede ser el vigente',
    `is_active`        TINYINT(1)    NOT NULL DEFAULT 1,
    `created_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`       VARCHAR(100)  NOT NULL DEFAULT 'SISTEMA',
    `updated_by`       VARCHAR(100)  NULL,
    `deleted_at`       TIMESTAMP     NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_periodos_codigo` (`codigo`),
    KEY `idx_periodos_actual` (`es_actual`, `is_active`),
    CONSTRAINT `chk_periodos_fechas` CHECK (`fecha_fin` >= `fecha_inicio`),
    CONSTRAINT `chk_periodos_matricula`
        CHECK (`matricula_inicio` IS NULL OR `matricula_fin` IS NULL OR `matricula_fin` >= `matricula_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Periodos académicos y calendario de matrícula';

-- ------------------------------------------------------------------------------
-- 2. CURSOS / ASIGNATURAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_cursos` (
    `id`               BIGINT        NOT NULL AUTO_INCREMENT,
    `codigo`           VARCHAR(20)   NOT NULL COMMENT 'Código único del curso, por ejemplo MAT-101',
    `nombre`           VARCHAR(150)  NOT NULL,
    `creditos`         INT           NOT NULL DEFAULT 3,
    `horas_teoricas`   INT           NOT NULL DEFAULT 0,
    `horas_practicas`  INT           NOT NULL DEFAULT 0,
    `tipo`             VARCHAR(20)   NOT NULL DEFAULT 'GENERAL' COMMENT 'GENERAL, ESPECIFICO o ELECTIVO',
    `descripcion`      VARCHAR(255)  NULL,
    `is_active`        TINYINT(1)    NOT NULL DEFAULT 1,
    `created_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`       VARCHAR(100)  NOT NULL DEFAULT 'SISTEMA',
    `updated_by`       VARCHAR(100)  NULL,
    `deleted_at`       TIMESTAMP     NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_cursos_codigo` (`codigo`),
    KEY `idx_cursos_tipo` (`tipo`, `is_active`),
    CONSTRAINT `chk_cursos_creditos` CHECK (`creditos` BETWEEN 1 AND 30),
    CONSTRAINT `chk_cursos_horas` CHECK (`horas_teoricas` BETWEEN 0 AND 40 AND `horas_practicas` BETWEEN 0 AND 40),
    CONSTRAINT `chk_cursos_carga` CHECK (`horas_teoricas` + `horas_practicas` > 0),
    CONSTRAINT `chk_cursos_tipo` CHECK (`tipo` IN ('GENERAL', 'ESPECIFICO', 'ELECTIVO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de cursos y asignaturas de la estructura académica';

-- ------------------------------------------------------------------------------
-- 3. PERMISOS
-- ------------------------------------------------------------------------------
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
    ('PERIODO_VIEW',   'PERIODO', 'Permite consultar periodos académicos',        'DBA_SENIOR'),
    ('PERIODO_CREATE', 'PERIODO', 'Permite registrar periodos académicos',        'DBA_SENIOR'),
    ('PERIODO_EDIT',   'PERIODO', 'Permite modificar y activar periodos',         'DBA_SENIOR'),
    ('PERIODO_DELETE', 'PERIODO', 'Permite desactivar periodos sin matrícula',    'DBA_SENIOR'),
    ('CURSO_VIEW',     'CURSO',   'Permite consultar el catálogo de cursos',      'DBA_SENIOR'),
    ('CURSO_CREATE',   'CURSO',   'Permite registrar cursos',                     'DBA_SENIOR'),
    ('CURSO_EDIT',     'CURSO',   'Permite modificar cursos',                     'DBA_SENIOR'),
    ('CURSO_DELETE',   'CURSO',   'Permite desactivar cursos',                    'DBA_SENIOR')
ON DUPLICATE KEY UPDATE
    `is_active` = 1;

INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id
FROM `tb_roles` r
CROSS JOIN `tb_permisos` p
WHERE r.nombre = 'ROLE_UNIVERSIDAD'
  AND p.nombre IN (
      'PERIODO_VIEW', 'PERIODO_CREATE', 'PERIODO_EDIT', 'PERIODO_DELETE',
      'CURSO_VIEW',   'CURSO_CREATE',   'CURSO_EDIT',   'CURSO_DELETE'
  );

-- ------------------------------------------------------------------------------
-- 4. SEMILLA MÍNIMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_periodos_academicos`
    (`codigo`, `nombre`, `fecha_inicio`, `fecha_fin`, `matricula_inicio`, `matricula_fin`, `es_actual`, `created_by`)
VALUES
    ('2026-I',  'Periodo Académico 2026-I',  '2026-03-30', '2026-07-17', '2026-03-09', '2026-03-27', 0, 'DBA_SENIOR'),
    ('2026-II', 'Periodo Académico 2026-II', '2026-08-10', '2026-12-18', '2026-07-27', '2026-08-07', 1, 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE
    `nombre` = VALUES(`nombre`),
    `fecha_inicio` = VALUES(`fecha_inicio`),
    `fecha_fin` = VALUES(`fecha_fin`),
    `matricula_inicio` = VALUES(`matricula_inicio`),
    `matricula_fin` = VALUES(`matricula_fin`);

INSERT INTO `tb_cursos`
    (`codigo`, `nombre`, `creditos`, `horas_teoricas`, `horas_practicas`, `tipo`, `descripcion`, `created_by`)
VALUES
    ('MAT-101', 'Matemática I',                          4, 3, 2, 'GENERAL',    'Fundamentos de álgebra y cálculo diferencial', 'DBA_SENIOR'),
    ('COM-101', 'Comunicación I',                        3, 2, 2, 'GENERAL',    'Comprensión y producción de textos académicos', 'DBA_SENIOR'),
    ('SIS-201', 'Algoritmos y Estructuras de Datos',     4, 3, 2, 'ESPECIFICO', 'Diseño de algoritmos y estructuras fundamentales', 'DBA_SENIOR'),
    ('DER-101', 'Introducción al Derecho',               3, 2, 2, 'ESPECIFICO', 'Nociones generales del ordenamiento jurídico', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE
    `nombre` = VALUES(`nombre`),
    `creditos` = VALUES(`creditos`),
    `horas_teoricas` = VALUES(`horas_teoricas`),
    `horas_practicas` = VALUES(`horas_practicas`),
    `tipo` = VALUES(`tipo`),
    `descripcion` = VALUES(`descripcion`);

-- Garantiza un único periodo vigente si la semilla se reaplica.
UPDATE `tb_periodos_academicos` SET `es_actual` = 0 WHERE `codigo` <> '2026-II';
UPDATE `tb_periodos_academicos` SET `es_actual` = 1 WHERE `codigo` = '2026-II';

-- ------------------------------------------------------------------------------
-- 5. VERSIÓN DE ESQUEMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_10', 'Estructura Académica — periodos y cursos',
       'Tablas tb_periodos_academicos y tb_cursos; permisos PERIODO_* y CURSO_*; semilla de periodos y cursos.',
       'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_10');
