# Cierre académico 8.4 — Historial, prerrequisitos, vínculos y seguridad

**Estado:** implementado y verificado.  
**Backend:** 179 pruebas aprobadas.  
**Frontend:** build correcto y 90 pruebas aprobadas.

## 1. Historial académico del estudiante

- Nuevo endpoint `GET /api/v1/portal/student/history`.
- Devuelve todas las matrículas del estudiante autenticado, incluidas:
  - matrículas de periodos anteriores,
  - matrículas retiradas,
  - evaluaciones, asistencia, estado de acta y promedio.
- El portal `/my-progress` incorpora una sección **Historial académico** agrupada por periodo.
- La consulta sigue acotada por la cuenta autenticada; no recibe un ID manipulable.

## 2. Validación de prerrequisitos

- La matrícula valida los prerrequisitos activos del curso antes de registrar o reactivar.
- La aprobación se toma de un **acta cerrada** (`tb_actas_detalle` con `aprobado = true`).
- Si falta un prerrequisito, la API responde `400` con los cursos pendientes.
- Se registra el rechazo en auditoría como `FAILURE`.
- La regla aplica tanto a matrícula nueva como a reactivación.

## 3. Vínculo cuenta ↔ ficha

- Los DTO de estudiante y docente exponen `userId`.
- La ficha solo se vincula con cuentas activas del rol correspondiente:
  - estudiante → `ROLE_ESTUDIANTE`,
  - docente → `ROLE_DOCENTE`.
- Una cuenta no puede vincularse a dos fichas.
- En los modales de edición de estudiante y docente se añadió **Cuenta de acceso**.
- Enviar `userId = 0` desvincula la cuenta; omitir el campo conserva el vínculo existente.
- La vinculación mantiene acotados los portales `/my-progress` y `/my-sections`.

## 4. Protección del administrador

- No se puede deshabilitar la propia cuenta desde el módulo Usuarios.
- No se puede deshabilitar al último administrador activo con `ROLE_UNIVERSIDAD`.
- No se puede retirar `ROLE_UNIVERSIDAD` al último administrador activo.
- Solo una cuenta con `ROLE_UNIVERSIDAD` puede asignar el rol base.
- Los procesos internos (`SISTEMA`) conservan acceso para tareas de inicialización.

## 5. Cabeceras de seguridad

`docker/nginx.conf` ahora envía:

- `Content-Security-Policy` compatible con Google Fonts y los estilos de React.
- `Strict-Transport-Security`.
- Se conservan `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y `X-XSS-Protection`.

## 6. Verificación funcional

- Prerrequisito no aprobado → **400**.
- Matrícula temporal válida → historial del estudiante devuelve el curso.
- Desvinculación y revinculación de cuenta → correctas.
- Intento de vincular una cuenta sin rol estudiantil → **400**.
- Auto-deshabilitación del administrador → **400**.
- CSP y HSTS verificados en `http://localhost:3010`.

## 7. Pendiente

1. Reportes PDF/Excel de actas, matrícula y ocupación.
2. Reapertura controlada de actas.
3. Regla de asistencia mínima.
4. Notificaciones persistentes de notas y actas.
5. Paginación de servidor y exportación de auditoría.
6. Base de conocimiento persistente y RAG/GPT real.
7. Git, CI/CD, Flyway/Liquibase y backups automáticos.
