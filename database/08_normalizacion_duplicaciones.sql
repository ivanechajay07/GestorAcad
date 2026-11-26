-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL - MIGRACIÓN FASE 8
-- Módulo: Normalización de duplicaciones detectadas en auditoría
-- Motor: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci
-- ------------------------------------------------------------------------------
-- Objetivo:
--   1. Eliminar las columnas de texto facultad/carrera del padrón y de docentes;
--      el catálogo tb_facultades / tb_carreras es la única fuente de verdad.
--   2. Eliminar los datos de ingreso duplicados en tb_estudiantes; el hecho
--      histórico vive en tb_estudiante_admisiones.
--   3. Eliminar la columna derivada horas_totales; se calcula como
--      horas_teoricas + horas_practicas.
--   4. Eliminar tb_usuarios.ultimo_login; ultima_conexion es el último acceso.
--   5. Retirar los triggers de sincronización y de horas, y actualizar las
--      funciones y vistas dependientes.
--
-- El script es idempotente: puede aplicarse sobre una instalación existente
-- sin duplicar datos ni fallar por objetos ya eliminados.
-- ==============================================================================

USE `gestoracad_db`;

SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 0. TRIGGERS OBSOLETOS
--    La resolución nombre -> catálogo y el cálculo de horas pasan al backend.
--    Se conservan los triggers de inmutabilidad de tb_auditoria.
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_estudiantes_catalogo_bi`;
DROP TRIGGER IF EXISTS `trg_estudiantes_catalogo_bu`;
DROP TRIGGER IF EXISTS `trg_docentes_catalogo_bi`;
DROP TRIGGER IF EXISTS `trg_docentes_catalogo_bu`;
DROP TRIGGER IF EXISTS `trg_asignaciones_horas_bi`;
DROP TRIGGER IF EXISTS `trg_asignaciones_horas_bu`;

-- ------------------------------------------------------------------------------
-- 1. VISTAS Y FUNCIONES DEPENDIENTES DE LAS COLUMNAS A ELIMINAR
-- ------------------------------------------------------------------------------
DROP VIEW IF EXISTS `vw_carga_docente`;
DROP VIEW IF EXISTS `vw_docentes_por_categoria`;
DROP VIEW IF EXISTS `vw_integridad_datos`;
DROP FUNCTION IF EXISTS `fn_carga_horaria_docente`;

-- ------------------------------------------------------------------------------
-- 2. PROCEDIMIENTOS AUXILIARES DE MIGRACIÓN IDEMPOTENTE
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_norm_drop_column`;
DROP PROCEDURE IF EXISTS `sp_norm_drop_index`;
DROP PROCEDURE IF EXISTS `sp_norm_drop_check`;
DROP PROCEDURE IF EXISTS `sp_norm_backfill_admisiones`;

DELIMITER $$

CREATE PROCEDURE `sp_norm_drop_column`(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64)
)
BEGIN
    IF EXISTS (
        SELECT 1
          FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = p_table
           AND COLUMN_NAME = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` DROP COLUMN `', p_column, '`');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

CREATE PROCEDURE `sp_norm_drop_index`(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64)
)
BEGIN
    IF EXISTS (
        SELECT 1
          FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = p_table
           AND INDEX_NAME = p_index
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` DROP INDEX `', p_index, '`');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

CREATE PROCEDURE `sp_norm_drop_check`(
    IN p_table VARCHAR(64),
    IN p_constraint VARCHAR(64)
)
BEGIN
    IF EXISTS (
        SELECT 1
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND TABLE_NAME = p_table
           AND CONSTRAINT_NAME = p_constraint
           AND CONSTRAINT_TYPE = 'CHECK'
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table,
                          '` DROP CHECK `', p_constraint, '`');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

-- Conserva el hecho histórico del ingreso: si un estudiante no tiene admisión
-- y aún existen las columnas de texto, se crea a partir de esos datos.
CREATE PROCEDURE `sp_norm_backfill_admisiones`()
BEGIN
    IF EXISTS (
        SELECT 1
          FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'tb_estudiantes'
           AND COLUMN_NAME = 'periodo_ingreso'
    ) THEN
        SET @ddl = '
            INSERT INTO tb_estudiante_admisiones
                (estudiante_id, modalidad, periodo, colegio_procedencia,
                 estado, observacion, created_by)
            SELECT e.id,
                   COALESCE(NULLIF(TRIM(e.modalidad_ingreso), ''''), ''ORDINARIO''),
                   COALESCE(NULLIF(TRIM(e.periodo_ingreso), ''''),
                            COALESCE(fn_periodo_actual(), ''SIN_PERIODO'')),
                   e.colegio_procedencia,
                   ''MATRICULADO'',
                   ''Migrado desde tb_estudiantes en FASE_08'',
                   ''MIGRACION_08''
              FROM tb_estudiantes e
             WHERE NOT EXISTS (
                   SELECT 1 FROM tb_estudiante_admisiones a
                    WHERE a.estudiante_id = e.id)
               AND (e.periodo_ingreso IS NOT NULL
                    OR e.modalidad_ingreso IS NOT NULL
                    OR e.colegio_procedencia IS NOT NULL)';
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

CALL `sp_norm_backfill_admisiones`();

-- ------------------------------------------------------------------------------
-- 3. BAJA DE RESTRICCIONES E ÍNDICES DE LAS COLUMNAS DUPLICADAS
-- ------------------------------------------------------------------------------
CALL `sp_norm_drop_check`('tb_docente_asignaciones', 'chk_asignaciones_horas');

CALL `sp_norm_drop_index`('tb_estudiantes', 'idx_estudiantes_facultad');
CALL `sp_norm_drop_index`('tb_estudiantes', 'idx_estudiantes_carrera');
CALL `sp_norm_drop_index`('tb_docentes', 'idx_docentes_facultad');

-- ------------------------------------------------------------------------------
-- 4. BAJA DE COLUMNAS DUPLICADAS O DERIVADAS
-- ------------------------------------------------------------------------------
-- H-01: el nombre de facultad/carrera vive en el catálogo.
CALL `sp_norm_drop_column`('tb_estudiantes', 'carrera');
CALL `sp_norm_drop_column`('tb_estudiantes', 'facultad');
CALL `sp_norm_drop_column`('tb_docentes', 'facultad');

-- H-02: el hecho histórico del ingreso vive en tb_estudiante_admisiones.
CALL `sp_norm_drop_column`('tb_estudiantes', 'periodo_ingreso');
CALL `sp_norm_drop_column`('tb_estudiantes', 'modalidad_ingreso');
CALL `sp_norm_drop_column`('tb_estudiantes', 'colegio_procedencia');

-- H-03: horas_totales se calcula como horas_teoricas + horas_practicas.
CALL `sp_norm_drop_column`('tb_docente_asignaciones', 'horas_totales');

-- H-04: ultima_conexion es el último acceso/actividad del usuario.
CALL `sp_norm_drop_column`('tb_usuarios', 'ultimo_login');

-- ------------------------------------------------------------------------------
-- 5. INTEGRIDAD REFERENCIAL OBLIGATORIA
--    La auditoría verificó 0 registros sin facultad/carrera.
-- ------------------------------------------------------------------------------
ALTER TABLE `tb_estudiantes`
    MODIFY COLUMN `facultad_id` BIGINT NOT NULL,
    MODIFY COLUMN `carrera_id` BIGINT NOT NULL;

ALTER TABLE `tb_docentes`
    MODIFY COLUMN `facultad_id` BIGINT NOT NULL;

-- ------------------------------------------------------------------------------
-- 6. RESTRICCIÓN CHECK DE HORAS (sin la columna derivada)
-- ------------------------------------------------------------------------------
ALTER TABLE `tb_docente_asignaciones`
    ADD CONSTRAINT `chk_asignaciones_horas`
    CHECK (`horas_teoricas` >= 0 AND `horas_practicas` >= 0);

-- ------------------------------------------------------------------------------
-- 7. FUNCIÓN DE CARGA HORARIA DERIVADA
-- ------------------------------------------------------------------------------
DELIMITER $$

CREATE FUNCTION `fn_carga_horaria_docente`(p_docente_id BIGINT) RETURNS INT
    READS SQL DATA
    COMMENT 'Horas lectivas asignadas al docente en el periodo vigente'
BEGIN
    DECLARE v_horas INT DEFAULT 0;
    SELECT COALESCE(SUM(a.horas_teoricas + a.horas_practicas), 0) INTO v_horas
      FROM tb_docente_asignaciones a
     WHERE a.docente_id = p_docente_id
       AND a.is_active = 1
       AND a.deleted_at IS NULL
       AND (a.periodo = fn_periodo_actual() OR fn_periodo_actual() IS NULL);
    RETURN v_horas;
END$$

DELIMITER ;

-- ------------------------------------------------------------------------------
-- 8. VISTAS ACTUALIZADAS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_docentes_por_categoria` AS
SELECT d.categoria,
       COUNT(DISTINCT d.id) AS docentes,
       COALESCE(SUM(a.horas_teoricas + a.horas_practicas), 0) AS horas_asignadas
  FROM tb_docentes d
  LEFT JOIN tb_docente_asignaciones a
         ON a.docente_id = d.id
        AND a.is_active = 1
        AND a.deleted_at IS NULL
        AND a.periodo = fn_periodo_actual()
 WHERE d.is_active = 1
   AND d.deleted_at IS NULL
 GROUP BY d.categoria;

CREATE OR REPLACE VIEW `vw_carga_docente` AS
SELECT d.id AS docente_id,
       d.codigo,
       CONCAT(d.apellidos, ', ', d.nombres) AS docente,
       f.nombre AS facultad,
       d.categoria,
       d.dedicacion,
       (SELECT COUNT(*) FROM tb_docente_asignaciones a
         WHERE a.docente_id = d.id
           AND a.is_active = 1
           AND a.deleted_at IS NULL
           AND a.periodo = fn_periodo_actual()) AS asignaciones,
       COALESCE((SELECT SUM(a.horas_teoricas) FROM tb_docente_asignaciones a
                  WHERE a.docente_id = d.id AND a.is_active = 1
                    AND a.deleted_at IS NULL
                    AND a.periodo = fn_periodo_actual()), 0) AS horas_teoricas,
       COALESCE((SELECT SUM(a.horas_practicas) FROM tb_docente_asignaciones a
                  WHERE a.docente_id = d.id AND a.is_active = 1
                    AND a.deleted_at IS NULL
                    AND a.periodo = fn_periodo_actual()), 0) AS horas_practicas,
       fn_carga_horaria_docente(d.id) AS horas_totales
  FROM tb_docentes d
  LEFT JOIN tb_facultades f ON f.id = d.facultad_id
 WHERE d.is_active = 1
   AND d.deleted_at IS NULL;

CREATE OR REPLACE VIEW `vw_integridad_datos` AS
SELECT 'estudiantes_activos_sin_facultad' AS metrica,
       COUNT(*) AS valor, 0 AS esperado,
       IF(COUNT(*) = 0, 'OK', 'ALERTA') AS estado
  FROM tb_estudiantes
 WHERE is_active = 1 AND deleted_at IS NULL AND facultad_id IS NULL
UNION ALL
SELECT 'estudiantes_activos_sin_carrera',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_estudiantes
 WHERE is_active = 1 AND deleted_at IS NULL AND carrera_id IS NULL
UNION ALL
SELECT 'estudiantes_carrera_facultad_incoherente',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_estudiantes e
  JOIN tb_carreras c ON c.id = e.carrera_id
 WHERE e.facultad_id IS NOT NULL AND c.facultad_id <> e.facultad_id
UNION ALL
SELECT 'docentes_activos_sin_facultad',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_docentes
 WHERE is_active = 1 AND deleted_at IS NULL AND facultad_id IS NULL
UNION ALL
SELECT 'docentes_facultad_incoherente',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_docentes d
  LEFT JOIN tb_facultades f ON f.id = d.facultad_id
 WHERE d.facultad_id IS NOT NULL AND f.id IS NULL
UNION ALL
SELECT 'asignaciones_horas_incoherentes',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_docente_asignaciones
 WHERE horas_teoricas < 0 OR horas_practicas < 0
UNION ALL
SELECT 'usuarios_activos_sin_rol',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_usuarios u
 WHERE u.is_active = 1 AND u.deleted_at IS NULL
   AND NOT EXISTS (SELECT 1 FROM tb_usuario_rol ur WHERE ur.usuario_id = u.id)
UNION ALL
SELECT 'estudiantes_promedio_fuera_rango',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_estudiantes
 WHERE promedio_ponderado < 0 OR promedio_ponderado > 20
UNION ALL
SELECT 'estudiantes_ciclo_fuera_rango',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_estudiantes
 WHERE ciclo_actual < 1 OR ciclo_actual > 12
UNION ALL
SELECT 'admisiones_puntaje_fuera_rango',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_estudiante_admisiones
 WHERE puntaje IS NOT NULL AND (puntaje < 0 OR puntaje > 20)
UNION ALL
SELECT 'parametros_requeridos_faltantes',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM (
        SELECT 'PERIODO_ACADEMICO_ACTUAL' AS clave
        UNION ALL SELECT 'NOTA_MINIMA_APROBATORIA'
        UNION ALL SELECT 'MAX_CREDITOS_POR_PERIODO'
       ) req
 WHERE NOT EXISTS (
        SELECT 1 FROM tb_parametros p
         WHERE p.clave = req.clave AND p.is_active = 1
       );

-- ------------------------------------------------------------------------------
-- 9. LIMPIEZA DE PROCEDIMIENTOS AUXILIARES
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_norm_drop_column`;
DROP PROCEDURE IF EXISTS `sp_norm_drop_index`;
DROP PROCEDURE IF EXISTS `sp_norm_drop_check`;
DROP PROCEDURE IF EXISTS `sp_norm_backfill_admisiones`;

-- ------------------------------------------------------------------------------
-- 10. CONTROL DE VERSIÓN DE ESQUEMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version`
    (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_08',
       'Normalización de duplicaciones de esquema',
       'Eliminación de facultad/carrera de texto, datos de ingreso en el padrón, horas_totales derivada y ultimo_login; vistas y funciones actualizadas.',
       'DBA_SENIOR',
       'SUCCESS'
 WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_08');
