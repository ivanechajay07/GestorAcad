-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL - MIGRACIÓN FASE 6
-- Módulo: Estudiante (Expediente estudiantil, datos personales, historial de
--         ingreso y estado académico)
-- Motor: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci
-- ==============================================================================

USE `gestoracad_db`;

-- Garantiza que el cliente interprete correctamente los caracteres UTF-8 (acentos)
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 1. TABLA: tb_estudiantes (Expediente y padrón estudiantil)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_estudiantes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `codigo` VARCHAR(20) NOT NULL COMMENT 'Código de matrícula único del estudiante',
    `nombres` VARCHAR(150) NOT NULL,
    `apellidos` VARCHAR(150) NOT NULL,
    `documento_identidad` VARCHAR(20) NULL COMMENT 'DNI / pasaporte / carné de extranjería',
    `email` VARCHAR(100) NULL,
    `telefono` VARCHAR(25) NULL,
    `fecha_nacimiento` DATE NULL,
    `genero` VARCHAR(20) NULL COMMENT 'MASCULINO, FEMENINO u OTRO',
    `direccion` VARCHAR(255) NULL,
    `carrera` VARCHAR(200) NULL COMMENT 'Carrera / escuela profesional',
    `facultad` VARCHAR(200) NULL COMMENT 'Facultad de adscripción',
    `ciclo_actual` INT NOT NULL DEFAULT 1 COMMENT 'Ciclo académico actual',
    `creditos_aprobados` INT NOT NULL DEFAULT 0 COMMENT 'Créditos acumulados aprobados',
    `promedio_ponderado` DECIMAL(4,2) NOT NULL DEFAULT 0.00 COMMENT 'Promedio ponderado acumulado (escala 0-20)',
    `condicion` VARCHAR(30) NOT NULL DEFAULT 'REGULAR' COMMENT 'REGULAR, OBSERVADO, EGRESADO, TERCIO_SUPERIOR o DECIMO_SUPERIOR',
    `estado_matricula` VARCHAR(30) NOT NULL DEFAULT 'MATRICULADO' COMMENT 'MATRICULADO, PENDIENTE, RESERVA o SUSPENDIDO',
    `periodo_ingreso` VARCHAR(20) NULL COMMENT 'Periodo académico de ingreso (ej. 2023-I)',
    `modalidad_ingreso` VARCHAR(40) NULL COMMENT 'Modalidad de admisión',
    `colegio_procedencia` VARCHAR(200) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `uk_estudiantes_codigo` UNIQUE (`codigo`),
    CONSTRAINT `uk_estudiantes_documento` UNIQUE (`documento_identidad`),
    CONSTRAINT `chk_estudiantes_genero` CHECK (`genero` IS NULL OR `genero` IN ('MASCULINO','FEMENINO','OTRO')),
    CONSTRAINT `chk_estudiantes_condicion` CHECK (`condicion` IN ('REGULAR','OBSERVADO','EGRESADO','TERCIO_SUPERIOR','DECIMO_SUPERIOR')),
    CONSTRAINT `chk_estudiantes_matricula` CHECK (`estado_matricula` IN ('MATRICULADO','PENDIENTE','RESERVA','SUSPENDIDO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Expediente y padrón estudiantil';

-- ------------------------------------------------------------------------------
-- 2. TABLA: tb_estudiante_admisiones (Historial de ingreso)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_estudiante_admisiones` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `estudiante_id` BIGINT NOT NULL,
    `modalidad` VARCHAR(40) NOT NULL COMMENT 'Modalidad de admisión',
    `periodo` VARCHAR(20) NOT NULL COMMENT 'Periodo académico de ingreso',
    `colegio_procedencia` VARCHAR(200) NULL,
    `puntaje` DECIMAL(5,2) NULL COMMENT 'Puntaje obtenido en el proceso de admisión',
    `fecha_admision` DATE NULL,
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ADMITIDO' COMMENT 'ADMITIDO, MATRICULADO o RETIRADO',
    `observacion` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `fk_admisiones_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_admisiones_estado` CHECK (`estado` IN ('ADMITIDO','MATRICULADO','RETIRADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de ingreso y admisión del estudiante';

-- ------------------------------------------------------------------------------
-- 3. PERMISOS del módulo (formato MODULO_ACCION)
-- ------------------------------------------------------------------------------
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('ESTUDIANTE_VIEW',   'ESTUDIANTE', 'Permite consultar el padrón estudiantil', 'DBA_SENIOR'),
('ESTUDIANTE_CREATE', 'ESTUDIANTE', 'Permite registrar nuevos estudiantes', 'DBA_SENIOR'),
('ESTUDIANTE_EDIT',   'ESTUDIANTE', 'Permite modificar expedientes estudiantiles', 'DBA_SENIOR'),
('ESTUDIANTE_DELETE', 'ESTUDIANTE', 'Permite desactivar estudiantes', 'DBA_SENIOR'),
('ESTUDIANTE_EXPORT', 'ESTUDIANTE', 'Permite exportar el padrón estudiantil', 'DBA_SENIOR'),
('ADMISION_VIEW',     'ADMISION',   'Permite consultar el historial de ingreso', 'DBA_SENIOR'),
('ADMISION_CREATE',   'ADMISION',   'Permite registrar ingresos y admisiones', 'DBA_SENIOR'),
('ADMISION_EDIT',     'ADMISION',   'Permite modificar el historial de ingreso', 'DBA_SENIOR'),
('ADMISION_DELETE',   'ADMISION',   'Permite eliminar registros de ingreso', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`), `modulo` = VALUES(`modulo`);

-- Asignación de todos los permisos del módulo a ROLE_UNIVERSIDAD
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r CROSS JOIN `tb_permisos` p
WHERE r.nombre = 'ROLE_UNIVERSIDAD'
  AND p.nombre IN (
      'ESTUDIANTE_VIEW','ESTUDIANTE_CREATE','ESTUDIANTE_EDIT','ESTUDIANTE_DELETE','ESTUDIANTE_EXPORT',
      'ADMISION_VIEW','ADMISION_CREATE','ADMISION_EDIT','ADMISION_DELETE'
  );

-- ------------------------------------------------------------------------------
-- 4. DATOS SEMILLA
-- ------------------------------------------------------------------------------
-- 4.1 Estudiantes del padrón
INSERT INTO `tb_estudiantes`
    (`codigo`, `nombres`, `apellidos`, `documento_identidad`, `email`, `telefono`, `fecha_nacimiento`,
     `genero`, `direccion`, `carrera`, `facultad`, `ciclo_actual`, `creditos_aprobados`,
     `promedio_ponderado`, `condicion`, `estado_matricula`, `periodo_ingreso`, `modalidad_ingreso`,
     `colegio_procedencia`, `created_by`) VALUES
('2023-010482', 'Lucía', 'Vega Cárdenas', '74829103', 'lucia.vega@gestoracad.edu', '+51 912345678', '2004-05-12',
 'FEMENINO', 'Av. Los Álamos 320, San Miguel, Lima', 'Ingeniería de Sistemas e Informática', 'Facultad de Ingeniería y Arquitectura', 6, 114,
 17.85, 'TERCIO_SUPERIOR', 'MATRICULADO', '2023-I', 'ORDINARIO', 'I.E. Colegio Nacional San Agustín', 'DBA_SENIOR'),
('2022-020914', 'Rodrigo', 'Mendoza Tapia', '71928401', 'rodrigo.mendoza@gestoracad.edu', '+51 923456781', '2003-09-30',
 'MASCULINO', 'Jr. Amazonas 1450, Cercado de Lima, Lima', 'Ingeniería de Sistemas e Informática', 'Facultad de Ingeniería y Arquitectura', 8, 148,
 16.42, 'REGULAR', 'MATRICULADO', '2022-I', 'ORDINARIO', 'I.E. Colegio La Salle', 'DBA_SENIOR'),
('2024-010115', 'Valeria', 'Quispe Salazar', '76102934', 'valeria.quispe@gestoracad.edu', '+51 934567812', '2005-01-22',
 'FEMENINO', 'Av. Brasil 2240, Jesús María, Lima', 'Medicina Humana', 'Facultad de Ciencias de la Salud', 4, 76,
 18.20, 'DECIMO_SUPERIOR', 'MATRICULADO', '2024-I', 'ORDINARIO', 'I.E. Colegio Santa María', 'DBA_SENIOR'),
('2021-020883', 'Gonzalo', 'Fernández Alva', '70293819', 'gonzalo.fernandez@gestoracad.edu', '+51 945678123', '2002-11-05',
 'MASCULINO', 'Calle Cantuarias 210, Miraflores, Lima', 'Administración de Negocios Globales', 'Facultad de Ciencias Económicas y Empresariales', 9, 172,
 15.30, 'REGULAR', 'MATRICULADO', '2021-I', 'TRASLADO_EXTERNO', 'Universidad de Piura', 'DBA_SENIOR'),
('2023-010552', 'Camila', 'Paredes Ugarte', '73940281', 'camila.paredes@gestoracad.edu', '+51 956781234', '2004-03-18',
 'FEMENINO', 'Av. Túpac Amaru 3890, Comas, Lima', 'Derecho y Ciencias Políticas', 'Facultad de Derecho y Ciencias Políticas', 5, 92,
 14.15, 'REGULAR', 'MATRICULADO', '2023-I', 'ORDINARIO', 'I.E. Colegio Nacional Comas', 'DBA_SENIOR'),
('2024-020311', 'Sebastián', 'Morales Wong', '78291044', 'sebastian.morales@gestoracad.edu', '+51 967812345', '2005-07-09',
 'MASCULINO', 'Av. Universitaria 1450, Cercado de Lima, Lima', 'Ingeniería Civil', 'Facultad de Ingeniería y Arquitectura', 3, 48,
 13.80, 'OBSERVADO', 'MATRICULADO', '2024-II', 'ORDINARIO', 'I.E. Colegio Bruning', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- 4.2 Historial de ingreso
INSERT INTO `tb_estudiante_admisiones`
    (`estudiante_id`, `modalidad`, `periodo`, `colegio_procedencia`, `puntaje`, `fecha_admision`, `estado`, `observacion`, `created_by`)
SELECT e.id, 'ORDINARIO', '2023-I', 'I.E. Colegio Nacional San Agustín', 16.85, '2023-03-05', 'MATRICULADO',
       'Ingreso por evaluación ordinaria', 'DBA_SENIOR'
FROM `tb_estudiantes` e WHERE e.codigo = '2023-010482'
  AND NOT EXISTS (SELECT 1 FROM `tb_estudiante_admisiones` a WHERE a.estudiante_id = e.id AND a.periodo = '2023-I');

INSERT INTO `tb_estudiante_admisiones`
    (`estudiante_id`, `modalidad`, `periodo`, `colegio_procedencia`, `puntaje`, `fecha_admision`, `estado`, `observacion`, `created_by`)
SELECT e.id, 'ORDINARIO', '2022-I', 'I.E. Colegio La Salle', 15.40, '2022-03-04', 'MATRICULADO',
       'Ingreso por evaluación ordinaria', 'DBA_SENIOR'
FROM `tb_estudiantes` e WHERE e.codigo = '2022-020914'
  AND NOT EXISTS (SELECT 1 FROM `tb_estudiante_admisiones` a WHERE a.estudiante_id = e.id AND a.periodo = '2022-I');

INSERT INTO `tb_estudiante_admisiones`
    (`estudiante_id`, `modalidad`, `periodo`, `colegio_procedencia`, `puntaje`, `fecha_admision`, `estado`, `observacion`, `created_by`)
SELECT e.id, 'ORDINARIO', '2024-I', 'I.E. Colegio Santa María', 18.30, '2024-03-02', 'MATRICULADO',
       'Mérito destacado en el proceso de admisión', 'DBA_SENIOR'
FROM `tb_estudiantes` e WHERE e.codigo = '2024-010115'
  AND NOT EXISTS (SELECT 1 FROM `tb_estudiante_admisiones` a WHERE a.estudiante_id = e.id AND a.periodo = '2024-I');

INSERT INTO `tb_estudiante_admisiones`
    (`estudiante_id`, `modalidad`, `periodo`, `colegio_procedencia`, `puntaje`, `fecha_admision`, `estado`, `observacion`, `created_by`)
SELECT e.id, 'TRASLADO_EXTERNO', '2021-I', 'Universidad de Piura', 16.00, '2021-02-28', 'MATRICULADO',
       'Traslado externo convalidado', 'DBA_SENIOR'
FROM `tb_estudiantes` e WHERE e.codigo = '2021-020883'
  AND NOT EXISTS (SELECT 1 FROM `tb_estudiante_admisiones` a WHERE a.estudiante_id = e.id AND a.periodo = '2021-I');

INSERT INTO `tb_estudiante_admisiones`
    (`estudiante_id`, `modalidad`, `periodo`, `colegio_procedencia`, `puntaje`, `fecha_admision`, `estado`, `observacion`, `created_by`)
SELECT e.id, 'ORDINARIO', '2023-I', 'I.E. Colegio Nacional Comas', 14.75, '2023-03-05', 'MATRICULADO',
       'Ingreso por evaluación ordinaria', 'DBA_SENIOR'
FROM `tb_estudiantes` e WHERE e.codigo = '2023-010552'
  AND NOT EXISTS (SELECT 1 FROM `tb_estudiante_admisiones` a WHERE a.estudiante_id = e.id AND a.periodo = '2023-I');

INSERT INTO `tb_estudiante_admisiones`
    (`estudiante_id`, `modalidad`, `periodo`, `colegio_procedencia`, `puntaje`, `fecha_admision`, `estado`, `observacion`, `created_by`)
SELECT e.id, 'ORDINARIO', '2024-II', 'I.E. Colegio Bruning', 13.90, '2024-08-10', 'MATRICULADO',
       'Ingreso por evaluación ordinaria', 'DBA_SENIOR'
FROM `tb_estudiantes` e WHERE e.codigo = '2024-020311'
  AND NOT EXISTS (SELECT 1 FROM `tb_estudiante_admisiones` a WHERE a.estudiante_id = e.id AND a.periodo = '2024-II');

-- ------------------------------------------------------------------------------
-- 5. CONTROL DE VERSIÓN DE ESQUEMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_06', 'Módulo Estudiante',
       'Expediente estudiantil, datos personales, historial de ingreso y estado académico. Permisos ESTUDIANTE/ADMISION.',
       'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_06');
