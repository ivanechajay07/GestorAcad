-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL - MIGRACIÓN FASE 4
-- Módulo: Universidad (Institución matriz, Sedes/Campus, Autoridades Rectorales,
--         Parametrización global del sistema)
-- Motor: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci
-- ==============================================================================

USE `gestoracad_db`;

-- Garantiza que el cliente interprete correctamente los caracteres UTF-8 (acentos)
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 1. TABLA: tb_universidad (Institución matriz / Rectoría)
--    Entidad raíz de la jerarquía institucional. Se modela como catálogo con
--    una única institución activa (multi-institución soportado a futuro).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_universidad` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(200) NOT NULL COMMENT 'Nombre oficial de la institución',
    `nombre_corto` VARCHAR(50) NULL COMMENT 'Sigla o acrónimo institucional',
    `lema` VARCHAR(255) NULL COMMENT 'Lema institucional',
    `tipo_institucion` VARCHAR(30) NOT NULL DEFAULT 'PUBLICA' COMMENT 'PUBLICA o PRIVADA',
    `ruc` VARCHAR(20) NULL COMMENT 'RUC / identificador tributario',
    `resolucion_licenciamiento` VARCHAR(100) NULL COMMENT 'Resolución de licenciamiento institucional',
    `estado_licenciamiento` VARCHAR(50) NULL COMMENT 'Estado de licenciamiento (ej. LICENCIADA)',
    `vigencia_acreditacion` DATE NULL COMMENT 'Fecha de vigencia de la acreditación',
    `fecha_fundacion` DATE NULL COMMENT 'Fecha de fundación de la institución',
    `direccion` VARCHAR(255) NULL COMMENT 'Dirección de la sede legal',
    `telefono` VARCHAR(25) NULL,
    `email` VARCHAR(100) NULL,
    `sitio_web` VARCHAR(150) NULL,
    `logo_url` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `uk_universidad_ruc` UNIQUE (`ruc`),
    CONSTRAINT `chk_universidad_tipo` CHECK (`tipo_institucion` IN ('PUBLICA','PRIVADA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Institución universitaria matriz (Rectoría)';

-- ------------------------------------------------------------------------------
-- 2. TABLA: tb_sedes (Sede / Campus / Filial)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_sedes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `universidad_id` BIGINT NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `codigo` VARCHAR(20) NOT NULL,
    `tipo` VARCHAR(30) NOT NULL DEFAULT 'CAMPUS' COMMENT 'SEDE_PRINCIPAL, CAMPUS o FILIAL',
    `direccion` VARCHAR(255) NULL,
    `distrito` VARCHAR(100) NULL,
    `ciudad` VARCHAR(100) NULL,
    `region` VARCHAR(100) NULL,
    `telefono` VARCHAR(25) NULL,
    `email` VARCHAR(100) NULL,
    `aforo` INT NULL COMMENT 'Capacidad máxima de estudiantes',
    `num_pabellones` INT NULL,
    `num_laboratorios` INT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `uk_sedes_codigo` UNIQUE (`codigo`),
    CONSTRAINT `fk_sedes_universidad` FOREIGN KEY (`universidad_id`) REFERENCES `tb_universidad` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_sedes_tipo` CHECK (`tipo` IN ('SEDE_PRINCIPAL','CAMPUS','FILIAL'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sedes, campus y filiales de la universidad';

-- ------------------------------------------------------------------------------
-- 3. TABLA: tb_autoridades (Autoridades rectorales y de gobierno)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_autoridades` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `universidad_id` BIGINT NOT NULL,
    `cargo` VARCHAR(100) NOT NULL COMMENT 'Rector, Vicerrector Académico, etc.',
    `nombres` VARCHAR(150) NOT NULL,
    `apellidos` VARCHAR(150) NOT NULL,
    `grado_academico` VARCHAR(200) NULL,
    `documento_identidad` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `telefono` VARCHAR(25) NULL,
    `despacho` VARCHAR(150) NULL,
    `periodo_inicio` DATE NULL,
    `periodo_fin` DATE NULL,
    `resolucion_nombramiento` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `fk_autoridades_universidad` FOREIGN KEY (`universidad_id`) REFERENCES `tb_universidad` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Autoridades rectorales y de gobierno universitario';

-- ------------------------------------------------------------------------------
-- 4. TABLA: tb_parametros (Parametrización global del sistema)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_parametros` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `clave` VARCHAR(100) NOT NULL,
    `valor` VARCHAR(500) NOT NULL,
    `tipo_valor` VARCHAR(20) NOT NULL DEFAULT 'STRING' COMMENT 'STRING, NUMBER, BOOLEAN o DATE',
    `modulo` VARCHAR(50) NOT NULL DEFAULT 'SISTEMA',
    `descripcion` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `uk_parametros_clave` UNIQUE (`clave`),
    CONSTRAINT `chk_parametros_tipo` CHECK (`tipo_valor` IN ('STRING','NUMBER','BOOLEAN','DATE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Parámetros de configuración global del sistema';

-- ------------------------------------------------------------------------------
-- 5. PERMISOS del módulo (formato MODULO_ACCION)
-- ------------------------------------------------------------------------------
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('UNIVERSIDAD_VIEW',   'UNIVERSIDAD', 'Permite consultar la información institucional', 'DBA_SENIOR'),
('UNIVERSIDAD_EDIT',   'UNIVERSIDAD', 'Permite actualizar la información institucional', 'DBA_SENIOR'),
('UNIVERSIDAD_EXPORT', 'UNIVERSIDAD', 'Permite exportar la información institucional', 'DBA_SENIOR'),
('SEDE_VIEW',          'SEDE',        'Permite consultar sedes y campus', 'DBA_SENIOR'),
('SEDE_CREATE',        'SEDE',        'Permite registrar nuevas sedes o campus', 'DBA_SENIOR'),
('SEDE_EDIT',          'SEDE',        'Permite modificar sedes y campus', 'DBA_SENIOR'),
('SEDE_DELETE',        'SEDE',        'Permite desactivar sedes y campus', 'DBA_SENIOR'),
('SEDE_EXPORT',        'SEDE',        'Permite exportar el catálogo de sedes', 'DBA_SENIOR'),
('AUTORIDAD_VIEW',     'AUTORIDAD',   'Permite consultar las autoridades universitarias', 'DBA_SENIOR'),
('AUTORIDAD_CREATE',   'AUTORIDAD',   'Permite registrar autoridades universitarias', 'DBA_SENIOR'),
('AUTORIDAD_EDIT',     'AUTORIDAD',   'Permite modificar autoridades universitarias', 'DBA_SENIOR'),
('AUTORIDAD_DELETE',   'AUTORIDAD',   'Permite desactivar autoridades universitarias', 'DBA_SENIOR'),
('AUTORIDAD_EXPORT',   'AUTORIDAD',   'Permite exportar el padrón de autoridades', 'DBA_SENIOR'),
('PARAMETRO_VIEW',     'PARAMETRO',   'Permite consultar los parámetros globales', 'DBA_SENIOR'),
('PARAMETRO_EDIT',     'PARAMETRO',   'Permite actualizar los parámetros globales', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`), `modulo` = VALUES(`modulo`);

-- Asignación de todos los permisos del módulo a ROLE_UNIVERSIDAD
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r CROSS JOIN `tb_permisos` p
WHERE r.nombre = 'ROLE_UNIVERSIDAD'
  AND p.nombre IN (
      'UNIVERSIDAD_VIEW','UNIVERSIDAD_EDIT','UNIVERSIDAD_EXPORT',
      'SEDE_VIEW','SEDE_CREATE','SEDE_EDIT','SEDE_DELETE','SEDE_EXPORT',
      'AUTORIDAD_VIEW','AUTORIDAD_CREATE','AUTORIDAD_EDIT','AUTORIDAD_DELETE','AUTORIDAD_EXPORT',
      'PARAMETRO_VIEW','PARAMETRO_EDIT'
  );

-- ------------------------------------------------------------------------------
-- 6. DATOS SEMILLA
-- ------------------------------------------------------------------------------
-- 6.1 Institución matriz
INSERT INTO `tb_universidad`
    (`nombre`, `nombre_corto`, `lema`, `tipo_institucion`, `ruc`,
     `resolucion_licenciamiento`, `estado_licenciamiento`, `vigencia_acreditacion`,
     `fecha_fundacion`, `direccion`, `telefono`, `email`, `sitio_web`, `created_by`)
SELECT 'Universidad Nacional de Innovación & Tecnología', 'UNINTEP',
       'Scientia, Veritas et Progressus (Ciencia, Verdad y Progreso)', 'PUBLICA', '20548763921',
       'Res. CD N° 048-2022-SUNEDU', 'LICENCIADA', '2030-12-31',
       '1998-03-15', 'Av. Universitaria 1450, Cercado de Lima, Lima', '+51 1 4567890',
       'informes@unintep.edu.pe', 'https://www.unintep.edu.pe', 'DBA_SENIOR'
WHERE NOT EXISTS (SELECT 1 FROM `tb_universidad`);

-- 6.2 Sedes y campus
INSERT INTO `tb_sedes`
    (`universidad_id`, `nombre`, `codigo`, `tipo`, `direccion`, `distrito`, `ciudad`, `region`,
     `telefono`, `email`, `aforo`, `num_pabellones`, `num_laboratorios`, `created_by`)
SELECT u.id, 'Campus Central Tecnológico', 'SEDE-CENTRAL', 'SEDE_PRINCIPAL',
       'Av. Universitaria 1450', 'Cercado de Lima', 'Lima', 'Lima',
       '+51 1 4567890', 'campus.central@unintep.edu.pe', 5000, 8, 24, 'DBA_SENIOR'
FROM `tb_universidad` u
WHERE u.nombre_corto = 'UNINTEP'
  AND NOT EXISTS (SELECT 1 FROM `tb_sedes` WHERE `codigo` = 'SEDE-CENTRAL');

INSERT INTO `tb_sedes`
    (`universidad_id`, `nombre`, `codigo`, `tipo`, `direccion`, `distrito`, `ciudad`, `region`,
     `telefono`, `email`, `aforo`, `num_pabellones`, `num_laboratorios`, `created_by`)
SELECT u.id, 'Campus de Ciencias de la Salud', 'CAMPUS-SALUD', 'CAMPUS',
       'Av. Brasil 2240', 'Jesús María', 'Lima', 'Lima',
       '+51 1 4567892', 'campus.salud@unintep.edu.pe', 2200, 4, 16, 'DBA_SENIOR'
FROM `tb_universidad` u
WHERE u.nombre_corto = 'UNINTEP'
  AND NOT EXISTS (SELECT 1 FROM `tb_sedes` WHERE `codigo` = 'CAMPUS-SALUD');

INSERT INTO `tb_sedes`
    (`universidad_id`, `nombre`, `codigo`, `tipo`, `direccion`, `distrito`, `ciudad`, `region`,
     `telefono`, `email`, `aforo`, `num_pabellones`, `num_laboratorios`, `created_by`)
SELECT u.id, 'Campus Norte de Humanidades y Derecho', 'FILIAL-NORTE', 'FILIAL',
       'Av. Túpac Amaru 3890', 'Comas', 'Lima', 'Lima',
       '+51 1 4567893', 'campus.norte@unintep.edu.pe', 1800, 5, 10, 'DBA_SENIOR'
FROM `tb_universidad` u
WHERE u.nombre_corto = 'UNINTEP'
  AND NOT EXISTS (SELECT 1 FROM `tb_sedes` WHERE `codigo` = 'FILIAL-NORTE');

-- 6.3 Autoridades rectorales
INSERT INTO `tb_autoridades`
    (`universidad_id`, `cargo`, `nombres`, `apellidos`, `grado_academico`, `documento_identidad`,
     `email`, `telefono`, `despacho`, `periodo_inicio`, `periodo_fin`, `resolucion_nombramiento`, `created_by`)
SELECT u.id, 'Rector', 'Alejandro', 'Morales Cisneros',
       'Ph.D. en Ciencias de la Educación, Universidad de Salamanca', '09876543',
       'rectorado@unintep.edu.pe', '+51 1 4567891', 'Pabellón Rectoral - Piso 4',
       '2024-01-01', '2029-12-31', 'Res. AU N° 001-2024', 'DBA_SENIOR'
FROM `tb_universidad` u
WHERE u.nombre_corto = 'UNINTEP'
  AND NOT EXISTS (SELECT 1 FROM `tb_autoridades` WHERE `cargo` = 'Rector');

INSERT INTO `tb_autoridades`
    (`universidad_id`, `cargo`, `nombres`, `apellidos`, `grado_academico`, `documento_identidad`,
     `email`, `telefono`, `despacho`, `periodo_inicio`, `periodo_fin`, `resolucion_nombramiento`, `created_by`)
SELECT u.id, 'Vicerrectora Académica', 'Carmen', 'Mendoza Villavicencio',
       'Dra. en Ingeniería de Software, Pontificia Universidad Católica del Perú', '08765432',
       'vracademico@unintep.edu.pe', '+51 1 4567894', 'Edificio Central - Piso 3',
       '2024-01-01', '2029-12-31', 'Res. AU N° 002-2024', 'DBA_SENIOR'
FROM `tb_universidad` u
WHERE u.nombre_corto = 'UNINTEP'
  AND NOT EXISTS (SELECT 1 FROM `tb_autoridades` WHERE `cargo` = 'Vicerrectora Académica');

INSERT INTO `tb_autoridades`
    (`universidad_id`, `cargo`, `nombres`, `apellidos`, `grado_academico`, `documento_identidad`,
     `email`, `telefono`, `despacho`, `periodo_inicio`, `periodo_fin`, `resolucion_nombramiento`, `created_by`)
SELECT u.id, 'Vicerrector de Investigación', 'Fernando', 'Sotomayor Arana',
       'Ph.D. en Biotecnología y Bioingeniería, Massachusetts Institute of Technology', '07654321',
       'vrinvestigacion@unintep.edu.pe', '+51 1 4567895', 'Centro de Investigación Avanzada',
       '2024-01-01', '2029-12-31', 'Res. AU N° 003-2024', 'DBA_SENIOR'
FROM `tb_universidad` u
WHERE u.nombre_corto = 'UNINTEP'
  AND NOT EXISTS (SELECT 1 FROM `tb_autoridades` WHERE `cargo` = 'Vicerrector de Investigación');

-- 6.4 Parámetros globales del sistema
INSERT INTO `tb_parametros` (`clave`, `valor`, `tipo_valor`, `modulo`, `descripcion`, `created_by`) VALUES
('PERIODO_ACADEMICO_ACTUAL',       '2026-I',        'STRING',  'ACADEMICO', 'Periodo académico vigente', 'DBA_SENIOR'),
('NOTA_MINIMA_APROBATORIA',        '11',            'NUMBER',  'ACADEMICO', 'Nota mínima aprobatoria (escala 0-20)', 'DBA_SENIOR'),
('MAX_CREDITOS_POR_PERIODO',       '22',            'NUMBER',  'ACADEMICO', 'Máximo de créditos matriculables por periodo', 'DBA_SENIOR'),
('PERMITE_MATRICULA_EXTEMPORANEA', 'true',          'BOOLEAN', 'ACADEMICO', 'Habilita la matrícula extemporánea', 'DBA_SENIOR'),
('MONEDA_INSTITUCIONAL',           'PEN',           'STRING',  'FINANZAS',  'Moneda oficial para conceptos económicos', 'DBA_SENIOR'),
('ZONA_HORARIA',                   'America/Lima',  'STRING',  'SISTEMA',   'Zona horaria institucional (TZ database)', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

-- ------------------------------------------------------------------------------
-- 7. CONTROL DE VERSIÓN DE ESQUEMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_04', 'Módulo Universidad',
       'Institución matriz, sedes/campus, autoridades rectorales y parametrización global. Permisos UNIVERSIDAD/SEDE/AUTORIDAD/PARAMETRO.',
       'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_04');
