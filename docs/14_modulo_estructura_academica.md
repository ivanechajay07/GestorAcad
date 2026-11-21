# Módulo Estructura Académica — Fases 7.1, 7.2 y 7.3

**Estado:** periodos, cursos, planes de estudio, secciones, matrícula, prerrequisitos y horarios estructurados implementados.  
**Ruta:** `/academic`  
**Backend:** `/api/v1/academic-periods`, `/api/v1/courses`, `/api/v1/study-plans`, `/api/v1/sections`, `/api/v1/enrollments`, `/api/v1/courses/{id}/prerequisites`, `/api/v1/sections/{id}/schedules`  
**Migraciones:** `database/10_estructura_academica.sql`, `database/11_estructura_academica_72.sql`, `database/12_estructura_academica_73.sql`

---

## 1. Alcance

| Componente | Estado |
| :--- | :---: |
| Periodos académicos y calendario de matrícula | ✅ 7.1 |
| Catálogo de cursos y carga horaria | ✅ 7.1 |
| Planes de estudio y malla curricular | ✅ 7.2 |
| Secciones por periodo, curso y docente | ✅ 7.2 |
| Matrícula con cupo, créditos y estados | ✅ 7.2 |
| Prerrequisitos entre cursos | ✅ 7.3 |
| Horarios estructurados y detección de choques | ✅ 7.3 |
| Notas, asistencia y actas | ✅ Fase 8.1 (`/evaluation`) |
| Portales docente/estudiante y reportes | 🕓 Fase 8.2 / 11 |

---

## 2. Modelo de datos

### 2.1. Periodos y cursos (7.1)

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_periodos_academicos` | Código, nombre, fechas de clases y matrícula, periodo vigente | Código único; fin ≥ inicio; solo un vigente |
| `tb_cursos` | Código, nombre, créditos, horas teóricas/prácticas y tipo | Código único; créditos 1-30; horas 0-40 y suma > 0 |

### 2.2. Planes y malla (7.2)

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_planes_estudio` | Carrera, código, nombre, año y descripción | Código único; año 2000-2100; FK a carrera |
| `tb_plan_cursos` | Plan, curso, ciclo y obligatoriedad | Único curso por plan; ciclo 1-20 |

Los créditos totales y el número de cursos de un plan se calculan desde la malla; no se almacenan columnas derivadas.

### 2.3. Secciones (7.2)

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_secciones` | Periodo, curso, docente, código, capacidad, turno, aula y horario | Código único por periodo/curso; capacidad 1-200 |

Reglas:
- El periodo y el curso deben estar activos.
- El docente es opcional y debe estar activo.
- No se puede desactivar una sección con matrículas activas.
- La capacidad no puede reducirse por debajo de los matriculados.

### 2.4. Matrículas (7.2)

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_matriculas` | Estudiante, sección, fecha, estado y observación | Única matrícula por estudiante/sección; estado `MATRICULADO`/`RETIRADO` |

Reglas:
- Estudiante y sección activos.
- Control de cupo de la sección.
- Un estudiante no puede matricular dos secciones del mismo curso en el mismo periodo.
- Se respeta `MAX_CREDITOS_POR_PERIODO` (22 por defecto).
- Se respeta la ventana de matrícula del periodo; fuera de ella solo se permite si `PERMITE_MATRICULA_EXTEMPORANEA = true`.
- Retirar una matrícula libera cupo; reactivarla vuelve a validar cupo y créditos.

### 2.5. Prerrequisitos y horarios (7.3)

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_curso_prerrequisitos` | Curso y curso prerrequisito | Único por par; sin auto-prerrequisito ni dependencia circular directa |
| `tb_seccion_horarios` | Sección, día, hora inicio/fin y aula | Fin > inicio; sin choques de sección, docente o aula en el mismo periodo |

Los bloques horarios se reflejan como resumen en `tb_secciones.horario`; el detalle vive en `tb_seccion_horarios`.

---

## 3. Permisos

| Módulo | Permisos |
| :--- | :--- |
| `PERIODO` | `PERIODO_VIEW/CREATE/EDIT/DELETE` |
| `CURSO` | `CURSO_CREATE/EDIT/DELETE` + `CURSO_VIEW` compartido |
| `PLAN` | `PLAN_VIEW/CREATE/EDIT/DELETE` |
| `SECCION` | `SECCION_VIEW/CREATE/EDIT/DELETE` |
| `MATRICULA` | `MATRICULA_VIEW/CREATE/EDIT/DELETE` |

Se añadieron **19 permisos nuevos** en total (7 en 7.1 y 12 en 7.2), para un total de **79**; `CURSO_VIEW` ya existía para `ROLE_DOCENTE`; se conserva su módulo `DOCENTE` y permite a los docentes consultar el catálogo de cursos en modo lectura.

Todo el CRUD está protegido con `@PreAuthorize`; las rutas del frontend exigen al menos un permiso de vista del módulo.

---

## 4. API

### Periodos

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/api/v1/academic-periods` | `PERIODO_VIEW` |
| GET | `/api/v1/academic-periods/{id}` | `PERIODO_VIEW` |
| POST | `/api/v1/academic-periods` | `PERIODO_CREATE` |
| PUT | `/api/v1/academic-periods/{id}` | `PERIODO_EDIT` |
| PATCH | `/api/v1/academic-periods/{id}/activate` | `PERIODO_EDIT` |
| DELETE | `/api/v1/academic-periods/{id}` | `PERIODO_DELETE` |

### Cursos

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/api/v1/courses` | `CURSO_VIEW` |
| GET | `/api/v1/courses/{id}` | `CURSO_VIEW` |
| POST | `/api/v1/courses` | `CURSO_CREATE` |
| PUT | `/api/v1/courses/{id}` | `CURSO_EDIT` |
| DELETE | `/api/v1/courses/{id}` | `CURSO_DELETE` |

### Planes y malla

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/api/v1/study-plans` | `PLAN_VIEW` |
| GET | `/api/v1/study-plans/{id}` | `PLAN_VIEW` |
| GET | `/api/v1/study-plans/{id}/courses` | `PLAN_VIEW` |
| POST | `/api/v1/study-plans` | `PLAN_CREATE` |
| PUT | `/api/v1/study-plans/{id}` | `PLAN_EDIT` |
| DELETE | `/api/v1/study-plans/{id}` | `PLAN_DELETE` |
| POST | `/api/v1/study-plans/{id}/courses` | `PLAN_EDIT` |
| DELETE | `/api/v1/study-plans/{id}/courses/{planCourseId}` | `PLAN_EDIT` |

### Secciones

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/api/v1/sections` | `SECCION_VIEW` |
| GET | `/api/v1/sections/{id}` | `SECCION_VIEW` |
| POST | `/api/v1/sections` | `SECCION_CREATE` |
| PUT | `/api/v1/sections/{id}` | `SECCION_EDIT` |
| DELETE | `/api/v1/sections/{id}` | `SECCION_DELETE` |

### Matrículas

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/api/v1/enrollments` | `MATRICULA_VIEW` |
| GET | `/api/v1/enrollments/{id}` | `MATRICULA_VIEW` |
| POST | `/api/v1/enrollments` | `MATRICULA_CREATE` |
| PATCH | `/api/v1/enrollments/{id}/status?status=MATRICULADO\|RETIRADO` | `MATRICULA_EDIT` |
| DELETE | `/api/v1/enrollments/{id}` | `MATRICULA_DELETE` |

### Prerrequisitos y horarios (7.3)

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/api/v1/courses/{courseId}/prerequisites` | `CURSO_VIEW` |
| POST | `/api/v1/courses/{courseId}/prerequisites` | `CURSO_EDIT` |
| DELETE | `/api/v1/courses/{courseId}/prerequisites/{prerequisiteId}` | `CURSO_EDIT` |
| GET | `/api/v1/sections/{sectionId}/schedules` | `SECCION_VIEW` |
| POST | `/api/v1/sections/{sectionId}/schedules` | `SECCION_EDIT` |
| DELETE | `/api/v1/sections/{sectionId}/schedules/{scheduleId}` | `SECCION_EDIT` |

---

## 5. Frontend

`AcademicPage` (`/academic`) organiza el módulo en una barra de pestañas independiente del hero:

| Pestaña | Contenido |
| :--- | :--- |
| **Periodos** | Calendario, matrícula, activación del periodo vigente |
| **Cursos** | Catálogo, créditos, horas, tipo y **prerrequisitos** |
| **Planes de estudio** | Planes por carrera, créditos calculados y modal de malla curricular |
| **Secciones** | Oferta por periodo/curso/docente, cupo, **bloques horarios** y detección de choques |
| **Matrículas** | Registro, retiro, reactivación y anulación con validaciones |

Características de diseño:
- Barra de pestañas en una superficie propia (`academic-tabs`), con scroll horizontal en móvil.
- Pestañas visibles según permisos; un docente solo ve **Cursos** en modo lectura.
- Tablas con acciones contextuales, badges de estado y modales accesibles.
- Estadísticas del hero adaptadas a los permisos del usuario.

---

## 6. Integración con el Dashboard

`PERIODO_ACADEMICO_ACTUAL` se sincroniza al activar un periodo y alimenta el Panel Institucional y las notificaciones. La matrícula y las secciones no alteran los contadores del Dashboard en esta iteración.

---

## 7. Pendiente

1. Correquisitos y validación de prerrequisitos al matricular usando notas aprobadas.
2. Portales de docente y estudiante (Fase 8.2).
3. Reportes de matrícula, carga docente, ocupación y actas (Fase 11).
4. Matrícula masiva y reglas de reincorporación.

---

## 8. Verificación

- Pruebas de servicio de planes, secciones y matrícula.
- Pruebas de contrato del cliente (`academicService.test.ts`).
- **178 pruebas backend / 90 frontend** en total.
- Migraciones idempotentes aplicadas sobre MySQL con:
  - 2 periodos y 4 cursos;
  - 2 planes y 5 cursos de malla;
  - 2 secciones para 2026-II.
- Integridad de base de datos: 11/11 controles OK.
- Verificación en navegador del administrador y de un usuario con permisos limitados.
