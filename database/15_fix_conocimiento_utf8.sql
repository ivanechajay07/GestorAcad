-- Corrige la codificación de las fuentes iniciales del asistente.
USE `gestoracad_db`;
SET NAMES utf8mb4;

UPDATE `tb_conocimiento_documentos`
SET `nombre` = 'Guía del Gestor Académico',
    `categoria` = 'GENERAL',
    `contenido` = 'El Gestor Académico Virtual organiza la gestión universitaria en tres perfiles: Universidad, Docente y Estudiante. Los módulos incluyen universidad, estructura académica, docentes, estudiantes, usuarios, roles, auditoría y asistente académico. La información y los permisos dependen del rol asignado a cada cuenta. El perfil Universidad administra la institución, la estructura académica, los usuarios y los reportes. El perfil Docente accede a sus secciones, registra notas y asistencia, y cierra actas. El perfil Estudiante consulta su avance, sus cursos, sus calificaciones y su historial académico.'
WHERE `id` = 1;

UPDATE `tb_conocimiento_documentos`
SET `nombre` = 'Estructura académica',
    `categoria` = 'ACADEMICO',
    `contenido` = 'La estructura académica contempla periodos, facultades, carreras, cursos, planes de estudio, secciones, matrículas, prerrequisitos y horarios. Un periodo tiene una ventana de matrícula. Un plan de estudios agrupa cursos por ciclo. Una sección relaciona un curso con un periodo, un docente, un cupo y un horario. La matrícula valida cupo, créditos máximos, duplicidad de curso y prerrequisitos aprobados en acta. Los horarios no pueden generar choques de sección, docente o aula en el mismo periodo.'
WHERE `id` = 2;

UPDATE `tb_conocimiento_documentos`
SET `nombre` = 'Evaluación, notas y actas',
    `categoria` = 'EVALUACION',
    `contenido` = 'Cada sección puede tener evaluaciones con un peso y una nota máxima. La suma de pesos debe llegar a 100 para cerrar el acta. Las notas se registran por estudiante y evaluación. La asistencia se registra por fecha con estados PRESENTE, AUSENTE, TARDANZA o JUSTIFICADO. Al cerrar el acta se calcula el promedio ponderado y se suman los créditos del curso cuando el estudiante aprueba. Un acta cerrada bloquea la edición de notas, asistencia y evaluaciones. El acta puede consultarse desde el portal del docente y desde el portal del estudiante.'
WHERE `id` = 3;

UPDATE `tb_conocimiento_documentos`
SET `nombre` = 'Portales de estudiante y docente',
    `categoria` = 'PORTALES',
    `contenido` = 'El portal del estudiante permite consultar el avance académico, los cursos matriculados, las evaluaciones, la asistencia, el acta y el historial por periodos. El portal del docente permite consultar sus secciones asignadas, los estudiantes matriculados, las evaluaciones, las notas y la asistencia. Cada operación del docente valida que la sección pertenezca a su cuenta. El vínculo entre la cuenta y la ficha de estudiante o docente se administra desde el módulo de estudiantes o docentes.'
WHERE `id` = 4;

UPDATE `tb_conocimiento_documentos`
SET `nombre` = 'Seguridad y roles',
    `categoria` = 'SEGURIDAD',
    `contenido` = 'El sistema usa permisos con formato MODULO_ACCION. Los roles agrupan permisos y las cuentas reciben uno o más roles. El rol base es ROLE_UNIVERSIDAD y no puede eliminarse. El último administrador activo no puede deshabilitarse ni perder el rol base. Solo un administrador puede asignar ROLE_UNIVERSIDAD. Las operaciones de creación, edición, eliminación, cierre de acta y consultas sensibles quedan registradas en la bitácora de auditoría. La bitácora es inmutable a nivel de base de datos.'
WHERE `id` = 5;

DELETE FROM `tb_conocimiento_documentos` WHERE `nombre` = 'QA Asistente Temporal';
