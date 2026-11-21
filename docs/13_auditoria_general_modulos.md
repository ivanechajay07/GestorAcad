# Auditoría general por módulos — Gestor Académico Virtual

**Fecha:** 05/11/2026  
**Alcance:** frontend React 19 + Vite, backend Spring Boot 3.4, MySQL 8, Docker Compose y documentación.  
**Método:** revisión de rutas, controladores, permisos, servicios, repositorios, esquema SQL y pruebas; verificación en vivo con Docker y navegador headless.

---

## 1. Diagnóstico de acceso al frontend

### Situación verificada

| Servicio | URL | Estado |
| :--- | :--- | :--- |
| Frontend GESTORACAD | `http://localhost:3010` | HTTP 200, assets 200 |
| Backend GESTORACAD | `http://localhost:8094` | HTTP 200, health OK |
| MySQL | `localhost:3310` | Contenedor healthy |
| phpMyAdmin | `http://localhost:8095` | Activo |

El frontend abre correctamente: `/login` renderiza el formulario, carga el bundle y la hoja de estilos, y una sesión headless no registra errores de consola ni recursos faltantes. El flujo de login con `admin` redirige a `/dashboard`.

### Causa de la confusión

El puerto **5173 no pertenece a GESTORACAD**: está ocupado por otro proyecto del equipo, **HelpDesk PRO** (`helpdesk_frontend`). Al abrir `http://localhost:5173` se ve otra aplicación y su API responde a los intentos de login con un error distinto:

```json
{"username":"El usuario o email es requerido"}
```

Por eso parece que “el frontend no abre” o que el login no funciona. La URL correcta de este proyecto es:

```text
http://localhost:3010/login
```

### Corrección aplicada al entorno de desarrollo

`frontend/vite.config.ts` enviaba el proxy `/api` a `http://localhost:8080`, pero el backend de Docker se publica en **8094**. Se corrigió:

- El proxy ahora apunta por defecto a `http://localhost:8094`.
- Se puede cambiar con `VITE_BACKEND_URL` en `frontend/.env`.
- `npm run dev` debe ejecutarse **dentro de `frontend/`**, no en la raíz.

> Si el puerto 5173 está ocupado, Vite usará el siguiente libre (5174). No debe confundirse con el puerto 3010, que es el contenedor de producción local.

---

## 2. Inventario de módulos

| # | Módulo | Backend | Frontend | Permisos | Estado |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | Autenticación y sesión | `ControladorAutenticacion`, `ServicioAutenticacionImpl`, filtros JWT y rate limit | `LoginPage`, `AuthContext`, `tokenStorage`, `api` | Público / `isAuthenticated` | Completo |
| 2 | Usuarios | `ControladorUsuario`, `ServicioUsuarioImpl` | `UsersPage` | `USUARIO_VIEW/CREATE/EDIT` | Completo con observaciones |
| 3 | Roles y permisos | `ControladorRol`, `ServicioRolImpl` | `RolesPage` | `ROL_VIEW/CREATE/EDIT/DELETE` | Completo con observaciones |
| 4 | Universidad | `ControladorUniversidad`, `ControladorSede`, `ControladorAutoridad`, `ControladorParametroSistema` | `UniversityPage` | `UNIVERSIDAD_*`, `SEDE_*`, `AUTORIDAD_*`, `PARAMETRO_*` | Completo con observaciones |
| 5 | Facultades y carreras | `ControladorFacultad`, `ControladorCarrera`, `ServicioCatalogoAcademico` | `UniversityPage` (pestañas) | `FACULTAD_*`, `CARRERA_*` | Completo |
| 6 | Docentes | `ControladorDocente`, `ControladorEspecialidadDocente`, `ControladorAsignacionDocente` | `TeachersPage` | `DOCENTE_*`, `ESPECIALIDAD_*`, `ASIGNACION_*` | Completo con observaciones |
| 7 | Estudiantes | `ControladorEstudiante`, `ControladorAdmisionEstudiante` | `StudentsPage` | `ESTUDIANTE_*`, `ADMISION_*` | Completo |
| 8 | Panel institucional | `ControladorDashboard`, `ServicioResumenDashboardImpl` | `DashboardPage` | `isAuthenticated` + filtrado interno | Completo |
| 9 | Notificaciones | `ControladorNotificaciones`, `ServicioNotificacionesImpl` | `NotificationBell`, `useNotifications` | `isAuthenticated` + filtrado interno | Completo con observaciones |
| 10 | Auditoría | `ControladorAuditoria`, `ServicioAuditoria` | `AuditPage` | `AUDITORIA_VIEW` | Completo con observaciones |
| 11 | Perfil propio | `ControladorAutenticacion` (`/me`, `/profile`, `/change-password`) | `ProfilePage` | `isAuthenticated` | Completo |
| 12 | Estructura académica | `ControladorPeriodoAcademico`, `ControladorCurso` | `AcademicPage` (`/academic`) | `PERIODO_*`, `CURSO_*` | **7.1 implementado** (periodos y cursos) |
| 13 | Salud del sistema | `ControladorSalud` | — | Público | Completo con observaciones |
| 14 | Base de datos | 15 tablas, 8 vistas, 8 funciones, 8 procedimientos, triggers | — | — | Completo, integridad 11/11 |

---

## 3. Análisis por módulo

### 3.1 Autenticación y sesión

- JWT de acceso + refresh con **rotación y revocación**; `logout` revoca el refresh; `jti` se conserva en `RegistroTokensRevocados`.
- Bloqueo de cuenta tras 5 intentos (15 min) y **límite por IP** con HTTP 429.
- Contraseñas con BCrypt y política `@ContrasenaSegura`.
- El frontend renueva el token con *single-flight* y reintenta una vez; si falla limpia la sesión.
- Auditoría de login exitoso, fallido, bloqueo, refresh y logout.

**Observaciones:** el token de acceso vive en `localStorage`/`sessionStorage` (vulnerable a XSS); la expiración de acceso es de 24 h; el *heartbeat* escribe `ultima_conexion` cada 30 s por usuario; no existe recuperación automática de contraseña (el modal solo registra la solicitud para el administrador).

### 3.2 Usuarios

- CRUD de datos, roles, avatar y restablecimiento de contraseña; activación/desactivación con `PATCH /users/{id}/status`.
- Validación de username/email únicos y auditoría de cada cambio.
- `USUARIO_EDIT` es el único permiso de escritura; no hay borrado físico.

**Observaciones:** `USUARIO_EDIT` puede asignar `ROLE_UNIVERSIDAD` a cualquier cuenta (escalada de privilegios si se delega el permiso); no se impide deshabilitar la propia cuenta ni al último administrador; el avatar no tiene límite de tamaño en el DTO.

### 3.3 Roles y permisos

- CRUD de roles y permisos; el rol base `ROLE_UNIVERSIDAD` no se puede eliminar; un rol con usuarios asignados tampoco.
- Cálculo de usuarios por rol con consulta agregada; permisos agrupados por módulo en la UI.
- `ROL_EDIT` puede modificar los permisos del rol base, incluida la pérdida de acceso.

**Observaciones:** falta una salvaguarda para no dejar el sistema sin un rol administrador completo; la UI ya advierte y protege el borrado, pero no la edición destructiva del rol base.

### 3.4 Universidad

- Institución matriz, sedes/campus y gobierno universitario con CRUD, *soft delete* y permisos por acción.
- Parametrización global con `tb_parametros` (`clave`, `valor`, `tipo_valor`, `modulo`), API `/api/v1/parameters` y auditoría.

**Observaciones:**

1. La pestaña **Parametrización Global** se muestra siempre, aunque el usuario no tenga `PARAMETRO_VIEW`; en ese caso la carga se omite y la tabla aparece vacía.
2. Solo `PERIODO_ACADEMICO_ACTUAL` se consume en tiempo de ejecución (Dashboard, notificaciones y `fn_periodo_actual()`).
3. `NOTA_MINIMA_APROBATORIA`, `MAX_CREDITOS_POR_PERIODO`, `PERMITE_MATRICULA_EXTEMPORANEA`, `MONEDA_INSTITUCIONAL` y `ZONA_HORARIA` se almacenan, pero ninguna regla de negocio los lee todavía.
4. `valueType` no se valida: un `NUMBER` puede guardar texto.
5. Las claves obligatorias pueden desactivarse; la vista de integridad lo detecta, pero el Dashboard se quedaría sin periodo.

### 3.5 Facultades y carreras

- Catálogo normalizado como fuente de verdad; estudiantes y docentes referencian `Facultad`/`Carrera` por FK.
- Reglas de baja: no se desactiva una facultad con carreras, estudiantes o docentes activos; una carrera con estudiantes activos tampoco.
- Reasignación de carrera propaga la facultad a los estudiantes en la misma transacción.
- Contadores calculados con consultas agregadas, sin columnas derivadas.

**Estado:** consistente; sin incidencias relevantes.

### 3.6 Docentes

- Padrón, especialidades y asignaciones/carga lectiva; modal con tres consultas (docente, especialidades y asignaciones).
- Filtros por facultad y categoría; vistas tarjetas/tabla; acciones por permiso.

**Observaciones:**

- El formulario de **Facultad sigue siendo texto libre** (`TeachersPage`, campo “Facultad”), a diferencia de Estudiantes, que ya usa un `select` del catálogo.
- `ServicioDocenteImpl` resuelve el nombre con `ServicioCatalogoAcademico.resolveFaculty`, que **crea la facultad si no existe**. Esto permite duplicados por variaciones de escritura y rompe la coherencia del catálogo.
- Paginación y filtros son del lado del cliente: se descarga el padrón completo.

### 3.7 Estudiantes

- Expediente, estado académico e historial de admisión; CRUD con borrado lógico.
- Formulario con **Facultad y Carrera como selects dependientes** del catálogo (`/faculties`, `/careers`), autocompletado de facultad y bloqueo de carreras hasta elegir facultad.
- Validaciones de promedio (0-20), ciclo y puntaje de admisión; integridad verificada.

**Observaciones:** paginación y filtros en cliente; el modal carga el historial de admisiones al abrirse; sin incidencias funcionales detectadas.

### 3.8 Panel institucional

- `GET /dashboard/summary` agrega institución, estudiantes, docentes, usuarios, facultades, carreras y auditoría.
- Cada bloque se calcula **solo si el usuario tiene el permiso correspondiente**; no expone PII.
- Gráficos con tabla equivalente y navegación por teclado.

**Observaciones:** los conteos se recalculan en cada petición (sin caché); la serie de auditoría se limita a 7 días; no hay paginación porque son agregados.

### 3.9 Notificaciones

- Agregados de estudiantes/docentes/usuarios/auditoría filtrados por permisos; sin datos personales.
- Marcado como leído persistido en `localStorage` por usuario (`gestoracad:notificaciones-leidas:{id}`).
- Actualización periódica y al abrir la campana.

**Observaciones:** el estado leído no se sincroniza entre dispositivos ni se guarda en el backend; al cambiar de navegador reaparecen los avisos.

### 3.10 Auditoría

- Últimos **100** eventos (`/audit/recent`) y resumen de 7/14/30 días (`/audit/summary`).
- Tabla con acción, usuario, dispositivo/IP, detalle y fecha en `America/Lima`; filtros y búsqueda en cliente.
- `tb_auditoria` es **inmutable** por triggers `BEFORE UPDATE` y `BEFORE DELETE`.

**Observaciones:** no hay paginación ni exportación de eventos antiguos; los filtros solo operan sobre los últimos 100 registros. Para auditoría forense a largo plazo conviene un endpoint paginado con rango de fechas.

### 3.11 Perfil propio

- Actualización de nombres, teléfono, departamento y avatar; cambio de contraseña con verificación de la actual.
- El avatar se redimensiona a 200 px en el navegador y se guarda como data URL.

**Observaciones:** el backend no impone un tamaño máximo al avatar; conviene validar `@Size` y el tipo MIME.

### 3.12 Estructura académica (`/academic`)

- **7.3 implementado:** prerrequisitos entre cursos y horarios estructurados con detección de choques por sección, docente y aula.
- El periodo vigente se sincroniza con `PERIODO_ACADEMICO_ACTUAL` y alimenta el Dashboard y las notificaciones.
- **Pendiente Fase 8:** notas, asistencia, actas e historial.

**Estado:** módulo operativo en su primer incremento; el resto de la Fase 7 sigue planificado.

### 3.13 Salud del sistema

- `GET /api/v1/health` y `/ping` son públicos (whitelist).
- Expone nombre de la aplicación, estado, versión, perfil activo y detalles de BD, incluida la **versión del motor**.

**Observaciones:** información útil para Docker, pero revela metadatos en producción; el campo `currentPhase` sigue diciendo “FASE 1”, desactualizado. Conviene restringirlo o reducirlo en producción.

### 3.14 Base de datos

- 15 tablas, 8 vistas, 8 funciones, 8 procedimientos, 14 FK, 21 CHECK y 59 índices sin redundancias.
- `vw_integridad_datos`: **11/11 controles OK**.
- Datos actuales: 1 universidad, 3 sedes, 4 facultades, 5 carreras, 3 autoridades, 6 parámetros, 2 periodos, 4 cursos, 2 planes de estudio, 5 cursos de malla, 1 prerrequisito, 2 secciones, 4 bloques horarios, 0 matrículas, 0 evaluaciones, 0 calificaciones, 0 asistencias, 0 actas, 5 docentes, 6 estudiantes, 6 admisiones, 3 usuarios, 3 roles, 87 permisos y 149 eventos de auditoría.
- Sin duplicados en catálogos; bitácora inmutable.

---

## 4. Hallazgos priorizados

| Prioridad | Hallazgo | Evidencia | Impacto | Recomendación |
| :---: | :--- | :--- | :--- | :--- |
| **Alta** | Se abría el puerto 5173 (HelpDesk PRO) en lugar de 3010 | `docker ps`, HTML “HelpDesk PRO”, error 400 con `username` | El usuario cree que el frontend no abre | Usar `http://localhost:3010/login`; documentar puertos |
| **Alta** | Proxy de Vite apuntaba a 8080 | `frontend/vite.config.ts` | `npm run dev` no conecta al backend | Corregido a 8094 con `VITE_BACKEND_URL` |
| **Alta** | Rutas sin guardia de permiso | `AppRouter` solo usa `ProtectedRoute` de autenticación | Un usuario puede abrir `/users`, `/roles`, `/university` por URL; el backend devuelve 403 y la UI muestra errores | **Corregido:** `ProtectedRoute` acepta `requiredPermission`/`requiredAnyPermission` y cada ruta declara su permiso |
| **Alta** | Facultad de docentes es texto libre | `TeachersPage` campo Facultad; `resolveFaculty` crea catálogo | Duplicados y pérdida de integridad | **Corregido:** `select` alimentado por `/faculties`, con fallback del valor actual |
| **Media** | Pestaña de parámetros visible sin permiso | `UniversityPage` línea 558; carga condicionada a `PARAMETRO_VIEW` | Tabla vacía confusionaria | **Corregido:** pestaña oculta sin `PARAMETRO_VIEW`; validación de tipo y claves obligatorias en backend |
| **Media** | Parámetros sin validación ni uso | `ServicioParametroSistemaImpl`, solo `PERIODO_ACADEMICO_ACTUAL` se lee | Configuración que no surte efecto | Validar por `valueType`, conectar reglas o marcarlos “reservados” |
| **Media** | `USUARIO_EDIT` puede asignar `ROLE_UNIVERSIDAD` | `ServicioUsuarioImpl.updateUser` | Escalada de privilegios si se delega el permiso | Restringir asignación del rol base a un permiso superior |
| **Media** | Sin protección del último administrador | `toggleUserStatus` | Bloqueo total del sistema | Impedir deshabilitar el último usuario con rol base |
| **Media** | Sin paginación de servidor | `StudentsPage`, `TeachersPage`, `UsersPage`; `/audit/recent` 100 | Degradación con miles de registros | Paginación y filtros en backend |
| **Media** | CSP no cubre el HTML estático | `docker/nginx.conf` sirve el SPA; la CSP está en Spring | El bundle no queda protegido por CSP | Añadir CSP y HSTS en Nginx |
| **Media** | Secretos por defecto y `.env` local | `application.yml`, `docker-compose.yml`, `.env` | Riesgo si se despliega tal cual | Secretos propios y `.env` fuera de distribución |
| **Baja** | Health público con versión de BD y fase obsoleta | `ServicioSaludImpl` | Divulgación de información | Limitar en producción y actualizar fase |
| **Baja** | Estado de notificaciones solo local | `notificationReadState.ts` | No se sincroniza entre dispositivos | Persistir en backend |
| **Baja** | Avatar sin límite de tamaño | DTOs de perfil/usuario | Consumo excesivo de memoria/BD | Añadir `@Size` y validar MIME |
| **Baja** | Heartbeat escribe cada 30 s | `ServicioAutenticacionImpl.heartbeat` | Escrituras innecesarias | Actualizar cada 2-5 min o en eventos |

---

## 5. Aspectos positivos verificados

- Todos los controladores de negocio tienen `@PreAuthorize`; la whitelist pública se limita a salud, autenticación y Swagger.
- Autorización por permisos `MODULO_ACCION` coherente entre backend y frontend.
- Rotación y revocación de refresh tokens, bloqueo por intentos y rate limit por IP.
- Auditoría inmutable a nivel de base de datos.
- Dashboard y notificaciones respetan permisos y no exponen PII.
- Catálogo académico normalizado y con reglas de integridad.
- Frontend compila y **90 pruebas** pasan; backend con **178 pruebas** y JaCoCo configurado.

---

## 6. Recomendaciones inmediatas

1. Abrir siempre `http://localhost:3010/login` para este proyecto; no usar 5173.
2. Para desarrollo: `cd frontend`, `npm install`, `npm run dev`; el proxy ya apunta a 8094.
3. Añadir guardias de permiso a las rutas y ocultar la pestaña de parámetros sin `PARAMETRO_VIEW`.
4. Convertir la facultad de docentes en `select` del catálogo.
5. Proteger al último administrador y restringir la asignación de `ROLE_UNIVERSIDAD`.
6. Antes de producción: CSP/HSTS en Nginx, secretos propios, Swagger/health restringidos y paginación de servidor.
