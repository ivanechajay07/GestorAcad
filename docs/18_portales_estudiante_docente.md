# Portales de Estudiante y Docente — Fases 8.2 y 8.3

**Estado:** portales personales y edición docente acotada implementados.  
**Rutas:** `/my-progress`, `/my-sections`, `/my-sections/:id`.  
**Backend:** `/api/v1/portal/student/summary`, `/api/v1/portal/student/history`, `/api/v1/portal/teacher/**`  
**Migración:** `database/14_portales_estudiante_docente.sql`

---

## 1. Alcance

| Componente | Estado |
| :--- | :---: |
| Vínculo cuenta ↔ ficha de estudiante | ✅ |
| Vínculo cuenta ↔ ficha de docente | ✅ |
| Portal del estudiante: cursos, notas, asistencia, acta | ✅ |
| Portal del docente: secciones, estudiantes, evaluaciones, acta | ✅ |
| Edición de notas/asistencia desde portal docente | ✅ 8.3 |
| Cierre de acta desde portal docente | ✅ 8.3 |
| Reportes y actas PDF | 🕓 Fase 11 |

---

## 2. Vínculo de identidad

Se añadió `usuario_id` (nullable, único) a:

- `tb_docentes`
- `tb_estudiantes`

Los vínculos iniciales se resolvieron por correo institucional:

- `carlos` → docente `DOC-201402`.
- `lucia` → estudiante `2023-010482`.

Los usuarios sin ficha vinculada reciben un mensaje claro, no un error técnico.

---

## 3. Portal del estudiante

`GET /api/v1/portal/student/summary` (`ROLE_ESTUDIANTE`):

- Datos de la ficha: nombres, carrera, facultad, ciclo, créditos aprobados, promedio y condición.
- Cursos con matrícula activa.
- Evaluaciones y notas por curso.
- Resumen de asistencia: presentes, ausentes y tardanzas.
- Estado del acta y promedio/aprobación cuando está cerrada.

### Historial académico (8.4)

- `GET /api/v1/portal/student/history` devuelve todas las matrículas del estudiante autenticado.
- Incluye periodos anteriores, retiros, notas, asistencia y estado de acta.
- `/my-progress` muestra el historial agrupado por periodo.

### Vínculo cuenta-ficha (8.4)

- Estudiante y docente exponen `userId` en su DTO.
- El administrador puede vincular una cuenta activa del rol correspondiente desde el modal de edición.
- Una cuenta solo puede pertenecer a una ficha.
- Enviar `userId = 0` desvincula; omitir el campo conserva el vínculo.

Frontend `/my-progress`:

- Tarjetas de ciclo, créditos, promedio y cursos.
- Tabla de cursos con asistencia, acta y promedio.
- Modal de notas por curso.

---

## 4. Portal del docente

`GET /api/v1/portal/teacher/summary` (`ROLE_DOCENTE`):

- Ficha del docente: código, nombre y facultad.
- Secciones asignadas.
- Estudiantes matriculados por sección.
- Número de evaluaciones y estado del acta.
- Horario resumido.

Frontend `/my-sections`:

- Tarjetas de secciones, estudiantes y actas pendientes.
- Tabla de secciones asignadas.
- Botón **Gestionar** que abre `/my-sections/{id}`.

### Gestión docente (8.3)

`/my-sections/{id}` permite al docente:

- Ver estudiantes matriculados.
- Seleccionar una evaluación y registrar/corregir notas.
- Registrar asistencia por fecha.
- Cerrar el acta de su sección.
- Una vez cerrada, las notas y la asistencia quedan bloqueadas.

Endpoints:

| Método | Ruta |
| :--- | :--- |
| GET | `/api/v1/portal/teacher/sections/{id}` |
| GET | `/api/v1/portal/teacher/sections/{id}/evaluations` |
| GET/PUT | `/api/v1/portal/teacher/evaluations/{id}/grades` |
| GET/PUT | `/api/v1/portal/teacher/sections/{id}/attendance` |
| GET | `/api/v1/portal/teacher/sections/{id}/act` |
| POST | `/api/v1/portal/teacher/sections/{id}/act/close` |

---

## 5. Seguridad

- Los endpoints usan `@PreAuthorize("hasRole('ESTUDIANTE')")` y `hasRole('DOCENTE')`.
- El backend resuelve la ficha desde la cuenta autenticada; no recibe un ID de estudiante/docente manipulable.
- **Cada operación docente valida que la sección pertenezca al docente autenticado** (`ownedSection`/`ownedEvaluation`).
- Un docente recibe **403** al intentar abrir o modificar una sección ajena.
- Las rutas del frontend usan `ProtectedRoute` con `allowedRoles`.
- El sidebar muestra cada portal solo al rol correspondiente.
- No se añadieron permisos globales que expongan datos de terceros.

---

## 6. Pendiente

1. Descarga de actas y reportes.
2. Notificaciones al estudiante cuando se publique una nota o se cierre un acta.
3. Historial académico completo por periodos.
4. Firma digital o constancia institucional del acta.
