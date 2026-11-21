# Módulo Estudiante (Fase 6)

Módulo responsable de la gestión del padrón estudiantil de la universidad: expediente y datos personales, estado académico e historial de ingreso (admisión).

---

## 1. Alcance Funcional

| Componente | Descripción |
| :--- | :--- |
| **Expediente estudiantil** | Registro de estudiantes con código de matrícula único, datos personales (nombres, apellidos, documento de identidad, nacimiento, género, contacto, dirección) y adscripción académica (carrera y facultad). |
| **Estado académico** | Ciclo actual, créditos aprobados, promedio ponderado acumulado (escala 0–20), condición del estudiante y estado de matrícula. |
| **Historial de ingreso** | Registros de admisión de cada estudiante: modalidad, periodo, colegio de procedencia, puntaje, fecha, estado y observaciones. |

> **Fuera de alcance (Fase 6):** matrícula por asignatura, registro de notas, control de asistencia, horarios y actas, que corresponden a las Fases 7 y 8.

---

## 2. Modelo de Datos (3FN)

| Tabla | Entidad JPA | Clave de negocio | Relaciones |
| :--- | :--- | :--- | :--- |
| `tb_estudiantes` | `Student` | `codigo` (única), `documento_identidad` (único) | 1:N con admisiones |
| `tb_estudiante_admisiones` | `StudentAdmission` | — | N:1 con `tb_estudiantes` (`ON DELETE CASCADE`) |

Todas las tablas heredan de `BaseEntity` (auditoría `created_at/updated_at/created_by/updated_by`, borrado lógico `deleted_at`, `is_active`) y aplican `CHECK` sobre `genero` (`MASCULINO/FEMENINO/OTRO`), `condicion` (`REGULAR/OBSERVADO/EGRESADO/TERCIO_SUPERIOR/DECIMO_SUPERIOR`), `estado_matricula` (`MATRICULADO/PENDIENTE/RESERVA/SUSPENDIDO`) y `estado` de la admisión (`ADMITIDO/MATRICULADO/RETIRADO`).

La migración `database/06_student_module.sql` registra `FASE_06` en `tb_schema_version` y usa `SET NAMES utf8mb4` para preservar acentos.

---

## 3. Permisos (formato `MODULO_ACCION`)

| Permiso | Descripción |
| :--- | :--- |
| `ESTUDIANTE_VIEW` / `ESTUDIANTE_CREATE` / `ESTUDIANTE_EDIT` / `ESTUDIANTE_DELETE` / `ESTUDIANTE_EXPORT` | Padrón y expedientes estudiantiles. |
| `ADMISION_VIEW` / `ADMISION_CREATE` / `ADMISION_EDIT` / `ADMISION_DELETE` | Historial de ingreso / admisiones. |

- `ROLE_UNIVERSIDAD` recibe los **9 permisos** (total acumulado: **52**).
- `ROLE_DOCENTE` y `ROLE_ESTUDIANTE` no reciben permisos del módulo (los expedientes se acceden con HTTP 403).

---

## 4. API REST

| Método | Endpoint | Permiso | Descripción |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/students` | `ESTUDIANTE_VIEW` | Lista el padrón (con `admissionCount`). |
| GET | `/api/v1/students/active` | `ESTUDIANTE_VIEW` | Lista solo estudiantes activos. |
| GET | `/api/v1/students/{id}` | `ESTUDIANTE_VIEW` | Detalle de un expediente. |
| POST | `/api/v1/students` | `ESTUDIANTE_CREATE` | Registra estudiante (valida código y documento únicos). |
| PUT | `/api/v1/students/{id}` | `ESTUDIANTE_EDIT` | Actualiza expediente. |
| PATCH | `/api/v1/students/{id}/status?active=` | `ESTUDIANTE_EDIT` | Habilita/deshabilita estudiante. |
| DELETE | `/api/v1/students/{id}` | `ESTUDIANTE_DELETE` | Borrado lógico. |
| GET | `/api/v1/student-admissions/student/{studentId}` | `ADMISION_VIEW` | Historial de ingreso del estudiante. |
| POST | `/api/v1/student-admissions/student/{studentId}` | `ADMISION_CREATE` | Registra ingreso (periodo único por estudiante). |
| PUT / DELETE | `/api/v1/student-admissions/{id}` | `ADMISION_EDIT` / `_DELETE` | Actualiza / elimina registro de ingreso. |

Si `currentCycle`, `approvedCredits` o `weightedAverage` no se envían, el servicio aplica valores por defecto (`1`, `0`, `0.00`).

---

## 5. Auditoría

Cada operación de escritura invoca `AuditService.log(...)` con usuario responsable (`SecurityUtils.getCurrentUsername()`), acción (`CREATE`/`UPDATE`/`DELETE`), módulo (`ESTUDIANTE`, `ADMISION`), descripción, endpoint, método HTTP, IP, user-agent, resultado (`SUCCESS`/`FAILURE`), entidad (`tb_estudiantes`, `tb_estudiante_admisiones`) e ID afectado. Los intentos con código/documento duplicado o periodo de ingreso repetido se registran como `FAILURE` antes de lanzar `ApiException` (HTTP 400).

---

## 6. Frontend

`StudentsPage` (`/students`, protegida por `ESTUDIANTE_VIEW` en el sidebar):

- **Búsqueda y filtros** por nombre, código, DNI o correo; filtro por carrera y condición.
- **Vistas** tarjetas y tabla, con promedio ponderado, ciclo, créditos aprobados y nº de ingresos.
- **Acciones por permiso:** registrar, editar, habilitar/deshabilitar y desactivar (según `ESTUDIANTE_*`).
- **Adscripción académica desde el catálogo:** en el formulario, **Facultad** y **Carrera** son listas desplegables alimentadas por `/api/v1/faculties` y `/api/v1/careers`; la carrera se filtra por la facultad elegida y, al seleccionarla, se completa su facultad. Ya no se ingresan nombres a mano.
- **Modal de expediente** con datos personales/académicos y una sección de **Historial de Ingreso** (alta, edición y eliminación de admisiones según `ADMISION_*`).

El cliente Axios (`frontend/src/services/studentService.ts`) expone 10 operaciones y se apoya en el `api.ts` con JWT.

---

## 7. Datos Semilla

6 estudiantes del padrón con sus datos personales y académicos, cada uno con 1 registro de ingreso (modalidades Ordinario y Traslado Externo; periodos 2021-I a 2024-II). El conteo semilla es 6 estudiantes y 6 admisiones.
