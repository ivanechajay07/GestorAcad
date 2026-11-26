-- ==============================================================================
-- GESTOR ACADÉMICO VIRTUAL
-- Fase 9.1 — Base de conocimiento del asistente académico
--   * Documentos persistentes
--   * Permisos de consulta y administración
--   * Fuentes iniciales
-- ==============================================================================

USE `gestoracad_db`;
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 1. TABLA DE DOCUMENTOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_conocimiento_documentos` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT,
    `nombre`     VARCHAR(160) NOT NULL,
    `categoria`  VARCHAR(60)  NOT NULL DEFAULT 'GENERAL',
    `contenido`  MEDIUMTEXT   NOT NULL,
    `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    `created_by` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA',
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` TIMESTAMP    NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_conocimiento_nombre` (`nombre`),
    KEY `idx_conocimiento_activo` (`is_active`, `categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Base de conocimiento del asistente académico local';

-- ------------------------------------------------------------------------------
-- 2. PERMISOS
-- ------------------------------------------------------------------------------
INSERT INTO `tb_permisos` (`nombre`, `modulo`, `descripcion`, `created_by`) VALUES
('CONOCIMIENTO_VIEW',   'CONOCIMIENTO', 'Permite consultar las fuentes y el asistente académico', 'DBA_SENIOR'),
('CONOCIMIENTO_CREATE', 'CONOCIMIENTO', 'Permite registrar fuentes en la base de conocimiento', 'DBA_SENIOR'),
('CONOCIMIENTO_DELETE', 'CONOCIMIENTO', 'Permite desactivar fuentes de la base de conocimiento', 'DBA_SENIOR')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id
FROM `tb_roles` r
CROSS JOIN `tb_permisos` p
WHERE r.nombre = 'ROLE_UNIVERSIDAD'
  AND p.nombre IN ('CONOCIMIENTO_VIEW', 'CONOCIMIENTO_CREATE', 'CONOCIMIENTO_DELETE');

INSERT IGNORE INTO `tb_rol_permiso` (`rol_id`, `permiso_id`)
SELECT r.id, p.id
FROM `tb_roles` r
CROSS JOIN `tb_permisos` p
WHERE r.nombre IN ('ROLE_DOCENTE', 'ROLE_ESTUDIANTE')
  AND p.nombre = 'CONOCIMIENTO_VIEW';

-- ------------------------------------------------------------------------------
-- 3. FUENTES INICIALES
-- ------------------------------------------------------------------------------
INSERT INTO `tb_conocimiento_documentos` (`nombre`, `categoria`, `contenido`, `created_by`)
SELECT 'Guía del Gestor Académico', 'GENERAL',
       'El Gestor Académico Virtual organiza la gestión universitaria en tres perfiles: Universidad, Docente y Estudiante. Los módulos incluyen universidad, estructura académica, docentes, estudiantes, usuarios, roles, auditoría y asistente académico. La información y los permisos dependen del rol asignado a cada cuenta. El perfil Universidad administra la institución, la estructura académica, los usuarios y los reportes. El perfil Docente accede a sus secciones, registra notas y asistencia, y cierra actas. El perfil Estudiante consulta su avance, sus cursos, sus calificaciones y su historial académico.',
       'DBA_SENIOR'
WHERE NOT EXISTS (SELECT 1 FROM `tb_conocimiento_documentos` WHERE `nombre` = 'Guía del Gestor Académico');

INSERT INTO `tb_conocimiento_documentos` (`nombre`, `categoria`, `contenido`, `created_by`)
SELECT 'Estructura académica', 'ACADEMICO',
       'La estructura académica contempla periodos, facultades, carreras, cursos, planes de estudio, secciones, matrículas, prerrequisitos y horarios. Un periodo tiene una ventana de matrícula. Un plan de estudios agrupa cursos por ciclo. Una sección relaciona un curso con un periodo, un docente, un cupo y un horario. La matrícula valida cupo, créditos máximos, duplicidad de curso y prerrequisitos aprobados en acta. Los horarios no pueden generar choques de sección, docente o aula en el mismo periodo.',
       'DBA_SENIOR'
WHERE NOT EXISTS (SELECT 1 FROM `tb_conocimiento_documentos` WHERE `nombre` = 'Estructura académica');

INSERT INTO `tb_conocimiento_documentos` (`nombre`, `categoria`, `contenido`, `created_by`)
SELECT 'Evaluación, notas y actas', 'EVALUACION',
       'Cada sección puede tener evaluaciones con un peso y una nota máxima. La suma de pesos debe llegar a 100 para cerrar el acta. Las notas se registran por estudiante y evaluación. La asistencia se registra por fecha con estados PRESENTE, AUSENTE, TARDANZA o JUSTIFICADO. Al cerrar el acta se calcula el promedio ponderado y se suman los créditos del curso cuando el estudiante aprueba. Un acta cerrada bloquea la edición de notas, asistencia y evaluaciones. El acta puede consultarse desde el portal del docente y desde el portal del estudiante.',
       'DBA_SENIOR'
WHERE NOT EXISTS (SELECT 1 FROM `tb_conocimiento_documentos` WHERE `nombre` = 'Evaluación, notas y actas');

INSERT INTO `tb_conocimiento_documentos` (`nombre`, `categoria`, `contenido`, `created_by`)
SELECT 'Portales de estudiante y docente', 'PORTALES',
       'El portal del estudiante permite consultar el avance académico, los cursos matriculados, las evaluaciones, la asistencia, el acta y el historial por periodos. El portal del docente permite consultar sus secciones asignadas, los estudiantes matriculados, las evaluaciones, las notas y la asistencia. Cada operación del docente valida que la sección pertenezca a su cuenta. El vínculo entre la cuenta y la ficha de estudiante o docente se administra desde el módulo de estudiantes o docentes.',
       'DBA_SENIOR'
WHERE NOT EXISTS (SELECT 1 FROM `tb_conocimiento_documentos` WHERE `nombre` = 'Portales de estudiante y docente');

INSERT INTO `tb_conocimiento_documentos` (`nombre`, `categoria`, `contenido`, `created_by`)
SELECT 'Seguridad y roles', 'SEGURIDAD',
       'El sistema usa permisos con formato MODULO_ACCION. Los roles agrupan permisos y las cuentas reciben uno o más roles. El rol base es ROLE_UNIVERSIDAD y no puede eliminarse. El último administrador activo no puede deshabilitarse ni perder el rol base. Solo un administrador puede asignar ROLE_UNIVERSIDAD. Las operaciones de creación, edición, eliminación, cierre de acta y consultas sensibles quedan registradas en la bitácora de auditoría. La bitácora es inmutable a nivel de base de datos.',
       'DBA_SENIOR'
WHERE NOT EXISTS (SELECT 1 FROM `tb_conocimiento_documentos` WHERE `nombre` = 'Seguridad y roles');

-- ------------------------------------------------------------------------------
-- 4. VERSIÓN
-- ------------------------------------------------------------------------------
INSERT INTO `tb_schema_version` (`phase_code`, `phase_name`, `description`, `installed_by`, `status`)
SELECT 'FASE_15', 'Base de conocimiento del asistente',
       'Tabla de documentos, permisos de conocimiento y fuentes iniciales.',
       'DBA_SENIOR', 'SUCCESS'
WHERE NOT EXISTS (SELECT 1 FROM `tb_schema_version` WHERE `phase_code` = 'FASE_15');
