-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL
-- Fase 8.2 — Portales de estudiante y docente
-- Vincula cuentas de usuario con fichas de estudiante/docente y prepara
-- consultas acotadas por identidad.
-- ==============================================================================

USE `gestoracad_db`;

-- ------------------------------------------------------------------------------
-- 1. VÍNCULO USUARIO ↔ DOCENTE
-- ------------------------------------------------------------------------------
SET @col_docente := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'gestoracad_db' AND TABLE_NAME = 'tb_docentes' AND COLUMN_NAME = 'usuario_id'
);
SET @sql_docente := IF(@col_docente = 0,
    'ALTER TABLE `tb_docentes` ADD COLUMN `usuario_id` BIGINT NULL AFTER `id`',
    'SELECT 1');
PREPARE stmt_docente FROM @sql_docente;
EXECUTE stmt_docente;
DEALLOCATE PREPARE stmt_docente;

SET @idx_docente := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'gestoracad_db' AND TABLE_NAME = 'tb_docentes' AND INDEX_NAME = 'uk_docentes_usuario'
);
SET @sql_idx_docente := IF(@idx_docente = 0,
    'ALTER TABLE `tb_docentes` ADD UNIQUE KEY `uk_docentes_usuario` (`usuario_id`), ADD CONSTRAINT `fk_docentes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tb_usuarios` (`id`) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt_idx_docente FROM @sql_idx_docente;
EXECUTE stmt_idx_docente;
DEALLOCATE PREPARE stmt_idx_docente;

-- ------------------------------------------------------------------------------
-- 2. VÍNCULO USUARIO ↔ ESTUDIANTE
-- ------------------------------------------------------------------------------
SET @col_estudiante := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'gestoracad_db' AND TABLE_NAME = 'tb_estudiantes' AND COLUMN_NAME = 'usuario_id'
);
SET @sql_estudiante := IF(@col_estudiante = 0,
    'ALTER TABLE `tb_estudiantes` ADD COLUMN `usuario_id` BIGINT NULL AFTER `id`',
    'SELECT 1');
PREPARE stmt_estudiante FROM @sql_estudiante;
EXECUTE stmt_estudiante;
DEALLOCATE PREPARE stmt_estudiante;

SET @idx_estudiante := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'gestoracad_db' AND TABLE_NAME = 'tb_estudiantes' AND INDEX_NAME = 'uk_estudiantes_usuario'
);
SET @sql_idx_estudiante := IF(@idx_estudiante = 0,
    'ALTER TABLE `tb_estudiantes` ADD UNIQUE KEY `uk_estudiantes_usuario` (`usuario_id`), ADD CONSTRAINT `fk_estudiantes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tb_usuarios` (`id`) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt_idx_estudiante FROM @sql_idx_estudiante;
EXECUTE stmt_idx_estudiante;
DEALLOCATE PREPARE stmt_idx_estudiante;

-- ------------------------------------------------------------------------------
-- 3. VÍNCULOS INICIALES
-- ------------------------------------------------------------------------------
UPDATE `tb_docentes` d
JOIN `tb_usuarios` u ON u.email = REPLACE(d.email, '@unintep.edu.pe', '@gestoracad.edu')
SET d.usuario_id = u.id
WHERE d.usuario_id IS NULL;

UPDATE `tb_estudiantes` e
JOIN `tb_usuarios` u ON u.email = e.email
SET e.usuario_id = u.id
WHERE e.usuario_id IS NULL;

-- ------------------------------------------------------------------------------
-- 4. VERSIÓN
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_14', 'Portales de estudiante y docente',
       'Columnas usuario_id en tb_docentes/tb_estudiantes y vínculos iniciales por correo institucional.',
       'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_14');
