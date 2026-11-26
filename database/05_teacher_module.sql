-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL - MIGRACIÓN FASE 5
-- Módulo: Docente (Padrón del claustro, Especialidades académicas y
--         Asignaciones / Carga lectiva)
-- Motor: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci
-- ==============================================================================

USE `gestoracad_db`;

-- Garantiza que el cliente interprete correctamente los caracteres UTF-8 (acentos)
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 1. TABLA: tb_docentes (Padrón del claustro académico)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_docentes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `codigo` VARCHAR(20) NOT NULL COMMENT 'Código institucional único del docente',
    `nombres` VARCHAR(150) NOT NULL,
    `apellidos` VARCHAR(150) NOT NULL,
    `documento_identidad` VARCHAR(20) NULL COMMENT 'DNI / pasaporte / carnet de extranjería',
    `email` VARCHAR(100) NULL,
    `telefono` VARCHAR(25) NULL,
    `grado_academico` VARCHAR(200) NULL COMMENT 'Grado académico más alto (ej. Ph.D.)',
    `titulo_profesional` VARCHAR(200) NULL,
    `categoria` VARCHAR(30) NOT NULL DEFAULT 'CONTRATADO' COMMENT 'PRINCIPAL, ASOCIADO, AUXILIAR o CONTRATADO',
    `dedicacion` VARCHAR(30) NOT NULL DEFAULT 'TIEMPO_COMPLETO' COMMENT 'TIEMPO_COMPLETO, TIEMPO_PARCIAL o DEDICACION_EXCLUSIVA',
    `facultad` VARCHAR(150) NULL COMMENT 'Facultad de adscripción',
    `departamento` VARCHAR(150) NULL COMMENT 'Departamento académico',
    `especialidad_principal` VARCHAR(200) NULL,
    `fecha_nacimiento` DATE NULL,
    `fecha_ingreso` DATE NULL,
    `direccion` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `uk_docentes_codigo` UNIQUE (`codigo`),
    CONSTRAINT `uk_docentes_documento` UNIQUE (`documento_identidad`),
    CONSTRAINT `chk_docentes_categoria` CHECK (`categoria` IN ('PRINCIPAL','ASOCIADO','AUXILIAR','CONTRATADO')),
    CONSTRAINT `chk_docentes_dedicacion` CHECK (`dedicacion` IN ('TIEMPO_COMPLETO','TIEMPO_PARCIAL','DEDICACION_EXCLUSIVA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Padrón del claustro académico (docentes)';

-- ------------------------------------------------------------------------------
-- 2. TABLA: tb_docente_especialidades (Especialidades / formación del docente)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_docente_especialidades` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `docente_id` BIGINT NOT NULL,
    `nombre` VARCHAR(150) NOT NULL COMMENT 'Nombre de la especialidad',
    `area` VARCHAR(100) NULL COMMENT 'Área de conocimiento',
    `nivel` VARCHAR(30) NOT NULL DEFAULT 'ESPECIALIDAD' COMMENT 'BACHILLER, ESPECIALIDAD, MAESTRIA, DOCTORADO o DIPLOMADO',
    `institucion` VARCHAR(200) NULL COMMENT 'Institución otorgante',
    `anio` INT NULL COMMENT 'Año de obtención',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `fk_especialidades_docente` FOREIGN KEY (`docente_id`) REFERENCES `tb_docentes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_especialidades_nivel` CHECK (`nivel` IN ('BACHILLER','ESPECIALIDAD','MAESTRIA','DOCTORADO','DIPLOMADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Especialidades académicas y formación del docente';

-- ------------------------------------------------------------------------------
-- 3. TABLA: tb_docente_asignaciones (Asignaciones lectivas / carga horaria)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_docente_asignaciones` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `docente_id` BIGINT NOT NULL,
    `periodo` VARCHAR(20) NOT NULL COMMENT 'Periodo académico (ej. 2026-I)',
    `curso` VARCHAR(200) NOT NULL COMMENT 'Curso o asignatura dictada',
    `codigo_curso` VARCHAR(20) NULL,
    `seccion` VARCHAR(10) NULL,
    `creditos` INT NULL,
    `horas_teoricas` INT NOT NULL DEFAULT 0,
    `horas_practicas` INT NOT NULL DEFAULT 0,
    `horas_totales` INT NOT NULL DEFAULT 0 COMMENT 'Carga horaria semanal total',
    `estado` VARCHAR(20) NOT NULL DEFAULT 'ASIGNADA' COMMENT 'ASIGNADA, EN_CURSO, CONCLUIDA o RETIRADA',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `fk_asignaciones_docente` FOREIGN KEY (`docente_id`) REFERENCES `tb_docentes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_asignaciones_estado` CHECK (`estado` IN ('ASIGNADA','EN_CURSO','CONCLUIDA','RETIRADA'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asignaciones lectivas y carga horaria del docente';

-- ------------------------------------------------------------------------------
-- 4. PERMISOS del módulo (formato MODULO_ACCION)
-- ------------------------------------------------------------------------------
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('DOCENTE_VIEW',       'DOCENTE',      'Permite consultar el padrón de docentes', 'DBA_SENIOR'),
('DOCENTE_CREATE',     'DOCENTE',      'Permite registrar nuevos docentes', 'DBA_SENIOR'),
('DOCENTE_EDIT',       'DOCENTE',      'Permite modificar datos de docentes', 'DBA_SENIOR'),
('DOCENTE_DELETE',     'DOCENTE',      'Permite desactivar docentes', 'DBA_SENIOR'),
('DOCENTE_EXPORT',     'DOCENTE',      'Permite exportar el padrón docente', 'DBA_SENIOR'),
('ESPECIALIDAD_VIEW',  'ESPECIALIDAD', 'Permite consultar especialidades del docente', 'DBA_SENIOR'),
('ESPECIALIDAD_CREATE','ESPECIALIDAD', 'Permite registrar especialidades del docente', 'DBA_SENIOR'),
('ESPECIALIDAD_EDIT',  'ESPECIALIDAD', 'Permite modificar especialidades del docente', 'DBA_SENIOR'),
('ESPECIALIDAD_DELETE','ESPECIALIDAD', 'Permite eliminar especialidades del docente', 'DBA_SENIOR'),
('ASIGNACION_VIEW',    'ASIGNACION',   'Permite consultar la carga lectiva del docente', 'DBA_SENIOR'),
('ASIGNACION_CREATE',  'ASIGNACION',   'Permite registrar asignaciones lectivas', 'DBA_SENIOR'),
('ASIGNACION_EDIT',    'ASIGNACION',   'Permite modificar asignaciones lectivas', 'DBA_SENIOR'),
('ASIGNACION_DELETE',  'ASIGNACION',   'Permite eliminar asignaciones lectivas', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`), `modulo` = VALUES(`modulo`);

-- Asignación de todos los permisos del módulo a ROLE_UNIVERSIDAD
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r CROSS JOIN `tb_permisos` p
WHERE r.nombre = 'ROLE_UNIVERSIDAD'
  AND p.nombre IN (
      'DOCENTE_VIEW','DOCENTE_CREATE','DOCENTE_EDIT','DOCENTE_DELETE','DOCENTE_EXPORT',
      'ESPECIALIDAD_VIEW','ESPECIALIDAD_CREATE','ESPECIALIDAD_EDIT','ESPECIALIDAD_DELETE',
      'ASIGNACION_VIEW','ASIGNACION_CREATE','ASIGNACION_EDIT','ASIGNACION_DELETE'
  );

-- Los docentes pueden consultar el claustro, sus especialidades y su carga lectiva
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r CROSS JOIN `tb_permisos` p
WHERE r.nombre = 'ROLE_DOCENTE'
  AND p.nombre IN ('DOCENTE_VIEW','ESPECIALIDAD_VIEW','ASIGNACION_VIEW');

-- ------------------------------------------------------------------------------
-- 5. DATOS SEMILLA
-- ------------------------------------------------------------------------------
-- 5.1 Docentes del claustro
INSERT INTO `tb_docentes`
    (`codigo`, `nombres`, `apellidos`, `documento_identidad`, `email`, `telefono`,
     `grado_academico`, `titulo_profesional`, `categoria`, `dedicacion`, `facultad`,
     `departamento`, `especialidad_principal`, `fecha_ingreso`, `created_by`) VALUES
('DOC-201402', 'Carlos Alberto', 'Santana Ríos', '41258963', 'carlos.santana@unintep.edu.pe', '+51 987654321',
 'Doctor en Ciencias de la Computación (Ph.D.)', 'Ingeniero de Sistemas', 'PRINCIPAL', 'TIEMPO_COMPLETO',
 'Facultad de Ingeniería y Arquitectura', 'Ingeniería de Software y Sistemas', 'Ingeniería de Software', '2014-03-01', 'DBA_SENIOR'),
('DOC-201844', 'Elena', 'Vargas Llosa', '44512789', 'elena.vargas@unintep.edu.pe', '+51 987654322',
 'Doctora en Inteligencia Artificial y Ciencia de Datos', 'Ingeniera en Informática', 'PRINCIPAL', 'DEDICACION_EXCLUSIVA',
 'Facultad de Ingeniería y Arquitectura', 'Ciencias de la Computación', 'Inteligencia Artificial', '2018-08-15', 'DBA_SENIOR'),
('DOC-201612', 'Jorge Luis', 'Ramírez Carranza', '42369871', 'jorge.ramirez@unintep.edu.pe', '+51 987654323',
 'Médico Cirujano con Maestría en Educación Superior', 'Médico Cirujano', 'ASOCIADO', 'TIEMPO_COMPLETO',
 'Facultad de Ciencias de la Salud', 'Morfología Médica', 'Anatomía Humana', '2016-04-01', 'DBA_SENIOR'),
('DOC-202031', 'Mónica Patricia', 'Barrenechea Castro', '45896321', 'monica.barrenechea@unintep.edu.pe', '+51 987654324',
 'Magíster en Finanzas Corporativas (MBA)', 'Contadora Pública', 'ASOCIADO', 'TIEMPO_PARCIAL',
 'Facultad de Ciencias Económicas y Empresariales', 'Finanzas y Contabilidad', 'Finanzas Corporativas', '2020-03-01', 'DBA_SENIOR'),
('DOC-202219', 'Víctor Hugo', 'Benítez Salazar', '43698521', 'victor.benitez@unintep.edu.pe', '+51 987654325',
 'Doctor en Derecho Constitucional', 'Abogado', 'PRINCIPAL', 'TIEMPO_PARCIAL',
 'Facultad de Derecho y Ciencias Políticas', 'Derecho Público', 'Derecho Constitucional', '2022-08-01', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- 5.2 Especialidades
INSERT INTO `tb_docente_especialidades` (`docente_id`, `nombre`, `area`, `nivel`, `institucion`, `anio`, `created_by`)
SELECT d.id, 'Ingeniería de Software', 'Tecnologías de la Información', 'DOCTORADO', 'Universidad Nacional de Ingeniería', 2014, 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201402'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_especialidades` e WHERE e.docente_id = d.id AND e.nombre = 'Ingeniería de Software');

INSERT INTO `tb_docente_especialidades` (`docente_id`, `nombre`, `area`, `nivel`, `institucion`, `anio`, `created_by`)
SELECT d.id, 'Gestión de Proyectos TI', 'Gestión y Administración', 'MAESTRIA', 'Universidad ESAN', 2011, 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201402'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_especialidades` e WHERE e.docente_id = d.id AND e.nombre = 'Gestión de Proyectos TI');

INSERT INTO `tb_docente_especialidades` (`docente_id`, `nombre`, `area`, `nivel`, `institucion`, `anio`, `created_by`)
SELECT d.id, 'Inteligencia Artificial', 'Ciencias de la Computación', 'DOCTORADO', 'Pontificia Universidad Católica del Perú', 2018, 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201844'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_especialidades` e WHERE e.docente_id = d.id AND e.nombre = 'Inteligencia Artificial');

INSERT INTO `tb_docente_especialidades` (`docente_id`, `nombre`, `area`, `nivel`, `institucion`, `anio`, `created_by`)
SELECT d.id, 'Anatomía Humana', 'Ciencias de la Salud', 'MAESTRIA', 'Universidad Nacional Mayor de San Marcos', 2015, 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201612'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_especialidades` e WHERE e.docente_id = d.id AND e.nombre = 'Anatomía Humana');

INSERT INTO `tb_docente_especialidades` (`docente_id`, `nombre`, `area`, `nivel`, `institucion`, `anio`, `created_by`)
SELECT d.id, 'Docencia Universitaria', 'Educación Superior', 'ESPECIALIDAD', 'Universidad Peruana Cayetano Heredia', 2017, 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201612'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_especialidades` e WHERE e.docente_id = d.id AND e.nombre = 'Docencia Universitaria');

INSERT INTO `tb_docente_especialidades` (`docente_id`, `nombre`, `area`, `nivel`, `institucion`, `anio`, `created_by`)
SELECT d.id, 'Finanzas Corporativas', 'Ciencias Económicas', 'MAESTRIA', 'Universidad del Pacífico', 2019, 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-202031'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_especialidades` e WHERE e.docente_id = d.id AND e.nombre = 'Finanzas Corporativas');

INSERT INTO `tb_docente_especialidades` (`docente_id`, `nombre`, `area`, `nivel`, `institucion`, `anio`, `created_by`)
SELECT d.id, 'Derecho Constitucional', 'Ciencias Jurídicas', 'DOCTORADO', 'Universidad de Salamanca', 2021, 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-202219'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_especialidades` e WHERE e.docente_id = d.id AND e.nombre = 'Derecho Constitucional');

-- 5.3 Asignaciones lectivas (periodo vigente 2026-I)
INSERT INTO `tb_docente_asignaciones`
    (`docente_id`, `periodo`, `curso`, `codigo_curso`, `seccion`, `creditos`,
     `horas_teoricas`, `horas_practicas`, `horas_totales`, `estado`, `created_by`)
SELECT d.id, '2026-I', 'Ingeniería de Software I', 'ISW-401', 'A', 4, 3, 2, 5, 'ASIGNADA', 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201402'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_asignaciones` a WHERE a.docente_id = d.id AND a.codigo_curso = 'ISW-401' AND a.periodo = '2026-I');

INSERT INTO `tb_docente_asignaciones`
    (`docente_id`, `periodo`, `curso`, `codigo_curso`, `seccion`, `creditos`,
     `horas_teoricas`, `horas_practicas`, `horas_totales`, `estado`, `created_by`)
SELECT d.id, '2026-I', 'Arquitectura de Software', 'ISW-502', 'A', 4, 3, 2, 5, 'ASIGNADA', 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201402'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_asignaciones` a WHERE a.docente_id = d.id AND a.codigo_curso = 'ISW-502' AND a.periodo = '2026-I');

INSERT INTO `tb_docente_asignaciones`
    (`docente_id`, `periodo`, `curso`, `codigo_curso`, `seccion`, `creditos`,
     `horas_teoricas`, `horas_practicas`, `horas_totales`, `estado`, `created_by`)
SELECT d.id, '2026-I', 'Inteligencia Artificial', 'IA-601', 'A', 4, 3, 2, 5, 'ASIGNADA', 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201844'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_asignaciones` a WHERE a.docente_id = d.id AND a.codigo_curso = 'IA-601' AND a.periodo = '2026-I');

INSERT INTO `tb_docente_asignaciones`
    (`docente_id`, `periodo`, `curso`, `codigo_curso`, `seccion`, `creditos`,
     `horas_teoricas`, `horas_practicas`, `horas_totales`, `estado`, `created_by`)
SELECT d.id, '2026-I', 'Machine Learning', 'IA-702', 'A', 4, 2, 3, 5, 'ASIGNADA', 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201844'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_asignaciones` a WHERE a.docente_id = d.id AND a.codigo_curso = 'IA-702' AND a.periodo = '2026-I');

INSERT INTO `tb_docente_asignaciones`
    (`docente_id`, `periodo`, `curso`, `codigo_curso`, `seccion`, `creditos`,
     `horas_teoricas`, `horas_practicas`, `horas_totales`, `estado`, `created_by`)
SELECT d.id, '2026-I', 'Anatomía Humana I', 'MED-201', 'B', 5, 3, 4, 7, 'EN_CURSO', 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-201612'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_asignaciones` a WHERE a.docente_id = d.id AND a.codigo_curso = 'MED-201' AND a.periodo = '2026-I');

INSERT INTO `tb_docente_asignaciones`
    (`docente_id`, `periodo`, `curso`, `codigo_curso`, `seccion`, `creditos`,
     `horas_teoricas`, `horas_practicas`, `horas_totales`, `estado`, `created_by`)
SELECT d.id, '2026-I', 'Finanzas Corporativas', 'FIN-501', 'A', 4, 3, 2, 5, 'ASIGNADA', 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-202031'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_asignaciones` a WHERE a.docente_id = d.id AND a.codigo_curso = 'FIN-501' AND a.periodo = '2026-I');

INSERT INTO `tb_docente_asignaciones`
    (`docente_id`, `periodo`, `curso`, `codigo_curso`, `seccion`, `creditos`,
     `horas_teoricas`, `horas_practicas`, `horas_totales`, `estado`, `created_by`)
SELECT d.id, '2026-I', 'Derecho Constitucional', 'DER-301', 'A', 4, 4, 0, 4, 'ASIGNADA', 'DBA_SENIOR'
FROM `tb_docentes` d WHERE d.codigo = 'DOC-202219'
  AND NOT EXISTS (SELECT 1 FROM `tb_docente_asignaciones` a WHERE a.docente_id = d.id AND a.codigo_curso = 'DER-301' AND a.periodo = '2026-I');

-- ------------------------------------------------------------------------------
-- 6. CONTROL DE VERSIÓN DE ESQUEMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_05', 'Módulo Docente',
       'Padrón del claustro, especialidades académicas y asignaciones/carga lectiva. Permisos DOCENTE/ESPECIALIDAD/ASIGNACION.',
       'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_05');
