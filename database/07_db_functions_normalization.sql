-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL - MIGRACIÓN FASE 7
-- Módulo: Auditoría de Base de Datos, Normalización y Objetos Programables
-- Motor: MySQL 8.0+ / InnoDB / utf8mb4_unicode_ci
-- ------------------------------------------------------------------------------
-- Objetivo:
--   1. Completar la normalización del modelo académico creando los catálogos
--      tb_facultades y tb_carreras, con integridad referencial desde
--      tb_estudiantes y tb_docentes.
--   2. Mantener compatibilidad con la API actual (campos de texto facultad y
--      carrera) mediante triggers de sincronización; el catálogo es la fuente
--      canónica y los textos son una proyección controlada.
--   3. Incorporar funciones, procedimientos, triggers y vistas que concentren
--      reglas de negocio y sirvan de evidencia de la auditoría.
--   4. Añadir índices faltantes, eliminar índices redundantes y reforzar la
--      integridad con restricciones CHECK.
--
-- El script es idempotente: puede aplicarse sobre una instalación existente
-- sin duplicar columnas, índices, restricciones ni datos.
-- ==============================================================================

USE `gestoracad_db`;

-- Garantiza que el cliente interprete correctamente los caracteres UTF-8
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 0. LIMPIEZA DE OBJETOS DE UNA EJECUCIÓN ANTERIOR
--    Se retiran los triggers antes del backfill para que la migración de datos
--    no dispare la lógica de sincronización dos veces.
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_estudiantes_catalogo_bi`;
DROP TRIGGER IF EXISTS `trg_estudiantes_catalogo_bu`;
DROP TRIGGER IF EXISTS `trg_docentes_catalogo_bi`;
DROP TRIGGER IF EXISTS `trg_docentes_catalogo_bu`;
DROP TRIGGER IF EXISTS `trg_asignaciones_horas_bi`;
DROP TRIGGER IF EXISTS `trg_asignaciones_horas_bu`;
DROP TRIGGER IF EXISTS `trg_auditoria_no_update`;
DROP TRIGGER IF EXISTS `trg_auditoria_no_delete`;

-- ------------------------------------------------------------------------------
-- 1. PROCEDIMIENTOS AUXILIARES DE MIGRACIÓN (idempotencia)
--    MySQL 8.0 no soporta ADD COLUMN/INDEX/CONSTRAINT IF NOT EXISTS.
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_add_column_if_missing`;
DROP PROCEDURE IF EXISTS `sp_add_index_if_missing`;
DROP PROCEDURE IF EXISTS `sp_drop_index_if_exists`;
DROP PROCEDURE IF EXISTS `sp_add_check_if_missing`;
DROP PROCEDURE IF EXISTS `sp_add_fk_if_missing`;
DROP PROCEDURE IF EXISTS `sp_resolver_catalogo_academico`;

DELIMITER $$

CREATE PROCEDURE `sp_add_column_if_missing`(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_ddl TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = p_table
           AND COLUMN_NAME = p_column
    ) THEN
        SET @ddl = p_ddl;
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

CREATE PROCEDURE `sp_add_index_if_missing`(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_ddl TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = p_table
           AND INDEX_NAME = p_index
    ) THEN
        SET @ddl = p_ddl;
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

CREATE PROCEDURE `sp_drop_index_if_exists`(
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

CREATE PROCEDURE `sp_add_check_if_missing`(
    IN p_table VARCHAR(64),
    IN p_constraint VARCHAR(64),
    IN p_condition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND TABLE_NAME = p_table
           AND CONSTRAINT_NAME = p_constraint
           AND CONSTRAINT_TYPE = 'CHECK'
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table,
                          '` ADD CONSTRAINT `', p_constraint,
                          '` CHECK (', p_condition, ')');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

CREATE PROCEDURE `sp_add_fk_if_missing`(
    IN p_table VARCHAR(64),
    IN p_constraint VARCHAR(64),
    IN p_ddl TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND TABLE_NAME = p_table
           AND CONSTRAINT_NAME = p_constraint
           AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    ) THEN
        SET @ddl = p_ddl;
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- ------------------------------------------------------------------------------
-- 2. NORMALIZACIÓN: CATÁLOGOS DE FACULTADES Y CARRERAS
--    Corrige la dependencia transitiva carrera -> facultad que existía en
--    tb_estudiantes y la referencia por texto libre en tb_docentes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_facultades` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(200) NOT NULL COMMENT 'Nombre oficial y único de la facultad',
    `descripcion` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY `uk_facultades_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo normalizado de facultades';

CREATE TABLE IF NOT EXISTS `tb_carreras` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `facultad_id` BIGINT NOT NULL,
    `nombre` VARCHAR(200) NOT NULL COMMENT 'Nombre oficial y único de la carrera',
    `descripcion` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY `uk_carreras_nombre` (`nombre`),
    KEY `idx_carreras_facultad` (`facultad_id`),
    CONSTRAINT `fk_carreras_facultad` FOREIGN KEY (`facultad_id`)
        REFERENCES `tb_facultades` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo normalizado de carreras profesionales';

-- Columnas de integridad referencial (compatibles con la API actual)
CALL `sp_add_column_if_missing`('tb_estudiantes', 'facultad_id',
    'ALTER TABLE `tb_estudiantes` ADD COLUMN `facultad_id` BIGINT NULL COMMENT ''FK al catálogo tb_facultades'' AFTER `facultad`');
CALL `sp_add_column_if_missing`('tb_estudiantes', 'carrera_id',
    'ALTER TABLE `tb_estudiantes` ADD COLUMN `carrera_id` BIGINT NULL COMMENT ''FK al catálogo tb_carreras'' AFTER `carrera`');
CALL `sp_add_column_if_missing`('tb_docentes', 'facultad_id',
    'ALTER TABLE `tb_docentes` ADD COLUMN `facultad_id` BIGINT NULL COMMENT ''FK al catálogo tb_facultades'' AFTER `facultad`');

-- 2.1 Semilla del catálogo a partir de los datos existentes
INSERT INTO `tb_facultades` (`nombre`, `created_by`)
SELECT x.nombre, 'MIGRACION_07'
  FROM (
        SELECT DISTINCT TRIM(`facultad`) AS nombre
          FROM `tb_estudiantes`
         WHERE `facultad` IS NOT NULL AND TRIM(`facultad`) <> ''
        UNION
        SELECT DISTINCT TRIM(`facultad`) AS nombre
          FROM `tb_docentes`
         WHERE `facultad` IS NOT NULL AND TRIM(`facultad`) <> ''
       ) AS x
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `tb_carreras` (`facultad_id`, `nombre`, `created_by`)
SELECT f.id, x.carrera, 'MIGRACION_07'
  FROM (
        SELECT DISTINCT TRIM(`carrera`) AS carrera, TRIM(`facultad`) AS facultad
          FROM `tb_estudiantes`
         WHERE `carrera` IS NOT NULL AND TRIM(`carrera`) <> ''
       ) AS x
  JOIN `tb_facultades` f ON f.nombre = x.facultad
ON DUPLICATE KEY UPDATE `facultad_id` = VALUES(`facultad_id`);

-- 2.2 Normalización de espacios y backfill de claves foráneas
UPDATE `tb_estudiantes`
   SET `facultad` = TRIM(`facultad`)
 WHERE `facultad` IS NOT NULL AND `facultad` <> TRIM(`facultad`);
UPDATE `tb_estudiantes`
   SET `carrera` = TRIM(`carrera`)
 WHERE `carrera` IS NOT NULL AND `carrera` <> TRIM(`carrera`);
UPDATE `tb_docentes`
   SET `facultad` = TRIM(`facultad`)
 WHERE `facultad` IS NOT NULL AND `facultad` <> TRIM(`facultad`);

UPDATE `tb_estudiantes` e
  JOIN `tb_facultades` f ON f.nombre = e.facultad
   SET e.facultad_id = f.id
 WHERE e.facultad_id IS NULL
   AND e.facultad IS NOT NULL AND e.facultad <> '';

UPDATE `tb_estudiantes` e
  JOIN `tb_carreras` c ON c.nombre = e.carrera
  JOIN `tb_facultades` f ON f.id = c.facultad_id
   SET e.carrera_id  = c.id,
       e.facultad_id = COALESCE(e.facultad_id, c.facultad_id),
       e.facultad    = f.nombre
 WHERE e.carrera_id IS NULL
    OR e.facultad_id IS NULL
    OR e.facultad IS NULL;

UPDATE `tb_docentes` d
  JOIN `tb_facultades` f ON f.nombre = d.facultad
   SET d.facultad_id = f.id
 WHERE d.facultad_id IS NULL
   AND d.facultad IS NOT NULL AND d.facultad <> '';

-- 2.3 Índices de apoyo y claves foráneas del catálogo
CALL `sp_add_index_if_missing`('tb_estudiantes', 'idx_estudiantes_facultad_id',
    'ALTER TABLE `tb_estudiantes` ADD INDEX `idx_estudiantes_facultad_id` (`facultad_id`)');
CALL `sp_add_index_if_missing`('tb_estudiantes', 'idx_estudiantes_carrera_id',
    'ALTER TABLE `tb_estudiantes` ADD INDEX `idx_estudiantes_carrera_id` (`carrera_id`)');
CALL `sp_add_index_if_missing`('tb_docentes', 'idx_docentes_facultad_id',
    'ALTER TABLE `tb_docentes` ADD INDEX `idx_docentes_facultad_id` (`facultad_id`)');

CALL `sp_add_fk_if_missing`('tb_carreras', 'fk_carreras_facultad',
    'ALTER TABLE `tb_carreras` ADD CONSTRAINT `fk_carreras_facultad` FOREIGN KEY (`facultad_id`) REFERENCES `tb_facultades` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE');
CALL `sp_add_fk_if_missing`('tb_estudiantes', 'fk_estudiantes_facultad',
    'ALTER TABLE `tb_estudiantes` ADD CONSTRAINT `fk_estudiantes_facultad` FOREIGN KEY (`facultad_id`) REFERENCES `tb_facultades` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE');
CALL `sp_add_fk_if_missing`('tb_estudiantes', 'fk_estudiantes_carrera',
    'ALTER TABLE `tb_estudiantes` ADD CONSTRAINT `fk_estudiantes_carrera` FOREIGN KEY (`carrera_id`) REFERENCES `tb_carreras` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE');
CALL `sp_add_fk_if_missing`('tb_docentes', 'fk_docentes_facultad',
    'ALTER TABLE `tb_docentes` ADD CONSTRAINT `fk_docentes_facultad` FOREIGN KEY (`facultad_id`) REFERENCES `tb_facultades` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE');

-- ------------------------------------------------------------------------------
-- 3. FUNCIONES ALMACENADAS
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS `fn_periodo_actual`;
DROP FUNCTION IF EXISTS `fn_estudiantes_activos`;
DROP FUNCTION IF EXISTS `fn_docentes_activos`;
DROP FUNCTION IF EXISTS `fn_total_usuarios_activos`;
DROP FUNCTION IF EXISTS `fn_carga_horaria_docente`;
DROP FUNCTION IF EXISTS `fn_promedio_facultad`;
DROP FUNCTION IF EXISTS `fn_estado_licenciamiento`;
DROP FUNCTION IF EXISTS `fn_carreras_por_facultad`;

DELIMITER $$

CREATE FUNCTION `fn_periodo_actual`() RETURNS VARCHAR(20)
    READS SQL DATA
    COMMENT 'Periodo académico vigente según tb_parametros'
BEGIN
    DECLARE v_periodo VARCHAR(20) DEFAULT NULL;
    SELECT p.valor INTO v_periodo
      FROM tb_parametros p
     WHERE p.clave = 'PERIODO_ACADEMICO_ACTUAL'
       AND p.is_active = 1
     LIMIT 1;
    RETURN v_periodo;
END$$

CREATE FUNCTION `fn_estudiantes_activos`() RETURNS INT
    READS SQL DATA
    COMMENT 'Cantidad de estudiantes activos no eliminados'
BEGIN
    DECLARE v_total INT DEFAULT 0;
    SELECT COUNT(*) INTO v_total
      FROM tb_estudiantes
     WHERE is_active = 1 AND deleted_at IS NULL;
    RETURN v_total;
END$$

CREATE FUNCTION `fn_docentes_activos`() RETURNS INT
    READS SQL DATA
    COMMENT 'Cantidad de docentes activos no eliminados'
BEGIN
    DECLARE v_total INT DEFAULT 0;
    SELECT COUNT(*) INTO v_total
      FROM tb_docentes
     WHERE is_active = 1 AND deleted_at IS NULL;
    RETURN v_total;
END$$

CREATE FUNCTION `fn_total_usuarios_activos`() RETURNS INT
    READS SQL DATA
    COMMENT 'Cantidad de usuarios activos no eliminados'
BEGIN
    DECLARE v_total INT DEFAULT 0;
    SELECT COUNT(*) INTO v_total
      FROM tb_usuarios
     WHERE is_active = 1 AND deleted_at IS NULL;
    RETURN v_total;
END$$

CREATE FUNCTION `fn_carga_horaria_docente`(p_docente_id BIGINT) RETURNS INT
    READS SQL DATA
    COMMENT 'Horas lectivas asignadas al docente en el periodo vigente'
BEGIN
    DECLARE v_horas INT DEFAULT 0;
    SELECT COALESCE(SUM(a.horas_totales), 0) INTO v_horas
      FROM tb_docente_asignaciones a
     WHERE a.docente_id = p_docente_id
       AND a.is_active = 1
       AND a.deleted_at IS NULL
       AND (a.periodo = fn_periodo_actual() OR fn_periodo_actual() IS NULL);
    RETURN v_horas;
END$$

CREATE FUNCTION `fn_promedio_facultad`(p_facultad VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci) RETURNS DECIMAL(5,2)
    READS SQL DATA
    COMMENT 'Promedio ponderado de los estudiantes activos de una facultad'
BEGIN
    DECLARE v_promedio DECIMAL(5,2) DEFAULT 0.00;
    SELECT ROUND(AVG(e.promedio_ponderado), 2) INTO v_promedio
      FROM tb_estudiantes e
      JOIN tb_facultades f ON f.id = e.facultad_id
     WHERE f.nombre = p_facultad
       AND e.is_active = 1
       AND e.deleted_at IS NULL;
    RETURN COALESCE(v_promedio, 0.00);
END$$

CREATE FUNCTION `fn_estado_licenciamiento`() RETURNS VARCHAR(50)
    READS SQL DATA
    COMMENT 'Estado de licenciamiento de la universidad activa'
BEGIN
    DECLARE v_estado VARCHAR(50) DEFAULT NULL;
    SELECT u.estado_licenciamiento INTO v_estado
      FROM tb_universidad u
     WHERE u.is_active = 1 AND u.deleted_at IS NULL
     ORDER BY u.id
     LIMIT 1;
    RETURN v_estado;
END$$

CREATE FUNCTION `fn_carreras_por_facultad`(p_facultad VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci) RETURNS INT
    READS SQL DATA
    COMMENT 'Cantidad de carreras activas registradas para una facultad'
BEGIN
    DECLARE v_total INT DEFAULT 0;
    SELECT COUNT(*) INTO v_total
      FROM tb_carreras c
      JOIN tb_facultades f ON f.id = c.facultad_id
     WHERE f.nombre = p_facultad
       AND c.is_active = 1
       AND c.deleted_at IS NULL;
    RETURN v_total;
END$$

-- ------------------------------------------------------------------------------
-- 4. PROCEDIMIENTOS ALMACENADOS
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_resumen_institucional`;
DROP PROCEDURE IF EXISTS `sp_reporte_facultades`;
DROP PROCEDURE IF EXISTS `sp_reporte_carga_docente`;
DROP PROCEDURE IF EXISTS `sp_estudiantes_por_ciclo`;
DROP PROCEDURE IF EXISTS `sp_verificar_integridad`;
DROP PROCEDURE IF EXISTS `sp_reporte_auditoria`;
DROP PROCEDURE IF EXISTS `sp_registrar_auditoria`;

-- 4.1 Resolución canónica del catálogo académico.
--     Es invocada por los triggers de estudiantes y docentes. Si el nombre no
--     existe lo registra; así se preserva la API basada en textos sin perder
--     integridad referencial.
CREATE PROCEDURE `sp_resolver_catalogo_academico`(
    IN p_facultad VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_carrera VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_facultad_id BIGINT,
    IN p_carrera_id BIGINT,
    IN p_usuario VARCHAR(100),
    OUT o_facultad_id BIGINT,
    OUT o_facultad VARCHAR(200),
    OUT o_carrera_id BIGINT,
    OUT o_carrera VARCHAR(200)
)
MODIFIES SQL DATA
COMMENT 'Resuelve/crea facultad y carrera y devuelve las claves canónicas'
BEGIN
    DECLARE v_facultad_id BIGINT DEFAULT NULL;
    DECLARE v_facultad VARCHAR(200) DEFAULT NULL;
    DECLARE v_carrera_id BIGINT DEFAULT NULL;
    DECLARE v_carrera VARCHAR(200) DEFAULT NULL;
    DECLARE v_usuario VARCHAR(100) DEFAULT NULL;

    SET v_usuario = COALESCE(NULLIF(TRIM(p_usuario), ''), 'SISTEMA');

    -- 1) Carrera por identificador o por nombre
    IF p_carrera_id IS NOT NULL THEN
        SELECT c.id, c.nombre, c.facultad_id
          INTO v_carrera_id, v_carrera, v_facultad_id
          FROM tb_carreras c
         WHERE c.id = p_carrera_id
         LIMIT 1;
    END IF;

    IF v_carrera_id IS NULL
       AND p_carrera IS NOT NULL AND TRIM(p_carrera) <> '' THEN
        SELECT c.id, c.nombre, c.facultad_id
          INTO v_carrera_id, v_carrera, v_facultad_id
          FROM tb_carreras c
         WHERE c.nombre = TRIM(p_carrera)
         LIMIT 1;
    END IF;

    -- 2) Facultad por identificador o por nombre (la carrera tiene prioridad)
    IF v_facultad_id IS NULL THEN
        IF p_facultad_id IS NOT NULL THEN
            SELECT f.id, f.nombre
              INTO v_facultad_id, v_facultad
              FROM tb_facultades f
             WHERE f.id = p_facultad_id
             LIMIT 1;
        END IF;

        IF v_facultad_id IS NULL
           AND p_facultad IS NOT NULL AND TRIM(p_facultad) <> '' THEN
            SELECT f.id, f.nombre
              INTO v_facultad_id, v_facultad
              FROM tb_facultades f
             WHERE f.nombre = TRIM(p_facultad)
             LIMIT 1;

            IF v_facultad_id IS NULL THEN
                INSERT INTO tb_facultades (nombre, created_by)
                VALUES (TRIM(p_facultad), v_usuario)
                ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
                SET v_facultad_id = LAST_INSERT_ID();
                SET v_facultad = TRIM(p_facultad);
            END IF;
        END IF;
    ELSE
        SELECT f.nombre INTO v_facultad
          FROM tb_facultades f
         WHERE f.id = v_facultad_id
         LIMIT 1;
    END IF;

    -- 3) Alta de la carrera si se recibió por nombre y aún no existe
    IF v_carrera_id IS NULL
       AND p_carrera IS NOT NULL AND TRIM(p_carrera) <> ''
       AND v_facultad_id IS NOT NULL THEN
        INSERT INTO tb_carreras (facultad_id, nombre, created_by)
        VALUES (v_facultad_id, TRIM(p_carrera), v_usuario)
        ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
        SET v_carrera_id = LAST_INSERT_ID();

        -- La carrera es la fuente canónica de la relación carrera -> facultad
        SELECT c.nombre, c.facultad_id, f.nombre
          INTO v_carrera, v_facultad_id, v_facultad
          FROM tb_carreras c
          JOIN tb_facultades f ON f.id = c.facultad_id
         WHERE c.id = v_carrera_id;
    END IF;

    SET o_facultad_id = v_facultad_id;
    SET o_facultad = v_facultad;
    SET o_carrera_id = v_carrera_id;
    SET o_carrera = v_carrera;
END$$

CREATE PROCEDURE `sp_resumen_institucional`()
    READS SQL DATA
    COMMENT 'Resumen de una fila para el panel institucional'
BEGIN
    SELECT
        fn_periodo_actual() AS periodo,
        (SELECT u.nombre_corto FROM tb_universidad u
          WHERE u.is_active = 1 AND u.deleted_at IS NULL
          ORDER BY u.id LIMIT 1) AS universidad,
        fn_estado_licenciamiento() AS estado_licenciamiento,
        (SELECT COUNT(*) FROM tb_sedes s
          WHERE s.is_active = 1 AND s.deleted_at IS NULL) AS sedes_activas,
        fn_estudiantes_activos() AS estudiantes_activos,
        fn_docentes_activos() AS docentes_activos,
        fn_total_usuarios_activos() AS usuarios_activos,
        (SELECT COUNT(*) FROM tb_facultades f WHERE f.is_active = 1) AS facultades,
        (SELECT COUNT(*) FROM tb_carreras c WHERE c.is_active = 1) AS carreras,
        (SELECT COUNT(*) FROM tb_auditoria) AS eventos_auditoria;
END$$

CREATE PROCEDURE `sp_reporte_facultades`()
    READS SQL DATA
    COMMENT 'Reporte de estudiantes y promedio por facultad'
BEGIN
    SELECT * FROM vw_estudiantes_por_facultad
     ORDER BY estudiantes DESC, facultad ASC;
END$$

CREATE PROCEDURE `sp_reporte_carga_docente`()
    READS SQL DATA
    COMMENT 'Reporte de carga lectiva por docente en el periodo vigente'
BEGIN
    SELECT * FROM vw_carga_docente
     ORDER BY horas_totales DESC, docente ASC;
END$$

CREATE PROCEDURE `sp_estudiantes_por_ciclo`()
    READS SQL DATA
    COMMENT 'Distribución de estudiantes activos por ciclo académico'
BEGIN
    SELECT e.ciclo_actual AS ciclo, COUNT(*) AS estudiantes
      FROM tb_estudiantes e
     WHERE e.is_active = 1 AND e.deleted_at IS NULL
     GROUP BY e.ciclo_actual
     ORDER BY e.ciclo_actual;
END$$

CREATE PROCEDURE `sp_verificar_integridad`()
    READS SQL DATA
    COMMENT 'Ejecuta los controles de calidad de datos'
BEGIN
    SELECT * FROM vw_integridad_datos;
END$$

CREATE PROCEDURE `sp_reporte_auditoria`(IN p_dias INT)
    READS SQL DATA
    COMMENT 'Actividad de auditoría agrupada por día, módulo, acción y resultado'
BEGIN
    SELECT DATE(a.fecha_hora) AS fecha,
           a.modulo,
           a.accion,
           a.resultado,
           COUNT(*) AS eventos,
           COUNT(DISTINCT a.username) AS usuarios
      FROM tb_auditoria a
     WHERE a.fecha_hora >= DATE_SUB(NOW(), INTERVAL COALESCE(p_dias, 7) DAY)
     GROUP BY DATE(a.fecha_hora), a.modulo, a.accion, a.resultado
     ORDER BY fecha DESC, eventos DESC;
END$$

CREATE PROCEDURE `sp_registrar_auditoria`(
    IN p_usuario_id BIGINT,
    IN p_username VARCHAR(100),
    IN p_accion VARCHAR(20),
    IN p_modulo VARCHAR(50),
    IN p_descripcion TEXT,
    IN p_endpoint VARCHAR(255),
    IN p_metodo_http VARCHAR(10),
    IN p_ip_origen VARCHAR(45),
    IN p_entidad VARCHAR(100),
    IN p_id_entidad BIGINT,
    IN p_user_agent VARCHAR(500),
    IN p_resultado VARCHAR(20)
)
MODIFIES SQL DATA
COMMENT 'Canal centralizado para registrar eventos de auditoría'
BEGIN
    INSERT INTO tb_auditoria
        (usuario_id, username, accion, modulo, descripcion, endpoint,
         metodo_http, ip_origen, entidad, id_entidad, user_agent, resultado)
    VALUES
        (p_usuario_id, p_username, p_accion, p_modulo, p_descripcion, p_endpoint,
         p_metodo_http, p_ip_origen, p_entidad, p_id_entidad, p_user_agent, p_resultado);
END$$

-- ------------------------------------------------------------------------------
-- 5. TRIGGERS
-- ------------------------------------------------------------------------------

-- 5.1 Sincronización del catálogo en estudiantes (ALTAS)
CREATE TRIGGER `trg_estudiantes_catalogo_bi`
BEFORE INSERT ON `tb_estudiantes`
FOR EACH ROW
BEGIN
    DECLARE v_facultad_id BIGINT DEFAULT NULL;
    DECLARE v_facultad VARCHAR(200) DEFAULT NULL;
    DECLARE v_carrera_id BIGINT DEFAULT NULL;
    DECLARE v_carrera VARCHAR(200) DEFAULT NULL;

    CALL `sp_resolver_catalogo_academico`(
        NEW.facultad, NEW.carrera, NEW.facultad_id, NEW.carrera_id, NEW.created_by,
        v_facultad_id, v_facultad, v_carrera_id, v_carrera);

    SET NEW.facultad_id = v_facultad_id,
        NEW.facultad    = v_facultad,
        NEW.carrera_id  = v_carrera_id,
        NEW.carrera     = v_carrera;
END$$

-- 5.2 Sincronización del catálogo en estudiantes (MODIFICACIONES)
CREATE TRIGGER `trg_estudiantes_catalogo_bu`
BEFORE UPDATE ON `tb_estudiantes`
FOR EACH ROW
BEGIN
    DECLARE v_facultad_id BIGINT DEFAULT NULL;
    DECLARE v_facultad VARCHAR(200) DEFAULT NULL;
    DECLARE v_carrera_id BIGINT DEFAULT NULL;
    DECLARE v_carrera VARCHAR(200) DEFAULT NULL;

    CALL `sp_resolver_catalogo_academico`(
        NEW.facultad, NEW.carrera, NEW.facultad_id, NEW.carrera_id, NEW.updated_by,
        v_facultad_id, v_facultad, v_carrera_id, v_carrera);

    SET NEW.facultad_id = v_facultad_id,
        NEW.facultad    = v_facultad,
        NEW.carrera_id  = v_carrera_id,
        NEW.carrera     = v_carrera;
END$$

-- 5.3 Sincronización del catálogo en docentes (ALTAS)
CREATE TRIGGER `trg_docentes_catalogo_bi`
BEFORE INSERT ON `tb_docentes`
FOR EACH ROW
BEGIN
    DECLARE v_facultad_id BIGINT DEFAULT NULL;
    DECLARE v_facultad VARCHAR(200) DEFAULT NULL;
    DECLARE v_carrera_id BIGINT DEFAULT NULL;
    DECLARE v_carrera VARCHAR(200) DEFAULT NULL;

    CALL `sp_resolver_catalogo_academico`(
        NEW.facultad, NULL, NEW.facultad_id, NULL, NEW.created_by,
        v_facultad_id, v_facultad, v_carrera_id, v_carrera);

    SET NEW.facultad_id = v_facultad_id,
        NEW.facultad    = v_facultad;
END$$

-- 5.4 Sincronización del catálogo en docentes (MODIFICACIONES)
CREATE TRIGGER `trg_docentes_catalogo_bu`
BEFORE UPDATE ON `tb_docentes`
FOR EACH ROW
BEGIN
    DECLARE v_facultad_id BIGINT DEFAULT NULL;
    DECLARE v_facultad VARCHAR(200) DEFAULT NULL;
    DECLARE v_carrera_id BIGINT DEFAULT NULL;
    DECLARE v_carrera VARCHAR(200) DEFAULT NULL;

    CALL `sp_resolver_catalogo_academico`(
        NEW.facultad, NULL, NEW.facultad_id, NULL, NEW.updated_by,
        v_facultad_id, v_facultad, v_carrera_id, v_carrera);

    SET NEW.facultad_id = v_facultad_id,
        NEW.facultad    = v_facultad;
END$$

-- 5.5 Carga lectiva derivada: horas_totales = teóricas + prácticas
CREATE TRIGGER `trg_asignaciones_horas_bi`
BEFORE INSERT ON `tb_docente_asignaciones`
FOR EACH ROW
BEGIN
    IF NEW.horas_teoricas IS NULL OR NEW.horas_teoricas < 0
       OR NEW.horas_practicas IS NULL OR NEW.horas_practicas < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Las horas teoricas y practicas no pueden ser negativas';
    END IF;
    SET NEW.horas_totales = NEW.horas_teoricas + NEW.horas_practicas;
END$$

CREATE TRIGGER `trg_asignaciones_horas_bu`
BEFORE UPDATE ON `tb_docente_asignaciones`
FOR EACH ROW
BEGIN
    IF NEW.horas_teoricas IS NULL OR NEW.horas_teoricas < 0
       OR NEW.horas_practicas IS NULL OR NEW.horas_practicas < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Las horas teoricas y practicas no pueden ser negativas';
    END IF;
    SET NEW.horas_totales = NEW.horas_teoricas + NEW.horas_practicas;
END$$

-- 5.6 Inmutabilidad de la bitácora de auditoría
CREATE TRIGGER `trg_auditoria_no_update`
BEFORE UPDATE ON `tb_auditoria`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'tb_auditoria es inmutable: no se permite UPDATE';
END$$

CREATE TRIGGER `trg_auditoria_no_delete`
BEFORE DELETE ON `tb_auditoria`
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'tb_auditoria es inmutable: no se permite DELETE';
END$$

DELIMITER ;

-- ------------------------------------------------------------------------------
-- 6. VISTAS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW `vw_panel_institucional` AS
SELECT
    fn_periodo_actual() AS periodo,
    (SELECT u.nombre_corto FROM tb_universidad u
      WHERE u.is_active = 1 AND u.deleted_at IS NULL
      ORDER BY u.id LIMIT 1) AS universidad,
    fn_estado_licenciamiento() AS estado_licenciamiento,
    (SELECT COUNT(*) FROM tb_sedes s
      WHERE s.is_active = 1 AND s.deleted_at IS NULL) AS sedes_activas,
    fn_estudiantes_activos() AS estudiantes,
    fn_docentes_activos() AS docentes,
    fn_total_usuarios_activos() AS usuarios,
    (SELECT COUNT(*) FROM tb_facultades f WHERE f.is_active = 1) AS facultades,
    (SELECT COUNT(*) FROM tb_carreras c WHERE c.is_active = 1) AS carreras,
    (SELECT COUNT(*) FROM tb_auditoria) AS eventos_auditoria;

CREATE OR REPLACE VIEW `vw_catalogo_academico` AS
SELECT f.id AS facultad_id,
       f.nombre AS facultad,
       COUNT(DISTINCT c.id) AS carreras,
       COUNT(DISTINCT e.id) AS estudiantes
  FROM tb_facultades f
  LEFT JOIN tb_carreras c
         ON c.facultad_id = f.id
        AND c.is_active = 1
        AND c.deleted_at IS NULL
  LEFT JOIN tb_estudiantes e
         ON e.facultad_id = f.id
        AND e.is_active = 1
        AND e.deleted_at IS NULL
 WHERE f.is_active = 1
   AND f.deleted_at IS NULL
 GROUP BY f.id, f.nombre;

CREATE OR REPLACE VIEW `vw_estudiantes_por_facultad` AS
SELECT f.id AS facultad_id,
       f.nombre AS facultad,
       fn_carreras_por_facultad(f.nombre) AS carreras,
       COUNT(e.id) AS estudiantes,
       COALESCE(ROUND(AVG(e.promedio_ponderado), 2), 0.00) AS promedio
  FROM tb_facultades f
  LEFT JOIN tb_estudiantes e
         ON e.facultad_id = f.id
        AND e.is_active = 1
        AND e.deleted_at IS NULL
 WHERE f.is_active = 1
   AND f.deleted_at IS NULL
 GROUP BY f.id, f.nombre;

CREATE OR REPLACE VIEW `vw_docentes_por_categoria` AS
SELECT d.categoria,
       COUNT(DISTINCT d.id) AS docentes,
       COALESCE(SUM(a.horas_totales), 0) AS horas_asignadas
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

CREATE OR REPLACE VIEW `vw_actividad_auditoria_diaria` AS
SELECT DATE(a.fecha_hora) AS fecha,
       COUNT(*) AS eventos,
       SUM(a.resultado = 'SUCCESS') AS exitos,
       SUM(a.resultado = 'FAILURE') AS fallos,
       COUNT(DISTINCT a.usuario_id) AS usuarios
  FROM tb_auditoria a
 GROUP BY DATE(a.fecha_hora);

CREATE OR REPLACE VIEW `vw_matriz_permisos` AS
SELECT r.nombre AS rol,
       p.modulo AS modulo,
       COUNT(*) AS permisos,
       GROUP_CONCAT(p.nombre ORDER BY p.nombre SEPARATOR ', ') AS detalle
  FROM tb_roles r
  JOIN tb_rol_permiso rp ON rp.rol_id = r.id
  JOIN tb_permisos p ON p.id = rp.permiso_id
 WHERE r.is_active = 1
   AND p.is_active = 1
 GROUP BY r.nombre, p.modulo;

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
SELECT 'estudiantes_facultad_incoherente',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_estudiantes e
  LEFT JOIN tb_facultades f ON f.id = e.facultad_id
 WHERE e.facultad_id IS NOT NULL AND (f.id IS NULL OR f.nombre <> e.facultad)
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
 WHERE d.facultad_id IS NOT NULL AND (f.id IS NULL OR f.nombre <> d.facultad)
UNION ALL
SELECT 'asignaciones_horas_incoherentes',
       COUNT(*), 0, IF(COUNT(*) = 0, 'OK', 'ALERTA')
  FROM tb_docente_asignaciones
 WHERE horas_totales <> horas_teoricas + horas_practicas
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
-- 7. ÍNDICES: ALTAS NECESARIAS Y BAJAS DE REDUNDANTES
-- ------------------------------------------------------------------------------
CALL `sp_add_index_if_missing`('tb_estudiantes', 'idx_estudiantes_facultad',
    'ALTER TABLE `tb_estudiantes` ADD INDEX `idx_estudiantes_facultad` (`facultad`)');
CALL `sp_add_index_if_missing`('tb_estudiantes', 'idx_estudiantes_carrera',
    'ALTER TABLE `tb_estudiantes` ADD INDEX `idx_estudiantes_carrera` (`carrera`)');
CALL `sp_add_index_if_missing`('tb_estudiantes', 'idx_estudiantes_ciclo',
    'ALTER TABLE `tb_estudiantes` ADD INDEX `idx_estudiantes_ciclo` (`ciclo_actual`)');
CALL `sp_add_index_if_missing`('tb_estudiantes', 'idx_estudiantes_activo',
    'ALTER TABLE `tb_estudiantes` ADD INDEX `idx_estudiantes_activo` (`is_active`)');
CALL `sp_add_index_if_missing`('tb_docentes', 'idx_docentes_facultad',
    'ALTER TABLE `tb_docentes` ADD INDEX `idx_docentes_facultad` (`facultad`)');
CALL `sp_add_index_if_missing`('tb_docentes', 'idx_docentes_categoria',
    'ALTER TABLE `tb_docentes` ADD INDEX `idx_docentes_categoria` (`categoria`)');
CALL `sp_add_index_if_missing`('tb_docentes', 'idx_docentes_activo',
    'ALTER TABLE `tb_docentes` ADD INDEX `idx_docentes_activo` (`is_active`)');
CALL `sp_add_index_if_missing`('tb_estudiante_admisiones', 'idx_admisiones_periodo',
    'ALTER TABLE `tb_estudiante_admisiones` ADD INDEX `idx_admisiones_periodo` (`periodo`)');
CALL `sp_add_index_if_missing`('tb_estudiante_admisiones', 'idx_admisiones_modalidad',
    'ALTER TABLE `tb_estudiante_admisiones` ADD INDEX `idx_admisiones_modalidad` (`modalidad`)');
CALL `sp_add_index_if_missing`('tb_docente_asignaciones', 'idx_asignaciones_periodo',
    'ALTER TABLE `tb_docente_asignaciones` ADD INDEX `idx_asignaciones_periodo` (`periodo`)');
CALL `sp_add_index_if_missing`('tb_docente_asignaciones', 'idx_asignaciones_docente_periodo',
    'ALTER TABLE `tb_docente_asignaciones` ADD INDEX `idx_asignaciones_docente_periodo` (`docente_id`, `periodo`)');
CALL `sp_add_index_if_missing`('tb_docente_especialidades', 'idx_especialidades_nivel',
    'ALTER TABLE `tb_docente_especialidades` ADD INDEX `idx_especialidades_nivel` (`nivel`)');
CALL `sp_add_index_if_missing`('tb_sedes', 'idx_sedes_tipo',
    'ALTER TABLE `tb_sedes` ADD INDEX `idx_sedes_tipo` (`tipo`)');
CALL `sp_add_index_if_missing`('tb_sedes', 'idx_sedes_activo',
    'ALTER TABLE `tb_sedes` ADD INDEX `idx_sedes_activo` (`is_active`)');
CALL `sp_add_index_if_missing`('tb_auditoria', 'idx_auditoria_fecha_resultado',
    'ALTER TABLE `tb_auditoria` ADD INDEX `idx_auditoria_fecha_resultado` (`fecha_hora`, `resultado`)');

-- Índices redundantes: cada uno está cubierto por una clave única compuesta.
CALL `sp_drop_index_if_exists`('tb_usuarios', 'idx_usuarios_email');
CALL `sp_drop_index_if_exists`('tb_usuarios', 'idx_usuarios_username');
CALL `sp_drop_index_if_exists`('tb_usuario_rol', 'idx_usuario_rol_usuario');
CALL `sp_drop_index_if_exists`('tb_rol_permiso', 'idx_rol_permiso_rol');
CALL `sp_drop_index_if_exists`('tb_auditoria', 'idx_auditoria_fecha_hora');

-- ------------------------------------------------------------------------------
-- 8. RESTRICCIONES CHECK DE DOMINIO
-- ------------------------------------------------------------------------------
CALL `sp_add_check_if_missing`('tb_estudiantes', 'chk_estudiantes_promedio',
    'promedio_ponderado BETWEEN 0 AND 20');
CALL `sp_add_check_if_missing`('tb_estudiantes', 'chk_estudiantes_ciclo',
    'ciclo_actual BETWEEN 1 AND 12');
CALL `sp_add_check_if_missing`('tb_estudiantes', 'chk_estudiantes_creditos',
    'creditos_aprobados >= 0');
CALL `sp_add_check_if_missing`('tb_docente_asignaciones', 'chk_asignaciones_horas',
    'horas_teoricas >= 0 AND horas_practicas >= 0 AND horas_totales = horas_teoricas + horas_practicas');
CALL `sp_add_check_if_missing`('tb_estudiante_admisiones', 'chk_admisiones_puntaje',
    'puntaje IS NULL OR (puntaje BETWEEN 0 AND 20)');
CALL `sp_add_check_if_missing`('tb_sedes', 'chk_sedes_aforo',
    'aforo IS NULL OR aforo > 0');
CALL `sp_add_check_if_missing`('tb_sedes', 'chk_sedes_ambientes',
    '(num_pabellones IS NULL OR num_pabellones >= 0) AND (num_laboratorios IS NULL OR num_laboratorios >= 0)');

-- ------------------------------------------------------------------------------
-- 9. LIMPIEZA DE PROCEDIMIENTOS AUXILIARES DE MIGRACIÓN
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_add_column_if_missing`;
DROP PROCEDURE IF EXISTS `sp_add_index_if_missing`;
DROP PROCEDURE IF EXISTS `sp_drop_index_if_exists`;
DROP PROCEDURE IF EXISTS `sp_add_check_if_missing`;
DROP PROCEDURE IF EXISTS `sp_add_fk_if_missing`;

-- ------------------------------------------------------------------------------
-- 10. CONTROL DE VERSIÓN DE ESQUEMA
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version`
    (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_07',
       'Auditoría de Base de Datos, Normalización y Objetos Programables',
       'Catálogos tb_facultades/tb_carreras con FK, funciones, procedimientos, triggers, vistas, índices y restricciones CHECK.',
       'DBA_SENIOR',
       'SUCCESS'
 WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_07');
