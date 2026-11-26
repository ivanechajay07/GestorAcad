-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL
-- Fase 7.2 — Planes de estudio, secciones y matrícula
--
-- Requiere: database/10_estructura_academica.sql (periodos y cursos)
-- Script idempotente.
-- ==============================================================================

USE `gestoracad_db`;

-- ------------------------------------------------------------------------------
-- 1. PLANES DE ESTUDIO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_planes_estudio` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT,
    `carrera_id`   BIGINT       NOT NULL,
    `codigo`       VARCHAR(20)  NOT NULL,
    `nombre`       VARCHAR(150) NOT NULL,
    `anio`         INT          NOT NULL,
    `descripcion`  VARCHAR(255) NULL,
    `is_active`    TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`   VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`   VARCHAR(100) NULL,
    `deleted_at`   TIMESTAMP    NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_planes_codigo` (`codigo`),
    KEY `idx_planes_carrera` (`carrera_id`, `is_active`),
    CONSTRAINT `fk_planes_carrera` FOREIGN KEY (`carrera_id`) REFERENCES `tb_carreras` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_planes_anio` CHECK (`anio` BETWEEN 2000 AND 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Planes de estudio por carrera';

-- ------------------------------------------------------------------------------
-- 2. MALLA CURRICULAR (cursos por plan y ciclo)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_plan_cursos` (
    `id`          BIGINT     NOT NULL AUTO_INCREMENT,
    `plan_id`     BIGINT     NOT NULL,
    `curso_id`    BIGINT     NOT NULL,
    `ciclo`       INT        NOT NULL,
    `obligatorio` TINYINT(1) NOT NULL DEFAULT 1,
    `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
    `created_at`  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP  NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`  VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`  VARCHAR(100) NULL,
    `deleted_at`  TIMESTAMP  NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_plan_curso` (`plan_id`, `curso_id`),
    KEY `idx_plan_cursos_ciclo` (`plan_id`, `ciclo`),
    KEY `idx_plan_cursos_curso` (`curso_id`),
    CONSTRAINT `fk_plan_cursos_plan` FOREIGN KEY (`plan_id`) REFERENCES `tb_planes_estudio` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_plan_cursos_curso` FOREIGN KEY (`curso_id`) REFERENCES `tb_cursos` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_plan_cursos_ciclo` CHECK (`ciclo` BETWEEN 1 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Malla curricular: cursos asignados a un plan y ciclo';

-- ------------------------------------------------------------------------------
-- 3. SECCIONES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_secciones` (
    `id`          BIGINT      NOT NULL AUTO_INCREMENT,
    `periodo_id`  BIGINT      NOT NULL,
    `curso_id`    BIGINT      NOT NULL,
    `docente_id`  BIGINT      NULL,
    `codigo`      VARCHAR(20) NOT NULL,
    `capacidad`   INT         NOT NULL DEFAULT 30,
    `turno`       VARCHAR(20) NULL,
    `aula`        VARCHAR(50) NULL,
    `horario`     VARCHAR(100) NULL,
    `is_active`   TINYINT(1)  NOT NULL DEFAULT 1,
    `created_at`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP   NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`  VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`  VARCHAR(100) NULL,
    `deleted_at`  TIMESTAMP   NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_secciones_periodo_curso_codigo` (`periodo_id`, `curso_id`, `codigo`),
    KEY `idx_secciones_periodo` (`periodo_id`, `is_active`),
    KEY `idx_secciones_docente` (`docente_id`),
    CONSTRAINT `fk_secciones_periodo` FOREIGN KEY (`periodo_id`) REFERENCES `tb_periodos_academicos` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_secciones_curso` FOREIGN KEY (`curso_id`) REFERENCES `tb_cursos` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_secciones_docente` FOREIGN KEY (`docente_id`) REFERENCES `tb_docentes` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chk_secciones_capacidad` CHECK (`capacidad` BETWEEN 1 AND 200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Secciones ofertadas por periodo, curso y docente';

-- ------------------------------------------------------------------------------
-- 4. MATRÍCULAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_matriculas` (
    `id`             BIGINT      NOT NULL AUTO_INCREMENT,
    `estudiante_id`  BIGINT      NOT NULL,
    `seccion_id`     BIGINT      NOT NULL,
    `fecha_matricula` DATE       NOT NULL,
    `estado`         VARCHAR(20) NOT NULL DEFAULT 'MATRICULADO',
    `observacion`    VARCHAR(255) NULL,
    `is_active`      TINYINT(1)  NOT NULL DEFAULT 1,
    `created_at`     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     TIMESTAMP   NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by`     VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by`     VARCHAR(100) NULL,
    `deleted_at`     TIMESTAMP   NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_matriculas_estudiante_seccion` (`estudiante_id`, `seccion_id`),
    KEY `idx_matriculas_seccion` (`seccion_id`, `is_active`),
    KEY `idx_matriculas_estado` (`estado`, `is_active`),
    CONSTRAINT `fk_matriculas_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_matriculas_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_matriculas_estado` CHECK (`estado` IN ('MATRICULADO', 'RETIRADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Matrícula de estudiantes en secciones';

-- ------------------------------------------------------------------------------
-- 5. PERMISOS
-- ------------------------------------------------------------------------------
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
    ('PLAN_VIEW',      'PLAN',      'Permite consultar planes de estudio y mallas', 'DBA_SENIOR'),
    ('PLAN_CREATE',    'PLAN',      'Permite registrar planes de estudio',          'DBA_SENIOR'),
    ('PLAN_EDIT',      'PLAN',      'Permite modificar planes y mallas',            'DBA_SENIOR'),
    ('PLAN_DELETE',    'PLAN',      'Permite desactivar planes de estudio',         'DBA_SENIOR'),
    ('SECCION_VIEW',   'SECCION',   'Permite consultar secciones',                  'DBA_SENIOR'),
    ('SECCION_CREATE', 'SECCION',   'Permite registrar secciones',                  'DBA_SENIOR'),
    ('SECCION_EDIT',   'SECCION',   'Permite modificar secciones',                  'DBA_SENIOR'),
    ('SECCION_DELETE', 'SECCION',   'Permite desactivar secciones',                 'DBA_SENIOR'),
    ('MATRICULA_VIEW', 'MATRICULA', 'Permite consultar matrículas',                 'DBA_SENIOR'),
    ('MATRICULA_CREATE','MATRICULA','Permite registrar matrículas',                 'DBA_SENIOR'),
    ('MATRICULA_EDIT', 'MATRICULA', 'Permite actualizar el estado de matrícula',    'DBA_SENIOR'),
    ('MATRICULA_DELETE','MATRICULA','Permite anular matrículas',                    'DBA_SENIOR')
ON DUPLICATE KEY UPDATE
    `is_active` = 1;

INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id
FROM `tb_roles` r
CROSS JOIN `tb_permisos` p
WHERE r.nombre = 'ROLE_UNIVERSIDAD'
  AND p.nombre IN (
      'PLAN_VIEW', 'PLAN_CREATE', 'PLAN_EDIT', 'PLAN_DELETE',
      'SECCION_VIEW', 'SECCION_CREATE', 'SECCION_EDIT', 'SECCION_DELETE',
      'MATRICULA_VIEW', 'MATRICULA_CREATE', 'MATRICULA_EDIT', 'MATRICULA_DELETE'
  );

-- ------------------------------------------------------------------------------
-- 6. SEMILLA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_planes_estudio` (`carrera_id`, `codigo`, `nombre`, `anio`, `descripcion`, `created_by`)
SELECT c.id, 'PLAN-IS-2026', 'Plan de Estudios Ingeniería de Sistemas 2026', 2026,
       'Malla curricular de referencia para Ingeniería de Sistemas e Informática', 'DBA_SENIOR'
FROM `tb_carreras` c
WHERE c.nombre = 'Ingeniería de Sistemas e Informática'
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `anio` = VALUES(`anio`);

INSERT INTO `tb_planes_estudio` (`carrera_id`, `codigo`, `nombre`, `anio`, `descripcion`, `created_by`)
SELECT c.id, 'PLAN-MED-2026', 'Plan de Estudios Medicina Humana 2026', 2026,
       'Malla curricular de referencia para Medicina Humana', 'DBA_SENIOR'
FROM `tb_carreras` c
WHERE c.nombre = 'Medicina Humana'
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `anio` = VALUES(`anio`);

INSERT IGNORE INTO `tb_plan_cursos` (`plan_id`, `curso_id`, `ciclo`, `obligatorio`, `created_by`)
SELECT pl.id, cu.id, 1, 1, 'DBA_SENIOR'
FROM `tb_planes_estudio` pl, `tb_cursos` cu
WHERE pl.codigo = 'PLAN-IS-2026' AND cu.codigo IN ('MAT-101', 'COM-101', 'SIS-201');

INSERT IGNORE INTO `tb_plan_cursos` (`plan_id`, `curso_id`, `ciclo`, `obligatorio`, `created_by`)
SELECT pl.id, cu.id, 1, 1, 'DBA_SENIOR'
FROM `tb_planes_estudio` pl, `tb_cursos` cu
WHERE pl.codigo = 'PLAN-MED-2026' AND cu.codigo IN ('MAT-101', 'COM-101');

INSERT IGNORE INTO `tb_secciones`
    (`periodo_id`, `curso_id`, `docente_id`, `codigo`, `capacidad`, `turno`, `aula`, `horario`, `created_by`)
SELECT pe.id, cu.id, d.id, 'A', 30, 'MAÑANA', 'A-201', 'LUN-MIE 08:00-10:00', 'DBA_SENIOR'
FROM `tb_periodos_academicos` pe, `tb_cursos` cu, `tb_docentes` d
WHERE pe.codigo = '2026-II' AND cu.codigo = 'MAT-101' AND d.codigo = 'DOC-201402';

INSERT IGNORE INTO `tb_secciones`
    (`periodo_id`, `curso_id`, `docente_id`, `codigo`, `capacidad`, `turno`, `aula`, `horario`, `created_by`)
SELECT pe.id, cu.id, d.id, 'A', 25, 'TARDE', 'B-105', 'MAR-JUE 14:00-16:00', 'DBA_SENIOR'
FROM `tb_periodos_academicos` pe, `tb_cursos` cu, `tb_docentes` d
WHERE pe.codigo = '2026-II' AND cu.codigo = 'SIS-201' AND d.codigo = 'DOC-201844';

-- ------------------------------------------------------------------------------
-- 7. VERSIÓN DE ESQUEMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_11', 'Estructura Académica 7.2 — planes, secciones y matrícula',
       'Tablas tb_planes_estudio, tb_plan_cursos, tb_secciones y tb_matriculas; permisos PLAN/SECCION/MATRICULA.',
       'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_11');
