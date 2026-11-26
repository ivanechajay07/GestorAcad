-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL - MIGRACIÓN FASE 9
-- Módulo: Catálogo académico editable (facultades y carreras)
-- Motor: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci
-- ------------------------------------------------------------------------------
-- Objetivo:
--   1. Registrar los permisos MODULO_ACCION que protegen el CRUD del catálogo
--      de facultades y carreras expuesto en el módulo Universidad.
--   2. Asignarlos al rol institucional ROLE_UNIVERSIDAD (administrador global)
--      y a cualquier rol que ya administre sedes (SEDE_VIEW).
--   3. Verificar la integridad del catálogo tras la normalización de la Fase 8.
--
-- El script es idempotente: puede aplicarse varias veces sin duplicar permisos
-- ni asignaciones.
-- ==============================================================================

USE `gestoracad_db`;

SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 1. PERMISOS DEL CATÁLOGO ACADÉMICO
-- ------------------------------------------------------------------------------
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('FACULTAD_VIEW',   'FACULTAD', 'Permite consultar el catálogo de facultades', 'DBA_SENIOR'),
('FACULTAD_CREATE', 'FACULTAD', 'Permite registrar nuevas facultades', 'DBA_SENIOR'),
('FACULTAD_EDIT',   'FACULTAD', 'Permite modificar facultades existentes', 'DBA_SENIOR'),
('FACULTAD_DELETE', 'FACULTAD', 'Permite desactivar facultades sin dependencias activas', 'DBA_SENIOR'),
('CARRERA_VIEW',    'CARRERA',  'Permite consultar el catálogo de carreras', 'DBA_SENIOR'),
('CARRERA_CREATE',  'CARRERA',  'Permite registrar nuevas carreras', 'DBA_SENIOR'),
('CARRERA_EDIT',    'CARRERA',  'Permite modificar carreras y su facultad', 'DBA_SENIOR'),
('CARRERA_DELETE',  'CARRERA',  'Permite desactivar carreras sin estudiantes activos', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE
    `descripcion` = VALUES(`descripcion`),
    `modulo` = VALUES(`modulo`);

-- ------------------------------------------------------------------------------
-- 2. ASIGNACIÓN A ROLE_UNIVERSIDAD
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id
  FROM `tb_roles` r
 CROSS JOIN `tb_permisos` p
 WHERE r.nombre = 'ROLE_UNIVERSIDAD'
   AND p.nombre IN (
       'FACULTAD_VIEW','FACULTAD_CREATE','FACULTAD_EDIT','FACULTAD_DELETE',
       'CARRERA_VIEW','CARRERA_CREATE','CARRERA_EDIT','CARRERA_DELETE'
   );

-- Cualquier rol que ya administre sedes recibe también el catálogo académico.
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT DISTINCT rp.rol_id, p.id
  FROM `tb_rol_permiso` rp
  JOIN `tb_permisos` sede ON sede.id = rp.permiso_id AND sede.nombre = 'SEDE_VIEW'
 CROSS JOIN `tb_permisos` p
 WHERE p.nombre IN (
       'FACULTAD_VIEW','FACULTAD_CREATE','FACULTAD_EDIT','FACULTAD_DELETE',
       'CARRERA_VIEW','CARRERA_CREATE','CARRERA_EDIT','CARRERA_DELETE'
   );

-- ------------------------------------------------------------------------------
-- 3. CONTROL DE VERSIÓN DE ESQUEMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version`
    (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_09',
       'Catálogo académico editable',
       'Permisos FACULTAD_* y CARRERA_* para el CRUD de facultades y carreras del módulo Universidad.',
       'DBA_SENIOR',
       'SUCCESS'
 WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_09');

-- ------------------------------------------------------------------------------
-- 4. VERIFICACIÓN RÁPIDA
-- ------------------------------------------------------------------------------
SELECT 'facultades' AS entidad, COUNT(*) AS total FROM `tb_facultades`
UNION ALL
SELECT 'carreras', COUNT(*) FROM `tb_carreras`
UNION ALL
SELECT 'permisos_catalogo', COUNT(*) FROM `tb_permisos`
 WHERE `modulo` IN ('FACULTAD', 'CARRERA');
