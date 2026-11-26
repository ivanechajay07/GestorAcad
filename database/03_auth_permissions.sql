-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL - MIGRACIÓN FASE 3
-- Módulo: Autenticación, Permisos (formato MODULO_ACCION), Auditoría extendida
-- Motor: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci
-- ==============================================================================

USE `gestoracad_db`;

-- Garantiza que el cliente interprete correctamente los caracteres UTF-8 (acentos)
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 1. AUDITORÍA: campos requeridos por la especificación (sección 9)
--    entidad, id_entidad, user_agent + acciones EXPORT/IMPORT
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_add_column_if_missing`;
DELIMITER $$
CREATE PROCEDURE `sp_add_column_if_missing`(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_ddl TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
    ) THEN
        SET @ddl = p_ddl;
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL `sp_add_column_if_missing`('tb_auditoria', 'entidad',
    'ALTER TABLE `tb_auditoria` ADD COLUMN `entidad` VARCHAR(100) NULL COMMENT ''Nombre de la entidad afectada (ej. tb_usuarios)'' AFTER `ip_origen`');
CALL `sp_add_column_if_missing`('tb_auditoria', 'id_entidad',
    'ALTER TABLE `tb_auditoria` ADD COLUMN `id_entidad` BIGINT NULL COMMENT ''ID de la entidad afectada'' AFTER `entidad`');
CALL `sp_add_column_if_missing`('tb_auditoria', 'user_agent',
    'ALTER TABLE `tb_auditoria` ADD COLUMN `user_agent` VARCHAR(500) NULL COMMENT ''User-Agent del cliente solicitante'' AFTER `id_entidad`');

DROP PROCEDURE IF EXISTS `sp_add_column_if_missing`;

ALTER TABLE `tb_auditoria`
    DROP CHECK `chk_auditoria_accion`,
    ADD CONSTRAINT `chk_auditoria_accion` CHECK (`accion` IN ('LOGIN','LOGOUT','CREATE','UPDATE','DELETE','VIEW','EXPORT','IMPORT'));

-- ------------------------------------------------------------------------------
-- 2. USUARIOS: bloqueo por intentos fallidos (Fase 3)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_add_column_if_missing2`;
DELIMITER $$
CREATE PROCEDURE `sp_add_column_if_missing2`(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_ddl TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
    ) THEN
        SET @ddl = p_ddl;
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL `sp_add_column_if_missing2`('tb_usuarios', 'intentos_fallidos',
    'ALTER TABLE `tb_usuarios` ADD COLUMN `intentos_fallidos` INT NOT NULL DEFAULT 0 COMMENT ''Contador de intentos de login fallidos consecutivos'' AFTER `credenciales_expiradas`');
CALL `sp_add_column_if_missing2`('tb_usuarios', 'bloqueado_hasta',
    'ALTER TABLE `tb_usuarios` ADD COLUMN `bloqueado_hasta` TIMESTAMP NULL DEFAULT NULL COMMENT ''Fecha/hora hasta la cual la cuenta permanece bloqueada'' AFTER `intentos_fallidos`');

DROP PROCEDURE IF EXISTS `sp_add_column_if_missing2`;

-- ------------------------------------------------------------------------------
-- 3. PERMISOS: formato oficial MODULO_ACCION (VIEW/CREATE/EDIT/DELETE/EXPORT/IMPORT)
--    Se reemplazan los permisos provisionales de Fase 2.
-- ------------------------------------------------------------------------------
START TRANSACTION;

-- Permisos de SEGURIDAD (módulo USUARIO)
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('USUARIO_VIEW',   'USUARIO', 'Permite consultar el listado y detalle de usuarios', 'DBA_SENIOR'),
('USUARIO_CREATE', 'USUARIO', 'Permite registrar nuevos usuarios en la plataforma', 'DBA_SENIOR'),
('USUARIO_EDIT',   'USUARIO', 'Permite editar datos y estado de usuarios existentes', 'DBA_SENIOR'),
('USUARIO_DELETE', 'USUARIO', 'Permite deshabilitar o eliminar cuentas de usuario', 'DBA_SENIOR'),
('USUARIO_EXPORT', 'USUARIO', 'Permite exportar el listado de usuarios', 'DBA_SENIOR'),
('USUARIO_IMPORT', 'USUARIO', 'Permite importar usuarios en lote', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

-- Permisos de ROLES Y PERMISOS (módulo ROL)
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('ROL_VIEW',   'ROL', 'Permite consultar catálogo de roles y permisos', 'DBA_SENIOR'),
('ROL_CREATE', 'ROL', 'Permite crear roles institucionales', 'DBA_SENIOR'),
('ROL_EDIT',   'ROL', 'Permite modificar roles y sus permisos asociados', 'DBA_SENIOR'),
('ROL_DELETE', 'ROL', 'Permite eliminar roles no utilizados', 'DBA_SENIOR'),
('ROL_EXPORT', 'ROL', 'Permite exportar el catálogo de roles', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

-- Permisos de AUDITORÍA (módulo AUDITORIA)
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('AUDITORIA_VIEW',   'AUDITORIA', 'Permite inspeccionar la bitácora de auditoría transaccional', 'DBA_SENIOR'),
('AUDITORIA_EXPORT', 'AUDITORIA', 'Permite exportar reportes de auditoría', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

-- Permisos académicos provisionales (mantenidos de Fase 2 con nuevo formato)
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('UNIVERSIDAD_VIEW', 'UNIVERSIDAD', 'Permite consultar la información institucional', 'DBA_SENIOR'),
('CURSO_VIEW',       'DOCENTE',     'Permite a los docentes ver sus cursos asignados', 'DBA_SENIOR'),
('FICHA_VIEW',       'ESTUDIANTE',  'Permite al estudiante consultar su ficha académica', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

-- Reasignación de permisos a roles en el nuevo formato
DELETE FROM `tb_rol_permiso` WHERE `permiso_id` IN (
    SELECT `id` FROM `tb_permisos` WHERE `nombre` IN
    ('USUARIOS_READ','USUARIOS_CREATE','USUARIOS_UPDATE','USUARIOS_DELETE','ROLES_READ','AUDITORIA_READ','UNIVERSIDAD_MANAGE','CURSOS_DOCENTE_READ','FICHA_ESTUDIANTE_READ')
);

-- ROLE_UNIVERSIDAD: todos los permisos
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r CROSS JOIN `tb_permisos` p WHERE r.nombre = 'ROLE_UNIVERSIDAD';

-- ROLE_DOCENTE: solo lectura de cursos y roles
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r, `tb_permisos` p
WHERE r.nombre = 'ROLE_DOCENTE' AND p.nombre IN ('CURSO_VIEW','ROL_VIEW');

-- ROLE_ESTUDIANTE: solo su ficha
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r, `tb_permisos` p
WHERE r.nombre = 'ROLE_ESTUDIANTE' AND p.nombre IN ('FICHA_VIEW');

-- Eliminar permisos provisionales de Fase 2 (ya migrados al nuevo formato)
DELETE FROM `tb_rol_permiso` WHERE `permiso_id` IN (
    SELECT `id` FROM `tb_permisos` WHERE `nombre` IN
    ('USUARIOS_READ','USUARIOS_CREATE','USUARIOS_UPDATE','USUARIOS_DELETE','ROLES_READ','AUDITORIA_READ','UNIVERSIDAD_MANAGE','CURSOS_DOCENTE_READ','FICHA_ESTUDIANTE_READ')
);
DELETE FROM `tb_permisos` WHERE `nombre` IN
('USUARIOS_READ','USUARIOS_CREATE','USUARIOS_UPDATE','USUARIOS_DELETE','ROLES_READ','AUDITORIA_READ','UNIVERSIDAD_MANAGE','CURSOS_DOCENTE_READ','FICHA_ESTUDIANTE_READ');

COMMIT;

-- ------------------------------------------------------------------------------
-- 4. CONTROL DE VERSIÓN DE ESQUEMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
VALUES ('FASE_03', 'Autenticación y Gestión de Usuarios',
        'Permisos formato MODULO_ACCION, auditoría extendida (entidad, id_entidad, user_agent, EXPORT/IMPORT), bloqueo por intentos fallidos.',
        'DBA_SENIOR', 'SUCCESS');
