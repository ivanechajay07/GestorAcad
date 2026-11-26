
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_actas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `seccion_id` bigint NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABIERTA',
  `fecha_cierre` datetime DEFAULT NULL,
  `cerrada_por` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_acta_seccion` (`seccion_id`),
  CONSTRAINT `fk_actas_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_acta_estado` CHECK ((`estado` in (_utf8mb4'ABIERTA',_utf8mb4'CERRADA')))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Acta de evaluación por sección';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_actas_detalle` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `acta_id` bigint NOT NULL,
  `estudiante_id` bigint NOT NULL,
  `promedio` decimal(5,2) NOT NULL DEFAULT '0.00',
  `aprobado` tinyint(1) NOT NULL DEFAULT '0',
  `creditos` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_acta_detalle_estudiante` (`acta_id`,`estudiante_id`),
  KEY `fk_acta_detalle_estudiante` (`estudiante_id`),
  CONSTRAINT `fk_acta_detalle_acta` FOREIGN KEY (`acta_id`) REFERENCES `tb_actas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_acta_detalle_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_acta_detalle_promedio` CHECK ((`promedio` between 0 and 20))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Resultado final por estudiante en el acta';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_asistencias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `seccion_id` bigint NOT NULL,
  `estudiante_id` bigint NOT NULL,
  `fecha` date NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRESENTE',
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_asistencia_seccion_estudiante_fecha` (`seccion_id`,`estudiante_id`,`fecha`),
  KEY `idx_asistencias_seccion_fecha` (`seccion_id`,`fecha`),
  KEY `fk_asistencias_estudiante` (`estudiante_id`),
  CONSTRAINT `fk_asistencias_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asistencias_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_asistencia_estado` CHECK ((`estado` in (_utf8mb4'PRESENTE',_utf8mb4'AUSENTE',_utf8mb4'TARDANZA',_utf8mb4'JUSTIFICADO')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asistencia por sección y fecha';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_auditoria` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint DEFAULT NULL COMMENT 'ID del usuario causante (NULL si es anónimo o fallido)',
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre de usuario o identificador enviado',
  `accion` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de acción ejecutada',
  `modulo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Módulo del sistema involucrado',
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Detalles del evento o payload resumido',
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ruta del endpoint solicitado',
  `metodo_http` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'GET, POST, PUT, DELETE, etc.',
  `ip_origen` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Dirección IP v4/v6 del cliente solicitante',
  `entidad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre de la entidad afectada (ej. tb_usuarios)',
  `id_entidad` bigint DEFAULT NULL COMMENT 'ID de la entidad afectada',
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User-Agent del cliente solicitante',
  `resultado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SUCCESS o FAILURE',
  `fecha_hora` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_usuario` (`usuario_id`),
  KEY `idx_auditoria_modulo` (`modulo`),
  KEY `idx_auditoria_accion` (`accion`),
  KEY `idx_auditoria_fecha_resultado` (`fecha_hora`,`resultado`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tb_usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_auditoria_accion` CHECK ((`accion` in (_utf8mb4'LOGIN',_utf8mb4'LOGOUT',_utf8mb4'CREATE',_utf8mb4'UPDATE',_utf8mb4'DELETE',_utf8mb4'VIEW',_utf8mb4'EXPORT',_utf8mb4'IMPORT'))),
  CONSTRAINT `chk_auditoria_resultado` CHECK ((`resultado` in (_utf8mb4'SUCCESS',_utf8mb4'FAILURE')))
) ENGINE=InnoDB AUTO_INCREMENT=319 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro inmutable de auditoría para trazabilidad forense';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017*/ /*!50003 TRIGGER `trg_auditoria_no_update` BEFORE UPDATE ON `tb_auditoria` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'tb_auditoria es inmutable: no se permite UPDATE';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017*/ /*!50003 TRIGGER `trg_auditoria_no_delete` BEFORE DELETE ON `tb_auditoria` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'tb_auditoria es inmutable: no se permite DELETE';
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_autoridades` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `universidad_id` bigint NOT NULL,
  `cargo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Rector, Vicerrector Académico, etc.',
  `nombres` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grado_academico` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documento_identidad` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `despacho` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `periodo_inicio` date DEFAULT NULL,
  `periodo_fin` date DEFAULT NULL,
  `resolucion_nombramiento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_autoridades_universidad` (`universidad_id`),
  CONSTRAINT `fk_autoridades_universidad` FOREIGN KEY (`universidad_id`) REFERENCES `tb_universidad` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Autoridades rectorales y de gobierno universitario';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_calificaciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `evaluacion_id` bigint NOT NULL,
  `estudiante_id` bigint NOT NULL,
  `nota` decimal(5,2) NOT NULL DEFAULT '0.00',
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_calificacion_evaluacion_estudiante` (`evaluacion_id`,`estudiante_id`),
  KEY `idx_calificaciones_estudiante` (`estudiante_id`,`is_active`),
  CONSTRAINT `fk_calificaciones_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_calificaciones_evaluacion` FOREIGN KEY (`evaluacion_id`) REFERENCES `tb_evaluaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_calificacion_nota` CHECK ((`nota` between 0 and 20))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Notas por evaluación y estudiante';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_carreras` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `facultad_id` bigint NOT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre oficial y único de la carrera',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_carreras_nombre` (`nombre`),
  KEY `idx_carreras_facultad` (`facultad_id`),
  CONSTRAINT `fk_carreras_facultad` FOREIGN KEY (`facultad_id`) REFERENCES `tb_facultades` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo normalizado de carreras profesionales';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_conocimiento_documentos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL',
  `contenido` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conocimiento_nombre` (`nombre`),
  KEY `idx_conocimiento_activo` (`is_active`,`categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Base de conocimiento del asistente acad??mico local';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_curso_prerrequisitos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `curso_id` bigint NOT NULL,
  `prerrequisito_id` bigint NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_prerrequisito_curso` (`curso_id`,`prerrequisito_id`),
  KEY `idx_prerrequisito_curso` (`curso_id`,`is_active`),
  KEY `fk_prerrequisito_origen` (`prerrequisito_id`),
  CONSTRAINT `fk_prerrequisito_curso` FOREIGN KEY (`curso_id`) REFERENCES `tb_cursos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prerrequisito_origen` FOREIGN KEY (`prerrequisito_id`) REFERENCES `tb_cursos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_prerrequisito_distinto` CHECK ((`curso_id` <> `prerrequisito_id`))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cursos que deben aprobarse antes de otro curso';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_cursos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código único del curso, por ejemplo MAT-101',
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `creditos` int NOT NULL DEFAULT '3',
  `horas_teoricas` int NOT NULL DEFAULT '0',
  `horas_practicas` int NOT NULL DEFAULT '0',
  `tipo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL' COMMENT 'GENERAL, ESPECIFICO o ELECTIVO',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cursos_codigo` (`codigo`),
  KEY `idx_cursos_tipo` (`tipo`,`is_active`),
  CONSTRAINT `chk_cursos_carga` CHECK (((`horas_teoricas` + `horas_practicas`) > 0)),
  CONSTRAINT `chk_cursos_creditos` CHECK ((`creditos` between 1 and 30)),
  CONSTRAINT `chk_cursos_horas` CHECK (((`horas_teoricas` between 0 and 40) and (`horas_practicas` between 0 and 40))),
  CONSTRAINT `chk_cursos_tipo` CHECK ((`tipo` in (_utf8mb4'GENERAL',_utf8mb4'ESPECIFICO',_utf8mb4'ELECTIVO')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de cursos y asignaturas de la estructura académica';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_docente_asignaciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `docente_id` bigint NOT NULL,
  `periodo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Periodo académico (ej. 2026-I)',
  `curso` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Curso o asignatura dictada',
  `codigo_curso` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seccion` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditos` int DEFAULT NULL,
  `horas_teoricas` int NOT NULL DEFAULT '0',
  `horas_practicas` int NOT NULL DEFAULT '0',
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ASIGNADA' COMMENT 'ASIGNADA, EN_CURSO, CONCLUIDA o RETIRADA',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_asignaciones_periodo` (`periodo`),
  KEY `idx_asignaciones_docente_periodo` (`docente_id`,`periodo`),
  CONSTRAINT `fk_asignaciones_docente` FOREIGN KEY (`docente_id`) REFERENCES `tb_docentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_asignaciones_estado` CHECK ((`estado` in (_utf8mb4'ASIGNADA',_utf8mb4'EN_CURSO',_utf8mb4'CONCLUIDA',_utf8mb4'RETIRADA'))),
  CONSTRAINT `chk_asignaciones_horas` CHECK (((`horas_teoricas` >= 0) and (`horas_practicas` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asignaciones lectivas y carga horaria del docente';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_docente_especialidades` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `docente_id` bigint NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre de la especialidad',
  `area` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Área de conocimiento',
  `nivel` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ESPECIALIDAD' COMMENT 'BACHILLER, ESPECIALIDAD, MAESTRIA, DOCTORADO o DIPLOMADO',
  `institucion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Institución otorgante',
  `anio` int DEFAULT NULL COMMENT 'Año de obtención',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_especialidades_docente` (`docente_id`),
  KEY `idx_especialidades_nivel` (`nivel`),
  CONSTRAINT `fk_especialidades_docente` FOREIGN KEY (`docente_id`) REFERENCES `tb_docentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_especialidades_nivel` CHECK ((`nivel` in (_utf8mb4'BACHILLER',_utf8mb4'ESPECIALIDAD',_utf8mb4'MAESTRIA',_utf8mb4'DOCTORADO',_utf8mb4'DIPLOMADO')))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Especialidades académicas y formación del docente';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_docentes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint DEFAULT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código institucional único del docente',
  `nombres` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documento_identidad` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'DNI / pasaporte / carnet de extranjería',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grado_academico` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Grado académico más alto (ej. Ph.D.)',
  `titulo_profesional` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CONTRATADO' COMMENT 'PRINCIPAL, ASOCIADO, AUXILIAR o CONTRATADO',
  `dedicacion` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TIEMPO_COMPLETO' COMMENT 'TIEMPO_COMPLETO, TIEMPO_PARCIAL o DEDICACION_EXCLUSIVA',
  `facultad_id` bigint NOT NULL,
  `departamento` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Departamento académico',
  `especialidad_principal` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_docentes_codigo` (`codigo`),
  UNIQUE KEY `uk_docentes_documento` (`documento_identidad`),
  UNIQUE KEY `uk_docentes_usuario` (`usuario_id`),
  KEY `idx_docentes_facultad_id` (`facultad_id`),
  KEY `idx_docentes_categoria` (`categoria`),
  KEY `idx_docentes_activo` (`is_active`),
  CONSTRAINT `fk_docentes_facultad` FOREIGN KEY (`facultad_id`) REFERENCES `tb_facultades` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_docentes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tb_usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_docentes_categoria` CHECK ((`categoria` in (_utf8mb4'PRINCIPAL',_utf8mb4'ASOCIADO',_utf8mb4'AUXILIAR',_utf8mb4'CONTRATADO'))),
  CONSTRAINT `chk_docentes_dedicacion` CHECK ((`dedicacion` in (_utf8mb4'TIEMPO_COMPLETO',_utf8mb4'TIEMPO_PARCIAL',_utf8mb4'DEDICACION_EXCLUSIVA')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Padrón del claustro académico (docentes)';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_estudiante_admisiones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `estudiante_id` bigint NOT NULL,
  `modalidad` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Modalidad de admisión',
  `periodo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Periodo académico de ingreso',
  `colegio_procedencia` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `puntaje` decimal(5,2) DEFAULT NULL COMMENT 'Puntaje obtenido en el proceso de admisión',
  `fecha_admision` date DEFAULT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ADMITIDO' COMMENT 'ADMITIDO, MATRICULADO o RETIRADO',
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_admisiones_estudiante` (`estudiante_id`),
  KEY `idx_admisiones_periodo` (`periodo`),
  KEY `idx_admisiones_modalidad` (`modalidad`),
  CONSTRAINT `fk_admisiones_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_admisiones_estado` CHECK ((`estado` in (_utf8mb4'ADMITIDO',_utf8mb4'MATRICULADO',_utf8mb4'RETIRADO'))),
  CONSTRAINT `chk_admisiones_puntaje` CHECK (((`puntaje` is null) or (`puntaje` between 0 and 20)))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de ingreso y admisión del estudiante';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_estudiantes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint DEFAULT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código de matrícula único del estudiante',
  `nombres` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documento_identidad` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'DNI / pasaporte / carné de extranjería',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MASCULINO, FEMENINO u OTRO',
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carrera_id` bigint NOT NULL,
  `facultad_id` bigint NOT NULL,
  `ciclo_actual` int NOT NULL DEFAULT '1' COMMENT 'Ciclo académico actual',
  `creditos_aprobados` int NOT NULL DEFAULT '0' COMMENT 'Créditos acumulados aprobados',
  `promedio_ponderado` decimal(4,2) NOT NULL DEFAULT '0.00' COMMENT 'Promedio ponderado acumulado (escala 0-20)',
  `condicion` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REGULAR' COMMENT 'REGULAR, OBSERVADO, EGRESADO, TERCIO_SUPERIOR o DECIMO_SUPERIOR',
  `estado_matricula` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MATRICULADO' COMMENT 'MATRICULADO, PENDIENTE, RESERVA o SUSPENDIDO',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_estudiantes_codigo` (`codigo`),
  UNIQUE KEY `uk_estudiantes_documento` (`documento_identidad`),
  UNIQUE KEY `uk_estudiantes_usuario` (`usuario_id`),
  KEY `idx_estudiantes_facultad_id` (`facultad_id`),
  KEY `idx_estudiantes_carrera_id` (`carrera_id`),
  KEY `idx_estudiantes_ciclo` (`ciclo_actual`),
  KEY `idx_estudiantes_activo` (`is_active`),
  CONSTRAINT `fk_estudiantes_carrera` FOREIGN KEY (`carrera_id`) REFERENCES `tb_carreras` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_estudiantes_facultad` FOREIGN KEY (`facultad_id`) REFERENCES `tb_facultades` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_estudiantes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tb_usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_estudiantes_ciclo` CHECK ((`ciclo_actual` between 1 and 12)),
  CONSTRAINT `chk_estudiantes_condicion` CHECK ((`condicion` in (_utf8mb4'REGULAR',_utf8mb4'OBSERVADO',_utf8mb4'EGRESADO',_utf8mb4'TERCIO_SUPERIOR',_utf8mb4'DECIMO_SUPERIOR'))),
  CONSTRAINT `chk_estudiantes_creditos` CHECK ((`creditos_aprobados` >= 0)),
  CONSTRAINT `chk_estudiantes_genero` CHECK (((`genero` is null) or (`genero` in (_utf8mb4'MASCULINO',_utf8mb4'FEMENINO',_utf8mb4'OTRO')))),
  CONSTRAINT `chk_estudiantes_matricula` CHECK ((`estado_matricula` in (_utf8mb4'MATRICULADO',_utf8mb4'PENDIENTE',_utf8mb4'RESERVA',_utf8mb4'SUSPENDIDO'))),
  CONSTRAINT `chk_estudiantes_promedio` CHECK ((`promedio_ponderado` between 0 and 20))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Expediente y padrón estudiantil';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_evaluaciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `seccion_id` bigint NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRACTICA',
  `peso` decimal(5,2) NOT NULL DEFAULT '0.00',
  `fecha` date DEFAULT NULL,
  `nota_maxima` decimal(5,2) NOT NULL DEFAULT '20.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_evaluacion_seccion_nombre` (`seccion_id`,`nombre`),
  KEY `idx_evaluaciones_seccion` (`seccion_id`,`is_active`),
  CONSTRAINT `fk_evaluaciones_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_evaluacion_nota` CHECK (((`nota_maxima` > 0) and (`nota_maxima` <= 20))),
  CONSTRAINT `chk_evaluacion_peso` CHECK ((`peso` between 0 and 100)),
  CONSTRAINT `chk_evaluacion_tipo` CHECK ((`tipo` in (_utf8mb4'PRACTICA',_utf8mb4'PARCIAL',_utf8mb4'FINAL',_utf8mb4'OTRO')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Evaluaciones de una sección';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_facultades` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre oficial y único de la facultad',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_facultades_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo normalizado de facultades';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_matriculas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `estudiante_id` bigint NOT NULL,
  `seccion_id` bigint NOT NULL,
  `fecha_matricula` date NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MATRICULADO',
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_matriculas_estudiante_seccion` (`estudiante_id`,`seccion_id`),
  KEY `idx_matriculas_seccion` (`seccion_id`,`is_active`),
  KEY `idx_matriculas_estado` (`estado`,`is_active`),
  CONSTRAINT `fk_matriculas_estudiante` FOREIGN KEY (`estudiante_id`) REFERENCES `tb_estudiantes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_matriculas_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_matriculas_estado` CHECK ((`estado` in (_utf8mb4'MATRICULADO',_utf8mb4'RETIRADO')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Matrícula de estudiantes en secciones';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_parametros` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_valor` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STRING' COMMENT 'STRING, NUMBER, BOOLEAN o DATE',
  `modulo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_parametros_clave` (`clave`),
  CONSTRAINT `chk_parametros_tipo` CHECK ((`tipo_valor` in (_utf8mb4'STRING',_utf8mb4'NUMBER',_utf8mb4'BOOLEAN',_utf8mb4'DATE')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Parámetros de configuración global del sistema';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_periodos_academicos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Identificador del periodo, por ejemplo 2026-I',
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `matricula_inicio` date DEFAULT NULL,
  `matricula_fin` date DEFAULT NULL,
  `es_actual` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Solo un periodo puede ser el vigente',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_periodos_codigo` (`codigo`),
  KEY `idx_periodos_actual` (`es_actual`,`is_active`),
  CONSTRAINT `chk_periodos_fechas` CHECK ((`fecha_fin` >= `fecha_inicio`)),
  CONSTRAINT `chk_periodos_matricula` CHECK (((`matricula_inicio` is null) or (`matricula_fin` is null) or (`matricula_fin` >= `matricula_inicio`)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Periodos académicos y calendario de matrícula';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_permisos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código de permiso (ej. USUARIO_READ, ACADEMICO_WRITE)',
  `modulo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Módulo funcional al que pertenece el permiso',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Descripción del privilegio',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permisos_nombre` (`nombre`),
  KEY `idx_permisos_modulo` (`modulo`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de permisos atómicos del sistema';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_plan_cursos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `plan_id` bigint NOT NULL,
  `curso_id` bigint NOT NULL,
  `ciclo` int NOT NULL,
  `obligatorio` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plan_curso` (`plan_id`,`curso_id`),
  KEY `idx_plan_cursos_ciclo` (`plan_id`,`ciclo`),
  KEY `idx_plan_cursos_curso` (`curso_id`),
  CONSTRAINT `fk_plan_cursos_curso` FOREIGN KEY (`curso_id`) REFERENCES `tb_cursos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_plan_cursos_plan` FOREIGN KEY (`plan_id`) REFERENCES `tb_planes_estudio` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_plan_cursos_ciclo` CHECK ((`ciclo` between 1 and 20))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Malla curricular: cursos asignados a un plan y ciclo';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_planes_estudio` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `carrera_id` bigint NOT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `anio` int NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_planes_codigo` (`codigo`),
  KEY `idx_planes_carrera` (`carrera_id`,`is_active`),
  CONSTRAINT `fk_planes_carrera` FOREIGN KEY (`carrera_id`) REFERENCES `tb_carreras` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_planes_anio` CHECK ((`anio` between 2000 and 2100))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Planes de estudio por carrera';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_rol_permiso` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `rol_id` bigint NOT NULL,
  `permiso_id` bigint NOT NULL,
  `asignado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rol_permiso` (`rol_id`,`permiso_id`),
  KEY `idx_rol_permiso_permiso` (`permiso_id`),
  CONSTRAINT `fk_rol_permiso_permiso` FOREIGN KEY (`permiso_id`) REFERENCES `tb_permisos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_rol_permiso_rol` FOREIGN KEY (`rol_id`) REFERENCES `tb_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=159 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asociación entre roles y sus permisos granulares';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Identificador único del rol (ej. ROLE_UNIVERSIDAD)',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Descripción de responsabilidades del rol',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de roles institucionales';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_schema_version` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `phase_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código identificador de la fase del proyecto',
  `phase_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre descriptivo de la fase',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Detalles técnicos de la fase',
  `installed_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de aplicación',
  `installed_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'SISTEMA_DEV' COMMENT 'Autor o responsable de la instalación',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUCCESS' COMMENT 'Estado de la migración',
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_schema_status` CHECK ((`status` in (_utf8mb4'SUCCESS',_utf8mb4'PENDING',_utf8mb4'FAILED')))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de control de versiones del esquema de base de datos';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_seccion_horarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `seccion_id` bigint NOT NULL,
  `dia_semana` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `aula` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_horario_seccion_dia_hora` (`seccion_id`,`dia_semana`,`hora_inicio`),
  KEY `idx_horario_seccion` (`seccion_id`,`is_active`),
  KEY `idx_horario_dia` (`dia_semana`,`hora_inicio`,`hora_fin`),
  CONSTRAINT `fk_horario_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `tb_secciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_horario_dia` CHECK ((`dia_semana` in (_utf8mb4'LUNES',_utf8mb4'MARTES',_utf8mb4'MIERCOLES',_utf8mb4'JUEVES',_utf8mb4'VIERNES',_utf8mb4'SABADO',_utf8mb4'DOMINGO'))),
  CONSTRAINT `chk_horario_horas` CHECK ((`hora_fin` > `hora_inicio`))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bloques de horario estructurados por sección';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_secciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `periodo_id` bigint NOT NULL,
  `curso_id` bigint NOT NULL,
  `docente_id` bigint DEFAULT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacidad` int NOT NULL DEFAULT '30',
  `turno` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aula` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horario` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_secciones_periodo_curso_codigo` (`periodo_id`,`curso_id`,`codigo`),
  KEY `idx_secciones_periodo` (`periodo_id`,`is_active`),
  KEY `idx_secciones_docente` (`docente_id`),
  KEY `fk_secciones_curso` (`curso_id`),
  CONSTRAINT `fk_secciones_curso` FOREIGN KEY (`curso_id`) REFERENCES `tb_cursos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_secciones_docente` FOREIGN KEY (`docente_id`) REFERENCES `tb_docentes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_secciones_periodo` FOREIGN KEY (`periodo_id`) REFERENCES `tb_periodos_academicos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_secciones_capacidad` CHECK ((`capacidad` between 1 and 200))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Secciones ofertadas por periodo, curso y docente';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_sedes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `universidad_id` bigint NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CAMPUS' COMMENT 'SEDE_PRINCIPAL, CAMPUS o FILIAL',
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `distrito` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ciudad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aforo` int DEFAULT NULL COMMENT 'Capacidad máxima de estudiantes',
  `num_pabellones` int DEFAULT NULL,
  `num_laboratorios` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sedes_codigo` (`codigo`),
  KEY `fk_sedes_universidad` (`universidad_id`),
  KEY `idx_sedes_tipo` (`tipo`),
  KEY `idx_sedes_activo` (`is_active`),
  CONSTRAINT `fk_sedes_universidad` FOREIGN KEY (`universidad_id`) REFERENCES `tb_universidad` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_sedes_aforo` CHECK (((`aforo` is null) or (`aforo` > 0))),
  CONSTRAINT `chk_sedes_ambientes` CHECK ((((`num_pabellones` is null) or (`num_pabellones` >= 0)) and ((`num_laboratorios` is null) or (`num_laboratorios` >= 0)))),
  CONSTRAINT `chk_sedes_tipo` CHECK ((`tipo` in (_utf8mb4'SEDE_PRINCIPAL',_utf8mb4'CAMPUS',_utf8mb4'FILIAL')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sedes, campus y filiales de la universidad';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_universidad` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre oficial de la institución',
  `nombre_corto` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Sigla o acrónimo institucional',
  `lema` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lema institucional',
  `tipo_institucion` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PUBLICA' COMMENT 'PUBLICA o PRIVADA',
  `ruc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'RUC / identificador tributario',
  `resolucion_licenciamiento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Resolución de licenciamiento institucional',
  `estado_licenciamiento` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Estado de licenciamiento (ej. LICENCIADA)',
  `vigencia_acreditacion` date DEFAULT NULL COMMENT 'Fecha de vigencia de la acreditación',
  `fecha_fundacion` date DEFAULT NULL COMMENT 'Fecha de fundación de la institución',
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Dirección de la sede legal',
  `telefono` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sitio_web` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_universidad_ruc` (`ruc`),
  CONSTRAINT `chk_universidad_tipo` CHECK ((`tipo_institucion` in (_utf8mb4'PUBLICA',_utf8mb4'PRIVADA')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Institución universitaria matriz (Rectoría)';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_usuario_rol` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint NOT NULL,
  `rol_id` bigint NOT NULL,
  `asignado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `asignado_por` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_rol` (`usuario_id`,`rol_id`),
  KEY `idx_usuario_rol_rol` (`rol_id`),
  CONSTRAINT `fk_usuario_rol_rol` FOREIGN KEY (`rol_id`) REFERENCES `tb_roles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_usuario_rol_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `tb_usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Asociación entre usuarios y sus roles asignados';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre de usuario único para inicio de sesión',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Correo electrónico institucional único',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Contraseña cifrada con algoritmo BCrypt (cost factor 10+)',
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombres del usuario',
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Apellidos del usuario',
  `telefono` varchar(25) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teléfono de contacto',
  `departamento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Departamento o área institucional',
  `cuenta_bloqueada` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la cuenta fue bloqueada por intentos fallidos',
  `cuenta_expirada` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la cuenta expiró',
  `credenciales_expiradas` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indica si la contraseña debe renovarse',
  `intentos_fallidos` int NOT NULL DEFAULT '0' COMMENT 'Contador de intentos de login fallidos consecutivos',
  `bloqueado_hasta` timestamp NULL DEFAULT NULL COMMENT 'Fecha/hora hasta la cual la cuenta permanece bloqueada',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SISTEMA',
  `updated_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `avatar` text COLLATE utf8mb4_unicode_ci,
  `ultima_conexion` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuarios_username` (`username`),
  UNIQUE KEY `uk_usuarios_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cuentas de usuarios y credenciales seguras';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `vw_actividad_auditoria_diaria`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_actividad_auditoria_diaria` AS SELECT 
 1 AS `fecha`,
 1 AS `eventos`,
 1 AS `exitos`,
 1 AS `fallos`,
 1 AS `usuarios`*/;
SET character_set_client = @saved_cs_client;
/*!50001 DROP VIEW IF EXISTS `vw_carga_docente`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_carga_docente` AS SELECT 
 1 AS `docente_id`,
 1 AS `codigo`,
 1 AS `docente`,
 1 AS `facultad`,
 1 AS `categoria`,
 1 AS `dedicacion`,
 1 AS `asignaciones`,
 1 AS `horas_teoricas`,
 1 AS `horas_practicas`,
 1 AS `horas_totales`*/;
SET character_set_client = @saved_cs_client;
/*!50001 DROP VIEW IF EXISTS `vw_catalogo_academico`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_catalogo_academico` AS SELECT 
 1 AS `facultad_id`,
 1 AS `facultad`,
 1 AS `carreras`,
 1 AS `estudiantes`*/;
SET character_set_client = @saved_cs_client;
/*!50001 DROP VIEW IF EXISTS `vw_docentes_por_categoria`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_docentes_por_categoria` AS SELECT 
 1 AS `categoria`,
 1 AS `docentes`,
 1 AS `horas_asignadas`*/;
SET character_set_client = @saved_cs_client;
/*!50001 DROP VIEW IF EXISTS `vw_estudiantes_por_facultad`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_estudiantes_por_facultad` AS SELECT 
 1 AS `facultad_id`,
 1 AS `facultad`,
 1 AS `carreras`,
 1 AS `estudiantes`,
 1 AS `promedio`*/;
SET character_set_client = @saved_cs_client;
/*!50001 DROP VIEW IF EXISTS `vw_integridad_datos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_integridad_datos` AS SELECT 
 1 AS `metrica`,
 1 AS `valor`,
 1 AS `esperado`,
 1 AS `estado`*/;
SET character_set_client = @saved_cs_client;
/*!50001 DROP VIEW IF EXISTS `vw_matriz_permisos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_matriz_permisos` AS SELECT 
 1 AS `rol`,
 1 AS `modulo`,
 1 AS `permisos`,
 1 AS `detalle`*/;
SET character_set_client = @saved_cs_client;
/*!50001 DROP VIEW IF EXISTS `vw_panel_institucional`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_panel_institucional` AS SELECT 
 1 AS `periodo`,
 1 AS `universidad`,
 1 AS `estado_licenciamiento`,
 1 AS `sedes_activas`,
 1 AS `estudiantes`,
 1 AS `docentes`,
 1 AS `usuarios`,
 1 AS `facultades`,
 1 AS `carreras`,
 1 AS `eventos_auditoria`*/;
SET character_set_client = @saved_cs_client;
/*!50003 DROP FUNCTION IF EXISTS `fn_carga_horaria_docente` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_carga_horaria_docente`(p_docente_id BIGINT) RETURNS int
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_carreras_por_facultad` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_carreras_por_facultad`(p_facultad VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci) RETURNS int
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_docentes_activos` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_docentes_activos`() RETURNS int
    READS SQL DATA
    COMMENT 'Cantidad de docentes activos no eliminados'
BEGIN
    DECLARE v_total INT DEFAULT 0;
    SELECT COUNT(*) INTO v_total
      FROM tb_docentes
     WHERE is_active = 1 AND deleted_at IS NULL;
    RETURN v_total;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_estado_licenciamiento` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_estado_licenciamiento`() RETURNS varchar(50) CHARSET utf8mb4
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_estudiantes_activos` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_estudiantes_activos`() RETURNS int
    READS SQL DATA
    COMMENT 'Cantidad de estudiantes activos no eliminados'
BEGIN
    DECLARE v_total INT DEFAULT 0;
    SELECT COUNT(*) INTO v_total
      FROM tb_estudiantes
     WHERE is_active = 1 AND deleted_at IS NULL;
    RETURN v_total;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_periodo_actual` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_periodo_actual`() RETURNS varchar(20) CHARSET utf8mb4
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_promedio_facultad` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_promedio_facultad`(p_facultad VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci) RETURNS decimal(5,2)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_total_usuarios_activos` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE FUNCTION `fn_total_usuarios_activos`() RETURNS int
    READS SQL DATA
    COMMENT 'Cantidad de usuarios activos no eliminados'
BEGIN
    DECLARE v_total INT DEFAULT 0;
    SELECT COUNT(*) INTO v_total
      FROM tb_usuarios
     WHERE is_active = 1 AND deleted_at IS NULL;
    RETURN v_total;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_estudiantes_por_ciclo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_estudiantes_por_ciclo`()
    READS SQL DATA
    COMMENT 'Distribución de estudiantes activos por ciclo académico'
BEGIN
    SELECT e.ciclo_actual AS ciclo, COUNT(*) AS estudiantes
      FROM tb_estudiantes e
     WHERE e.is_active = 1 AND e.deleted_at IS NULL
     GROUP BY e.ciclo_actual
     ORDER BY e.ciclo_actual;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_registrar_auditoria` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_reporte_auditoria` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_reporte_carga_docente` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_reporte_carga_docente`()
    READS SQL DATA
    COMMENT 'Reporte de carga lectiva por docente en el periodo vigente'
BEGIN
    SELECT * FROM vw_carga_docente
     ORDER BY horas_totales DESC, docente ASC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_reporte_facultades` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_reporte_facultades`()
    READS SQL DATA
    COMMENT 'Reporte de estudiantes y promedio por facultad'
BEGIN
    SELECT * FROM vw_estudiantes_por_facultad
     ORDER BY estudiantes DESC, facultad ASC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_resolver_catalogo_academico` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
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

    
    IF v_carrera_id IS NULL
       AND p_carrera IS NOT NULL AND TRIM(p_carrera) <> ''
       AND v_facultad_id IS NOT NULL THEN
        INSERT INTO tb_carreras (facultad_id, nombre, created_by)
        VALUES (v_facultad_id, TRIM(p_carrera), v_usuario)
        ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
        SET v_carrera_id = LAST_INSERT_ID();

        
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_resumen_institucional` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_verificar_integridad` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE PROCEDURE `sp_verificar_integridad`()
    READS SQL DATA
    COMMENT 'Ejecuta los controles de calidad de datos'
BEGIN
    SELECT * FROM vw_integridad_datos;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50001 DROP VIEW IF EXISTS `vw_actividad_auditoria_diaria`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_actividad_auditoria_diaria` AS select cast(`a`.`fecha_hora` as date) AS `fecha`,count(0) AS `eventos`,sum((`a`.`resultado` = 'SUCCESS')) AS `exitos`,sum((`a`.`resultado` = 'FAILURE')) AS `fallos`,count(distinct `a`.`usuario_id`) AS `usuarios` from `tb_auditoria` `a` group by cast(`a`.`fecha_hora` as date) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_carga_docente`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_carga_docente` AS select `d`.`id` AS `docente_id`,`d`.`codigo` AS `codigo`,concat(`d`.`apellidos`,', ',`d`.`nombres`) AS `docente`,`f`.`nombre` AS `facultad`,`d`.`categoria` AS `categoria`,`d`.`dedicacion` AS `dedicacion`,(select count(0) from `tb_docente_asignaciones` `a` where ((`a`.`docente_id` = `d`.`id`) and (`a`.`is_active` = 1) and (`a`.`deleted_at` is null) and (`a`.`periodo` = `fn_periodo_actual`()))) AS `asignaciones`,coalesce((select sum(`a`.`horas_teoricas`) from `tb_docente_asignaciones` `a` where ((`a`.`docente_id` = `d`.`id`) and (`a`.`is_active` = 1) and (`a`.`deleted_at` is null) and (`a`.`periodo` = `fn_periodo_actual`()))),0) AS `horas_teoricas`,coalesce((select sum(`a`.`horas_practicas`) from `tb_docente_asignaciones` `a` where ((`a`.`docente_id` = `d`.`id`) and (`a`.`is_active` = 1) and (`a`.`deleted_at` is null) and (`a`.`periodo` = `fn_periodo_actual`()))),0) AS `horas_practicas`,`fn_carga_horaria_docente`(`d`.`id`) AS `horas_totales` from (`tb_docentes` `d` left join `tb_facultades` `f` on((`f`.`id` = `d`.`facultad_id`))) where ((`d`.`is_active` = 1) and (`d`.`deleted_at` is null)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_catalogo_academico`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_catalogo_academico` AS select `f`.`id` AS `facultad_id`,`f`.`nombre` AS `facultad`,count(distinct `c`.`id`) AS `carreras`,count(distinct `e`.`id`) AS `estudiantes` from ((`tb_facultades` `f` left join `tb_carreras` `c` on(((`c`.`facultad_id` = `f`.`id`) and (`c`.`is_active` = 1) and (`c`.`deleted_at` is null)))) left join `tb_estudiantes` `e` on(((`e`.`facultad_id` = `f`.`id`) and (`e`.`is_active` = 1) and (`e`.`deleted_at` is null)))) where ((`f`.`is_active` = 1) and (`f`.`deleted_at` is null)) group by `f`.`id`,`f`.`nombre` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_docentes_por_categoria`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_docentes_por_categoria` AS select `d`.`categoria` AS `categoria`,count(distinct `d`.`id`) AS `docentes`,coalesce(sum((`a`.`horas_teoricas` + `a`.`horas_practicas`)),0) AS `horas_asignadas` from (`tb_docentes` `d` left join `tb_docente_asignaciones` `a` on(((`a`.`docente_id` = `d`.`id`) and (`a`.`is_active` = 1) and (`a`.`deleted_at` is null) and (`a`.`periodo` = `fn_periodo_actual`())))) where ((`d`.`is_active` = 1) and (`d`.`deleted_at` is null)) group by `d`.`categoria` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_estudiantes_por_facultad`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_estudiantes_por_facultad` AS select `f`.`id` AS `facultad_id`,`f`.`nombre` AS `facultad`,`fn_carreras_por_facultad`(`f`.`nombre`) AS `carreras`,count(`e`.`id`) AS `estudiantes`,coalesce(round(avg(`e`.`promedio_ponderado`),2),0.00) AS `promedio` from (`tb_facultades` `f` left join `tb_estudiantes` `e` on(((`e`.`facultad_id` = `f`.`id`) and (`e`.`is_active` = 1) and (`e`.`deleted_at` is null)))) where ((`f`.`is_active` = 1) and (`f`.`deleted_at` is null)) group by `f`.`id`,`f`.`nombre` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_integridad_datos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_integridad_datos` AS select 'estudiantes_activos_sin_facultad' AS `metrica`,count(0) AS `valor`,0 AS `esperado`,if((count(0) = 0),'OK','ALERTA') AS `estado` from `tb_estudiantes` where ((`tb_estudiantes`.`is_active` = 1) and (`tb_estudiantes`.`deleted_at` is null) and (`tb_estudiantes`.`facultad_id` is null)) union all select 'estudiantes_activos_sin_carrera' AS `estudiantes_activos_sin_carrera`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from `tb_estudiantes` where ((`tb_estudiantes`.`is_active` = 1) and (`tb_estudiantes`.`deleted_at` is null) and (`tb_estudiantes`.`carrera_id` is null)) union all select 'estudiantes_carrera_facultad_incoherente' AS `estudiantes_carrera_facultad_incoherente`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from (`tb_estudiantes` `e` join `tb_carreras` `c` on((`c`.`id` = `e`.`carrera_id`))) where ((`e`.`facultad_id` is not null) and (`c`.`facultad_id` <> `e`.`facultad_id`)) union all select 'docentes_activos_sin_facultad' AS `docentes_activos_sin_facultad`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from `tb_docentes` where ((`tb_docentes`.`is_active` = 1) and (`tb_docentes`.`deleted_at` is null) and (`tb_docentes`.`facultad_id` is null)) union all select 'docentes_facultad_incoherente' AS `docentes_facultad_incoherente`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from (`tb_docentes` `d` left join `tb_facultades` `f` on((`f`.`id` = `d`.`facultad_id`))) where ((`d`.`facultad_id` is not null) and (`f`.`id` is null)) union all select 'asignaciones_horas_incoherentes' AS `asignaciones_horas_incoherentes`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from `tb_docente_asignaciones` where ((`tb_docente_asignaciones`.`horas_teoricas` < 0) or (`tb_docente_asignaciones`.`horas_practicas` < 0)) union all select 'usuarios_activos_sin_rol' AS `usuarios_activos_sin_rol`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from `tb_usuarios` `u` where ((`u`.`is_active` = 1) and (`u`.`deleted_at` is null) and exists(select 1 from `tb_usuario_rol` `ur` where (`ur`.`usuario_id` = `u`.`id`)) is false) union all select 'estudiantes_promedio_fuera_rango' AS `estudiantes_promedio_fuera_rango`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from `tb_estudiantes` where ((`tb_estudiantes`.`promedio_ponderado` < 0) or (`tb_estudiantes`.`promedio_ponderado` > 20)) union all select 'estudiantes_ciclo_fuera_rango' AS `estudiantes_ciclo_fuera_rango`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from `tb_estudiantes` where ((`tb_estudiantes`.`ciclo_actual` < 1) or (`tb_estudiantes`.`ciclo_actual` > 12)) union all select 'admisiones_puntaje_fuera_rango' AS `admisiones_puntaje_fuera_rango`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from `tb_estudiante_admisiones` where ((`tb_estudiante_admisiones`.`puntaje` is not null) and ((`tb_estudiante_admisiones`.`puntaje` < 0) or (`tb_estudiante_admisiones`.`puntaje` > 20))) union all select 'parametros_requeridos_faltantes' AS `parametros_requeridos_faltantes`,count(0) AS `COUNT(*)`,0 AS `0`,if((count(0) = 0),'OK','ALERTA') AS `IF(COUNT(*) = 0, 'OK', 'ALERTA')` from (select 'PERIODO_ACADEMICO_ACTUAL' AS `clave` union all select 'NOTA_MINIMA_APROBATORIA' AS `NOTA_MINIMA_APROBATORIA` union all select 'MAX_CREDITOS_POR_PERIODO' AS `MAX_CREDITOS_POR_PERIODO`) `req` where exists(select 1 from `tb_parametros` `p` where ((`p`.`clave` = `req`.`clave`) and (`p`.`is_active` = 1))) is false */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_matriz_permisos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_matriz_permisos` AS select `r`.`nombre` AS `rol`,`p`.`modulo` AS `modulo`,count(0) AS `permisos`,group_concat(`p`.`nombre` order by `p`.`nombre` ASC separator ', ') AS `detalle` from ((`tb_roles` `r` join `tb_rol_permiso` `rp` on((`rp`.`rol_id` = `r`.`id`))) join `tb_permisos` `p` on((`p`.`id` = `rp`.`permiso_id`))) where ((`r`.`is_active` = 1) and (`p`.`is_active` = 1)) group by `r`.`nombre`,`p`.`modulo` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_panel_institucional`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_panel_institucional` AS select `fn_periodo_actual`() AS `periodo`,(select `u`.`nombre_corto` from `tb_universidad` `u` where ((`u`.`is_active` = 1) and (`u`.`deleted_at` is null)) order by `u`.`id` limit 1) AS `universidad`,`fn_estado_licenciamiento`() AS `estado_licenciamiento`,(select count(0) from `tb_sedes` `s` where ((`s`.`is_active` = 1) and (`s`.`deleted_at` is null))) AS `sedes_activas`,`fn_estudiantes_activos`() AS `estudiantes`,`fn_docentes_activos`() AS `docentes`,`fn_total_usuarios_activos`() AS `usuarios`,(select count(0) from `tb_facultades` `f` where (`f`.`is_active` = 1)) AS `facultades`,(select count(0) from `tb_carreras` `c` where (`c`.`is_active` = 1)) AS `carreras`,(select count(0) from `tb_auditoria`) AS `eventos_auditoria` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

