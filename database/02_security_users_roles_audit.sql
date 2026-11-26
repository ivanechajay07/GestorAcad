-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL - MIGRACIÓN FASE 2
-- Módulo: Seguridad, Usuarios, Roles, Permisos y Auditoría Transaccional
-- Normalización: 3FN (Tercera Forma Normal)
-- Motor: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci
-- ==============================================================================

USE `gestoracad_db`;

-- Garantiza que el cliente interprete correctamente los caracteres UTF-8 (acentos)
SET NAMES utf8mb4;

-- 1. TABLA DE ROLES
CREATE TABLE IF NOT EXISTS `tb_roles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(50) NOT NULL COMMENT 'Identificador único del rol (ej. ROLE_UNIVERSIDAD)',
    `descripcion` VARCHAR(255) NOT NULL COMMENT 'Descripción de responsabilidades del rol',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT `uk_roles_nombre` UNIQUE (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de roles institucionales';

-- 2. TABLA DE PERMISOS ATÓMICOS
CREATE TABLE IF NOT EXISTS `tb_permisos` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL COMMENT 'Código de permiso (ej. USUARIO_READ, ACADEMICO_WRITE)',
    `modulo` VARCHAR(50) NOT NULL COMMENT 'Módulo funcional al que pertenece el permiso',
    `descripcion` VARCHAR(255) NOT NULL COMMENT 'Descripción del privilegio',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT `uk_permisos_nombre` UNIQUE (`nombre`),
    INDEX `idx_permisos_modulo` (`modulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de permisos atómicos del sistema';

-- 3. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS `tb_usuarios` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL COMMENT 'Nombre de usuario único para inicio de sesión',
    `email` VARCHAR(100) NOT NULL COMMENT 'Correo electrónico institucional único',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Contraseña cifrada con algoritmo BCrypt (cost factor 10+)',
    `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombres del usuario',
    `apellido` VARCHAR(100) NOT NULL COMMENT 'Apellidos del usuario',
    `telefono` VARCHAR(25) NULL COMMENT 'Teléfono de contacto',
    `departamento` VARCHAR(100) NULL COMMENT 'Departamento o área institucional',
    `cuenta_bloqueada` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si la cuenta fue bloqueada por intentos fallidos',
    `cuenta_expirada` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si la cuenta expiró',
    `credenciales_expiradas` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indica si la contraseña debe renovarse',
    `ultimo_login` TIMESTAMP NULL DEFAULT NULL COMMENT 'Fecha y hora del último acceso exitoso',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT `uk_usuarios_username` UNIQUE (`username`),
    CONSTRAINT `uk_usuarios_email` UNIQUE (`email`),
    INDEX `idx_usuarios_email` (`email`),
    INDEX `idx_usuarios_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cuentas de usuarios y credenciales seguras';

-- 4. TABLA INTERMEDIA: USUARIOS <-> ROLES (Normalización 3FN N:M)
CREATE TABLE IF NOT EXISTS `tb_usuario_rol` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` BIGINT NOT NULL,
    `rol_id` BIGINT NOT NULL,
    `asignado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `asignado_por` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    CONSTRAINT `fk_usuario_rol_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tb_usuarios` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_usuario_rol_rol` FOREIGN KEY (`rol_id`) REFERENCES `tb_roles` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `uk_usuario_rol` UNIQUE (`usuario_id`, `rol_id`),
    INDEX `idx_usuario_rol_usuario` (`usuario_id`),
    INDEX `idx_usuario_rol_rol` (`rol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asociación entre usuarios y sus roles asignados';

-- 5. TABLA INTERMEDIA: ROLES <-> PERMISOS (Normalización 3FN N:M)
CREATE TABLE IF NOT EXISTS `tb_rol_permiso` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `rol_id` BIGINT NOT NULL,
    `permiso_id` BIGINT NOT NULL,
    `asignado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rol_permiso_rol` FOREIGN KEY (`rol_id`) REFERENCES `tb_roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rol_permiso_permiso` FOREIGN KEY (`permiso_id`) REFERENCES `tb_permisos` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `uk_rol_permiso` UNIQUE (`rol_id`, `permiso_id`),
    INDEX `idx_rol_permiso_rol` (`rol_id`),
    INDEX `idx_rol_permiso_permiso` (`permiso_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asociación entre roles y sus permisos granulares';

-- 6. TABLA DE AUDITORÍA TRANSACCIONAL
CREATE TABLE IF NOT EXISTS `tb_auditoria` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` BIGINT NULL COMMENT 'ID del usuario causante (NULL si es anónimo o fallido)',
    `username` VARCHAR(100) NOT NULL COMMENT 'Nombre de usuario o identificador enviado',
    `accion` VARCHAR(20) NOT NULL COMMENT 'Tipo de acción ejecutada',
    `modulo` VARCHAR(50) NOT NULL COMMENT 'Módulo del sistema involucrado',
    `descripcion` TEXT NOT NULL COMMENT 'Detalles del evento o payload resumido',
    `endpoint` VARCHAR(255) NOT NULL COMMENT 'Ruta del endpoint solicitado',
    `metodo_http` VARCHAR(10) NOT NULL COMMENT 'GET, POST, PUT, DELETE, etc.',
    `ip_origen` VARCHAR(45) NULL COMMENT 'Dirección IP v4/v6 del cliente solicitante',
    `resultado` VARCHAR(20) NOT NULL COMMENT 'SUCCESS o FAILURE',
    `fecha_hora` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `chk_auditoria_accion` CHECK (`accion` IN ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW')),
    CONSTRAINT `chk_auditoria_resultado` CHECK (`resultado` IN ('SUCCESS', 'FAILURE')),
    CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tb_usuarios` (`id`) ON DELETE SET NULL,
    INDEX `idx_auditoria_fecha_hora` (`fecha_hora`),
    INDEX `idx_auditoria_usuario` (`usuario_id`),
    INDEX `idx_auditoria_modulo` (`modulo`),
    INDEX `idx_auditoria_accion` (`accion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro inmutable de auditoría para trazabilidad forense';

-- ==============================================================================
-- SEMILLAS INICIALES (SEEDS) PARA FASE 2
-- ==============================================================================

-- Inserción de Roles Institucionales
INSERT INTO `tb_roles` (`nombre`, `descripcion`, `created_by`) VALUES
('ROLE_UNIVERSIDAD', 'Administrador institucional con control global de sedes, facultades y usuarios', 'DBA_SENIOR'),
('ROLE_DOCENTE', 'Personal docente con acceso a gestión académica de cursos asignados', 'DBA_SENIOR'),
('ROLE_ESTUDIANTE', 'Alumno matriculado con acceso a consultas y servicios estudiantiles', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

-- Inserción de Permisos Granulares
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('USUARIOS_READ', 'SEGURIDAD', 'Permite consultar el listado y detalle de usuarios', 'DBA_SENIOR'),
('USUARIOS_CREATE', 'SEGURIDAD', 'Permite registrar nuevos usuarios en la plataforma', 'DBA_SENIOR'),
('USUARIOS_UPDATE', 'SEGURIDAD', 'Permite actualizar datos de usuarios existentes', 'DBA_SENIOR'),
('USUARIOS_DELETE', 'SEGURIDAD', 'Permite deshabilitar o eliminar cuentas de usuario', 'DBA_SENIOR'),
('ROLES_READ', 'SEGURIDAD', 'Permite consultar catálogo de roles y permisos', 'DBA_SENIOR'),
('AUDITORIA_READ', 'AUDITORIA', 'Permite inspeccionar la bitácora de auditoría transaccional', 'DBA_SENIOR'),
('UNIVERSIDAD_MANAGE', 'ACADEMICO', 'Permite administrar la información institucional universitaria', 'DBA_SENIOR'),
('CURSOS_DOCENTE_READ', 'DOCENTE', 'Permite a los docentes ver sus cursos asignados', 'DBA_SENIOR'),
('FICHA_ESTUDIANTE_READ', 'ESTUDIANTE', 'Permite al estudiante consultar su ficha académica', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

-- Asignación de Permisos a ROLE_UNIVERSIDAD (Todos los permisos)
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r CROSS JOIN `tb_permisos` p
WHERE r.nombre = 'ROLE_UNIVERSIDAD';

-- Asignación de Permisos a ROLE_DOCENTE
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r, `tb_permisos` p
WHERE r.nombre = 'ROLE_DOCENTE' AND p.nombre IN ('CURSOS_DOCENTE_READ', 'ROLES_READ');

-- Asignación de Permisos a ROLE_ESTUDIANTE
INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id FROM `tb_roles` r, `tb_permisos` p
WHERE r.nombre = 'ROLE_ESTUDIANTE' AND p.nombre IN ('FICHA_ESTUDIANTE_READ');

-- Inserción de Usuarios Semilla con Hash BCrypt (cuentas de demostración)
-- Contraseñas: admin -> 'gestor123', carlos -> 'docente123', lucia -> 'alumno123' (cost factor 10)
INSERT INTO `tb_usuarios` (`username`, `email`, `password_hash`, `nombre`, `apellido`, `telefono`, `departamento`, `created_by`) VALUES
('admin', 'rectoria@gestoracad.edu', '$2a$10$IASQNeHsJOAzH2.93JbWW.xdaeFPbUEmHT3uzlQOe70E447XUtnNS', 'Alejandro', 'Morales Benítez', '+51 987654321', 'Rectoría / Administración Central', 'DBA_SENIOR'),
('carlos', 'carlos.santana@gestoracad.edu', '$2a$10$7VFqzCPyxLNLf78UUyBd5erXJcClElKQ43wW8osAZRjloHuLjN/3G', 'Carlos', 'Santana Quispe', '+51 976543210', 'Facultad de Ingeniería', 'DBA_SENIOR'),
('lucia', 'lucia.vega@gestoracad.edu', '$2a$10$6/al3/EVMJ0GIThFWRrS/.190skUqOAlOYuetedW6AsMi4rm9G5y.', 'Lucía', 'Vega Mendoza', '+51 965432109', 'Escuela de Ing. de Sistemas', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Vinculación de Usuarios con sus Roles
INSERT IGNORE INTO `tb_usuario_rol` (`usuario_id`, `rol_id`, `asignado_por`)
SELECT u.id, r.id, 'DBA_SENIOR' FROM `tb_usuarios` u, `tb_roles` r
WHERE u.username = 'admin' AND r.nombre = 'ROLE_UNIVERSIDAD';

INSERT IGNORE INTO `tb_usuario_rol` (`usuario_id`, `rol_id`, `asignado_por`)
SELECT u.id, r.id, 'DBA_SENIOR' FROM `tb_usuarios` u, `tb_roles` r
WHERE u.username = 'carlos' AND r.nombre = 'ROLE_DOCENTE';

INSERT IGNORE INTO `tb_usuario_rol` (`usuario_id`, `rol_id`, `asignado_por`)
SELECT u.id, r.id, 'DBA_SENIOR' FROM `tb_usuarios` u, `tb_roles` r
WHERE u.username = 'lucia' AND r.nombre = 'ROLE_ESTUDIANTE';

-- Registro de Auditoría Inicial
INSERT INTO `tb_auditoria` (`username`, `accion`, `modulo`, `descripcion`, `endpoint`, `metodo_http`, `resultado`) VALUES
('DBA_SENIOR', 'CREATE', 'SEGURIDAD', 'Creación y siembra de tablas normalizadas de usuarios, roles, permisos y auditoría', '/database/02_security_users_roles_audit.sql', 'SYSTEM_SQL', 'SUCCESS');

-- Actualización de versión de esquema en tb_schema_version
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
VALUES ('FASE_02', 'Base de Datos Normalizada, Seguridad, Roles y Auditoría', 'Tablas tb_roles, tb_permisos, tb_usuarios, tb_usuario_rol, tb_rol_permiso y tb_auditoria aplicadas con integridad referencial 3FN.', 'DBA_SENIOR', 'SUCCESS');
