# Módulo Evaluación Académica — Fase 8.1

**Estado:** implementación administrativa completa.  
**Ruta:** `/evaluation`  
**Backend:** `/api/v1/sections/{id}/evaluations`, `/api/v1/evaluations/{id}/grades`, `/api/v1/sections/{id}/attendance`, `/api/v1/sections/{id}/act`  
**Migración:** `database/13_evaluacion_academica.sql`

---

## 1. Alcance

| Componente | Estado |
| :--- | :---: |
| Evaluaciones por sección | ✅ |
| Notas por evaluación y estudiante | ✅ |
| Asistencia por fecha | ✅ |
| Acta, promedios y créditos aprobados | ✅ |
| Portales de docente y estudiante | 🕓 Fase 8.2 |
| Reportes PDF/Excel de actas | 🕓 Fase 11 |

---

## 2. Modelo de datos

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_evaluaciones` | Sección, nombre, tipo, peso, fecha y nota máxima | Peso 0-100; nota máxima 0-20; nombre único por sección |
| `tb_calificaciones` | Evaluación, estudiante y nota | Única por evaluación/estudiante; nota 0-20 |
| `tb_asistencias` | Sección, estudiante, fecha y estado | Única por sección/estudiante/fecha; estados controlados |
| `tb_actas` | Sección, estado, fecha y usuario de cierre | Única por sección; `ABIERTA`/`CERRADA` |
| `tb_actas_detalle` | Estudiante, promedio, aprobado y créditos | Único por acta/estudiante |

---

## 3. Reglas de negocio

- Solo se evalúan estudiantes con matrícula activa en la sección.
- La nota debe estar entre 0 y la nota máxima de la evaluación.
- La suma de pesos de las evaluaciones no puede exceder 100.
- Para cerrar el acta:
  - debe existir al menos una evaluación;
  - la suma de pesos debe ser **exactamente 100**;
  - debe haber estudiantes matriculados.
- El promedio se calcula como suma ponderada de `nota / nota_máxima * 20`.
- Se considera aprobado si el promedio es mayor o igual a `NOTA_MINIMA_APROBATORIA`.
- Al aprobar, se suman los créditos del curso al estudiante.
- Un acta cerrada **bloquea** evaluaciones, notas y asistencia.
- Toda operación queda en auditoría.

---

## 4. Permisos

| Módulo | Permisos |
| :--- | :--- |
| `EVALUACION` | `EVALUACION_VIEW`, `EVALUACION_EDIT` |
| `EVALUACION` | `NOTA_VIEW`, `NOTA_EDIT` |
| `EVALUACION` | `ASISTENCIA_VIEW`, `ASISTENCIA_EDIT` |
| `EVALUACION` | `ACTA_VIEW`, `ACTA_CLOSE` |

Asignados a `ROLE_UNIVERSIDAD`. Total del sistema: **87 permisos**.

---

## 5. API

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/api/v1/sections/{sectionId}/evaluations` | `EVALUACION_VIEW` |
| POST | `/api/v1/sections/{sectionId}/evaluations` | `EVALUACION_EDIT` |
| PUT | `/api/v1/evaluations/{id}` | `EVALUACION_EDIT` |
| DELETE | `/api/v1/evaluations/{id}` | `EVALUACION_EDIT` |
| GET | `/api/v1/evaluations/{id}/grades` | `NOTA_VIEW` |
| PUT | `/api/v1/evaluations/{id}/grades` | `NOTA_EDIT` |
| GET | `/api/v1/sections/{sectionId}/attendance?date=YYYY-MM-DD` | `ASISTENCIA_VIEW` |
| PUT | `/api/v1/sections/{sectionId}/attendance?date=YYYY-MM-DD` | `ASISTENCIA_EDIT` |
| GET | `/api/v1/sections/{sectionId}/act` | `ACTA_VIEW` |
| POST | `/api/v1/sections/{sectionId}/act/close` | `ACTA_CLOSE` |

---

## 6. Frontend

`EvaluationPage` (`/evaluation`):

- Selector de **sección** con periodo, curso, docente y cupo.
- Pestañas **Evaluaciones, Notas, Asistencia y Acta**.
- Evaluaciones: alta/edición/baja con peso, tipo, fecha y nota máxima.
- Notas: planilla por evaluación con edición y guardado.
- Asistencia: fecha, estados y guardado.
- Acta: peso acumulado, cierre, promedio, aprobación y créditos.
- Las acciones se ocultan o deshabilitan si el acta está cerrada o falta permiso.

---

## 7. Verificación

- Pruebas unitarias del servicio: pesos, notas fuera de rango, acta cerrada y cálculo de promedio.
- Prueba real de API: matrícula temporal, evaluaciones 40/60, notas, asistencia, cierre de acta y créditos.
- Cifras de pruebas en `docs/10_cumplimiento_arquitectura.md`.

---

## 8. Pendiente

1. Portal del docente: “mis secciones”, notas y asistencia propias.
2. Portal del estudiante: “mi avance”, notas, asistencia y acta.
3. Actas PDF/Excel y reportes de aprobación.
4. Reapertura controlada de actas con auditoría excepcional.
5. Validación de prerrequisitos al matricular usando notas aprobadas.
