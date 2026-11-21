# Módulo Docente (Fase 5)

Módulo responsable de la gestión del claustro académico de la universidad: padrón de docentes, especialidades académicas (formación) y asignaciones lectivas (carga horaria).

---

## 1. Alcance Funcional

| Componente | Descripción |
| :--- | :--- |
| **Padrón del claustro** | Registro de docentes con código institucional único, datos personales, documento de identidad, contacto, grado académico, título profesional, categoría y dedicación, adscripción a facultad/departamento y especialidad principal. |
| **Especialidades académicas** | Formación y especialidades de cada docente (`nivel`: Bachiller, Especialidad, Maestría, Doctorado, Diplomado), institución otorgante y año. |
| **Asignaciones lectivas** | Carga horaria por periodo: curso, código, sección, créditos, horas teóricas/prácticas/totales y estado de la cátedra. |

> **Fuera de alcance (Fase 5):** registro de notas, control de asistencia, generación de horarios y evaluaciones, que corresponden a la Fase 8.

---

## 2. Modelo de Datos (3FN)

| Tabla | Entidad JPA | Clave de negocio | Relaciones |
| :--- | :--- | :--- | :--- |
| `tb_docentes` | `Teacher` | `codigo` (única), `documento_identidad` (único) | 1:N con especialidades y asignaciones |
| `tb_docente_especialidades` | `TeacherSpecialty` | — | N:1 con `tb_docentes` (`ON DELETE CASCADE`) |
| `tb_docente_asignaciones` | `TeacherAssignment` | — | N:1 con `tb_docentes` (`ON DELETE CASCADE`) |

Todas las tablas heredan de `BaseEntity` (auditoría `created_at/updated_at/created_by/updated_by`, borrado lógico `deleted_at`, `is_active`) y aplican `CHECK` sobre `categoria` (`PRINCIPAL/ASOCIADO/AUXILIAR/CONTRATADO`), `dedicacion`, `nivel` y `estado` de la asignación.

La migración `database/05_teacher_module.sql` registra `FASE_05` en `tb_schema_version` y usa `SET NAMES utf8mb4` para preservar acentos.

---

## 3. Permisos (formato `MODULO_ACCION`)

| Permiso | Descripción |
| :--- | :--- |
| `DOCENTE_VIEW` / `DOCENTE_CREATE` / `DOCENTE_EDIT` / `DOCENTE_DELETE` / `DOCENTE_EXPORT` | Padrón docente. |
| `ESPECIALIDAD_VIEW` / `_CREATE` / `_EDIT` / `_DELETE` | Especialidades del docente. |
| `ASIGNACION_VIEW` / `_CREATE` / `_EDIT` / `_DELETE` | Asignaciones lectivas / carga horaria. |

- `ROLE_UNIVERSIDAD` recibe los **13 permisos**.
- `ROLE_DOCENTE` recibe `DOCENTE_VIEW`, `ESPECIALIDAD_VIEW` y `ASIGNACION_VIEW` (consulta).

---

## 4. API REST

| Método | Endpoint | Permiso | Descripción |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/teachers` | `DOCENTE_VIEW` | Lista el padrón (con `weeklyLoad`, `specialtyCount`, `assignmentCount`). |
| GET | `/api/v1/teachers/active` | `DOCENTE_VIEW` | Lista solo docentes activos. |
| GET | `/api/v1/teachers/{id}` | `DOCENTE_VIEW` | Detalle de un docente. |
| POST | `/api/v1/teachers` | `DOCENTE_CREATE` | Registra docente (valida código y documento únicos). |
| PUT | `/api/v1/teachers/{id}` | `DOCENTE_EDIT` | Actualiza docente. |
| PATCH | `/api/v1/teachers/{id}/status?active=` | `DOCENTE_EDIT` | Habilita/deshabilita docente. |
| DELETE | `/api/v1/teachers/{id}` | `DOCENTE_DELETE` | Borrado lógico. |
| GET | `/api/v1/teacher-specialties/teacher/{teacherId}` | `ESPECIALIDAD_VIEW` | Especialidades del docente. |
| POST | `/api/v1/teacher-specialties/teacher/{teacherId}` | `ESPECIALIDAD_CREATE` | Registra especialidad (nombre único por docente). |
| PUT / DELETE | `/api/v1/teacher-specialties/{id}` | `ESPECIALIDAD_EDIT` / `_DELETE` | Actualiza / elimina especialidad. |
| GET | `/api/v1/teacher-assignments/teacher/{teacherId}` | `ASIGNACION_VIEW` | Carga lectiva del docente. |
| POST | `/api/v1/teacher-assignments/teacher/{teacherId}` | `ASIGNACION_CREATE` | Registra asignación (curso único por docente+periodo). |
| PUT / DELETE | `/api/v1/teacher-assignments/{id}` | `ASIGNACION_EDIT` / `_DELETE` | Actualiza / elimina asignación. |

`totalHours` se calcula como `horas_teoricas + horas_practicas` cuando no se envía explícitamente.

---

## 5. Auditoría

Cada operación de escritura invoca `AuditService.log(...)` con usuario responsable (`SecurityUtils.getCurrentUsername()`), acción (`CREATE`/`UPDATE`/`DELETE`), módulo (`DOCENTE`, `ESPECIALIDAD`, `ASIGNACION`), descripción, endpoint, método HTTP, IP, user-agent, resultado (`SUCCESS`/`FAILURE`), entidad (`tb_docentes`, `tb_docente_especialidades`, `tb_docente_asignaciones`) e ID afectado. Los intentos con código/documento/especialidad/curso duplicados se registran como `FAILURE` antes de lanzar `ApiException` (HTTP 400).

---

## 6. Frontend

`TeachersPage` (`/teachers`, protegida por `DOCENTE_VIEW` en el sidebar):

- **Búsqueda y filtros** por nombre, código, departamento o correo; filtro por facultad y categoría.
- **Vistas** tarjetas y tabla, con indicadores de carga lectiva (`weeklyLoad`), nº de cátedras y especialidades.
- **Acciones por permiso:** registrar, editar, habilitar/deshabilitar y desactivar (según `DOCENTE_*`).
- **Modal de gestión** por docente con dos pestañas: Especialidades Académicas y Asignaciones/Carga Lectiva (alta, edición y eliminación según `ESPECIALIDAD_*` y `ASIGNACION_*`).

El cliente Axios (`frontend/src/services/teacherService.ts`) expone 14 operaciones y se apoya en el `api.ts` con JWT.

---

## 7. Datos Semilla

5 docentes del claustro (categorías Principal/Asociado, distintas facultades), 7 especialidades y 7 asignaciones lectivas del periodo 2026-I. El conteo semilla es 5 docentes.
