-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL - SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- FASE 1: Arquitectura, Configuración Inicial y Verificación de Entorno
-- Motor: MySQL 8.0+ / 8.4 LTS
-- Codificación: UTF-8 Unicode (utf8mb4_unicode_ci)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `gestoracad_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gestoracad_db`;

-- Garantiza que el cliente interprete correctamente los caracteres UTF-8 (acentos)
SET NAMES utf8mb4;

-- Tabla de verificación de versiones y migraciones arquitectónicas del sistema
CREATE TABLE IF NOT EXISTS `tb_schema_version` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `phase_code` VARCHAR(50) NOT NULL COMMENT 'Código identificador de la fase del proyecto',
    `phase_name` VARCHAR(150) NOT NULL COMMENT 'Nombre descriptivo de la fase',
    `description` TEXT NULL COMMENT 'Detalles técnicos de la fase',
    `installed_on` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de aplicación',
    `installed_by` VARCHAR(100) DEFAULT 'SISTEMA_DEV' COMMENT 'Autor o responsable de la instalación',
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' COMMENT 'Estado de la migración',
    CONSTRAINT `chk_schema_status` CHECK (`status` IN ('SUCCESS', 'PENDING', 'FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de control de versiones del esquema de base de datos';

-- Inserción de verificación de Fase 1
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_01', 'Arquitectura y Configuración Inicial', 'Inicialización de base de datos MySQL 8+, estructura relacional preparada para Fase 2.', 'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (
    SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_01'
);

-- Nota técnica DBA:
-- En Fase 2 se incorporarán las tablas normalizadas (3FN):
-- 1. tb_usuarios
-- 2. tb_roles
-- 3. tb_permisos
-- 4. tb_usuario_rol
-- 5. tb_rol_permiso
-- 6. tb_auditoria
