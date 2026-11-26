# Gestor Académico Virtual

Plataforma académica modular y escalable para la gestión universitaria integral, construida por fases con altos estándares de arquitectura, seguridad y buenas prácticas de ingeniería.

---

## Estructura del Repositorio

```
/
├── backend/            # API REST desarrollada en Spring Boot 3.4 / Java 21
│   ├── src/main/java/com/gestoracad/
│   │   ├── audit/      # Auditoría JPA y tracking
│   │   ├── config/     # CORS, OpenAPI, Security, JPA Config
│   │   ├── controller/ # Controladores REST
│   │   ├── dto/        # DTOs de petición y respuesta
│   │   ├── entity/     # Entidades de dominio (BaseEntity auditada)
│   │   ├── exception/  # GlobalExceptionHandler centralizado
│   │   ├── mapper/     # Mappers manuales entidad → DTO
│   │   ├── repository/ # Capa DAO (Spring Data JPA + JPQL)
│   │   ├── security/   # Utilidades JWT y filtros
│   │   └── service/    # Lógica de negocio por capas
│   └── pom.xml
├── frontend/           # Aplicación Web SPA en React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── assets/     # Recursos estáticos
│   │   ├── components/ # Componentes reutilizables UI (Button, Card, Badge, Header, Sidebar, ErrorBoundary, ThemeToggle)
│   │   ├── contexts/   # AuthContext, ThemeContext (claro/oscuro), ToastContext y ConfirmContext
│   │   ├── hooks/      # useAuth, useHealth
│   │   ├── layouts/    # MainLayout responsivo
│   │   ├── pages/      # Dashboard, módulos académicos, administración y seguridad
│   │   ├── routes/     # AppRouter (carga diferida) y ProtectedRoute
│   │   ├── services/   # Cliente Axios con interceptores JWT
│   │   └── utils/      # Utilidades y formateadores
│   └── package.json
├── database/           # Scripts de base de datos MySQL 8+ normalizada (3FN)
│   ├── init.sql        # Inicialización de BD y tabla de verificación tb_schema_version
│   ├── 02_security_users_roles_audit.sql  # Seguridad, roles, permisos y auditoría
│   ├── 03_auth_permissions.sql            # Migración Fase 3: permisos MODULO_ACCION y bloqueo
│   ├── 04_university_module.sql           # Migración Fase 4: universidad, sedes, autoridades, parámetros
│   ├── 05_teacher_module.sql              # Migración Fase 5: docentes, especialidades, asignaciones lectivas
│   ├── 06_student_module.sql              # Migración Fase 6: estudiantes, historial de ingreso
│   ├── 07_db_functions_normalization.sql  # Auditoría Fase 7: catálogos, funciones, vistas e índices
│   ├── 08_normalizacion_duplicaciones.sql # Fase 8: elimina columnas duplicadas/derivadas
│   ├── 09_catalogo_academico_permisos.sql # Fase 9: permisos del CRUD de facultades y carreras
│   ├── 10_estructura_academica.sql        # Fase 7.1: periodos académicos, cursos y permisos
│   ├── 11_estructura_academica_72.sql     # Fase 7.2: planes, secciones y matrícula
│   ├── 12_estructura_academica_73.sql     # Fase 7.3: prerrequisitos y horarios
│   ├── 13_evaluacion_academica.sql        # Fase 8.1: evaluaciones, notas, asistencia y actas
│   ├── 14_portales_estudiante_docente.sql # Fase 8.2: vínculo de cuentas y portales
│   └── README.md       # Convenciones DBA y diseño relacional
├── docker/             # Dockerfiles y configuración de servidores
│   ├── Dockerfile.backend   # Imagen Alpine JRE 21 con usuario sin privilegios
│   ├── Dockerfile.frontend  # Imagen Alpine Nginx con soporte SPA y proxy reverso
│   └── nginx.conf           # Configuración Nginx para frontend
├── docker-compose.yml  # Orquestación de MySQL, phpMyAdmin, Backend y Frontend
├── .env.example        # Plantilla de variables de entorno
└── .env                # Variables de entorno locales
```

> La documentación técnica (`docs/`) no se incluye en este repositorio.

---

## Inicio Rápido con Docker Compose

```powershell
docker compose up -d
```

- **Frontend:** [http://localhost:3010](http://localhost:3010)
- **Backend API:** [http://localhost:8094](http://localhost:8094)
- **Swagger Docs:** [http://localhost:8094/swagger-ui.html](http://localhost:8094/swagger-ui.html)
- **phpMyAdmin:** [http://localhost:8095](http://localhost:8095)
- **MySQL:** `localhost:3310`

> Los puertos son configurables en `.env` (`FRONTEND_PORT`, `BACKEND_PORT`, `PHPMYADMIN_PORT`, `MYSQL_PORT`) y están elegidos para no colisionar con otros contenedores del equipo.
>
> **Importante:** el frontend de este proyecto es **http://localhost:3010**. Otros puertos como `5173` pueden pertenecer a proyectos distintos que estén corriendo en el mismo equipo. No abras `frontend/index.html` directamente con `file://`: el SPA necesita servirse por HTTP.

### Desarrollo local del frontend (sin reconstruir Docker)

```powershell
cd frontend
npm install
npm run dev
```

Vite sirve la aplicación en `http://localhost:5173` (o el siguiente puerto libre) y redirige `/api` al backend en `http://localhost:8094`. Si usas otro backend, define `VITE_BACKEND_URL` en `frontend/.env`.

---

## Estado Actual: FASE 6 + DASHBOARD + FASE 7.1 (ESTRUCTURA ACADÉMICA)

Módulo Estudiante con gestión del padrón estudiantil (expediente y datos personales), estado académico (ciclo, créditos aprobados, promedio ponderado, condición y matrícula) e historial de ingreso/admisión. CRUD completo (alta, edición y borrado lógico), autorización por permisos `ESTUDIANTE/ADMISION` en backend y frontend, y auditoría de cada operación.

El **Panel Institucional** consume el endpoint agregado `GET /api/v1/dashboard/summary` con datos reales, permisos por bloque y sin PII. La **base de datos** fue auditada, normalizada por completo y completada con catálogos de facultades/carreras, 8 funciones, 8 procedimientos, 2 triggers, 8 vistas, 59 índices sin redundancias y 21 restricciones CHECK. El **Módulo Universidad** incorpora pestañas de **Facultades** y **Carreras** con CRUD completo sobre el catálogo académico (Fase 9).

La **Fase 7 (Estructura Académica)** está completa y la **Fase 8 (Evaluación y portales)** está operativa: `/evaluation`, `/my-progress` y `/my-sections`. El docente puede registrar notas/asistencia y cerrar actas solo en sus secciones. Quedan los reportes de actas y el historial completo por periodos.

### Auditoría y normalización de Base de Datos (Fases 7 y 8 técnicas)

- **Normalización:** catálogos `tb_facultades`/`tb_carreras` con FK obligatorias desde estudiantes y docentes; se eliminó la dependencia transitiva carrera → facultad. En la Fase 8 se retiraron las columnas de texto `facultad`/`carrera`: el backend resuelve los nombres contra el catálogo.
- **Datos de ingreso:** `periodo_ingreso`, `modalidad_ingreso` y `colegio_procedencia` ya no se duplican en el padrón; se leen de la admisión más antigua y se sincronizan al crear/editar.
- **Objetos programables:** 8 funciones, 8 procedimientos, 2 triggers (inmutabilidad de auditoría) y 8 vistas de consulta.
- **Integridad:** 14 claves foráneas, 21 CHECK, `horas_totales` calculado como `horas_teoricas + horas_practicas` y bitácora inmutable ante `UPDATE`/`DELETE`.
- **Calidad:** `vw_integridad_datos` con 11 controles, todos en `OK`; índice de redundancias `sys` en 0.
- **Evidencia y operación:** `database/07_db_functions_normalization.sql`, `database/08_normalizacion_duplicaciones.sql` y `database/09_catalogo_academico_permisos.sql` (idempotentes).

### Cuentas Semilla de Prueba

| Usuario | Contraseña | Rol |
| :--- | :--- | :--- |
| `admin` | `gestor123` | `ROLE_UNIVERSIDAD` (90 permisos) |
| `carlos` | `docente123` | `ROLE_DOCENTE` (6 permisos) |
| `lucia` | `alumno123` | `ROLE_ESTUDIANTE` (2 permisos) |

> Estas cuentas son de demostración. En producción deben cambiarse por credenciales
> que cumplan la política de contraseñas (8+ caracteres, mayúscula, minúscula, número y símbolo).

Consulte la carpeta `/docs` para ver el detalle de arquitectura, directrices funcionales y hoja de ruta.

### Migraciones, respaldos y CI

- **Flyway:** las migraciones viven en `backend/src/main/resources/db/migration`.
  `V1__baseline.sql` representa el esquema actual. Las bases existentes se marcan
  como versión 1 y las bases nuevas se crean desde cero. Los cambios futuros se
  agregan como `V2__descripcion.sql`, `V3__...`, etc.
- **Requisito MySQL:** con binlog activo, la creación de triggers/funciones requiere
  `log-bin-trust-function-creators=1` (ya configurado en `docker-compose.yml`). En
  producción debe aplicarlo el DBA o ejecutar la migración con un usuario privilegiado.
- **Respaldo:** `.\scripts\backup-db.ps1` genera un `.sql.gz` en `backups/` con
  retención de 14 días.
- **Restauración:** `.\scripts\restore-db.ps1 -File backups\gestoracad_AAAAMMDD_HHmmss.sql.gz`
  pide confirmación; usar `-Force` para automatización.
- **CI:** `.github/workflows/ci.yml` ejecuta `mvn verify` en backend y
  `npm ci`, lint, pruebas y build en frontend para cada push o pull request.
- **Sistema de diseño:** tokens, componentes, responsive y accesibilidad en
  `frontend/src/index.css`.

---

## Mejoras Transversales (v1.1)

Pasada de endurecimiento y pulido previa a la Fase 7, aplicada en todo el proyecto:

### Experiencia de usuario (frontend)
- **Tema claro/oscuro conmutable** (`ThemeContext` + `ThemeToggle`) con detección de preferencia del sistema y persistencia en `localStorage`; todo el sistema de diseño usa tokens CSS que se adaptan dinámicamente.
- **Notificaciones tipo toast** (`ToastContext`) con variantes éxito/error/info/advertencia y autocierre; reemplazan a los `alert()` nativos.
- **Diálogos de confirmación** (`ConfirmContext`, `useConfirm`) con promesa, teclado (Escape) y cierre por clic en el fondo; reemplazan a `window.confirm`.
- **ErrorBoundary global** que captura errores de render y ofrece volver al panel, evitando pantallas en blanco.
- **Carga diferida de rutas** (`React.lazy` + `Suspense`) que reduce el bundle inicial (~530 kB → ~334 kB).

### Seguridad (backend)
- **Cabeceras HTTP** en todas las respuestas: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security` y `Content-Security-Policy`.
- **Límite de intentos de login** por IP (ventana deslizante, HTTP 429) además del bloqueo de cuenta existente. Configurable con `LOGIN_MAX_ATTEMPTS` y `LOGIN_WINDOW_SECONDS`.
- Deshabilitado el doble registro de filtros (contenedor servlet + cadena de seguridad).

### Documentación y API
- **OpenAPI/Swagger** enriquecido con versión, descripción y tags por dominio en [http://localhost:8094/swagger-ui.html](http://localhost:8094/swagger-ui.html).
- Detalle técnico en el código del backend y en la configuración de seguridad.

### Pruebas y calidad (v3.7)
- **178 pruebas backend** (JUnit 5, Mockito, MockMvc, `@DataJpaTest` y ArchUnit) y **90 pruebas frontend** (Vitest + jsdom).
- **JaCoCo** con umbral obligatorio del 55 % de líneas: `mvn verify` falla si la cobertura baja. Cobertura actual: **61,0 %**. Reporte en `backend/target/site/jacoco/index.html`.
- **ArchUnit** verifica en cada build la dirección de dependencias entre controlador, servicio, DAO y entidades.

### Seguridad reforzada (v3.5)
- **Refresh token con rotación y revocación**: `POST /api/v1/auth/refresh` emite un nuevo par de tokens e invalida el anterior (`jti`). El logout revoca el token de refresco.
- **Separación de tokens**: el filtro JWT solo acepta tokens con `tipo=access`; un refresh token no sirve como token de acceso.
- **Política de contraseñas**: mínimo 8 caracteres con mayúscula, minúscula, número y símbolo, y bloqueo de claves comunes (`@ContrasenaSegura`).
- **Actuator endurecido**: `/actuator/health` ya no expone `db`, `ssl` ni `diskSpace` sin autenticación.
- **Secretos fuera del repositorio**: `.env` está en `.gitignore`; `.env.example` usa placeholders `CAMBIAR_*`.
- **Perfil `prod`**: `ddl-auto: validate`, Swagger deshabilitado, CORS sin comodines y validación de secretos al arrancar (`ValidacionConfiguracionProductiva`).
- **Sesión en el navegador**: `sessionStorage` por defecto; `localStorage` solo si se marca "Mantener sesión activa".

### Módulos y responsive (v1.2)
- **Módulos retirados** del menú y las rutas por no corresponder a la etapa actual del prompt: `Asistente IA & Normativas` (la IA es opcional y de última fase), `Plano Arquitectónico` y `Diagnóstico & Salud` (herramientas TI, no módulos académicos).
- **Estructura Académica** reemplazada por una vista **“Próximamente”** (se habilita en la Fase 7); se eliminó el CRUD con datos simulados.
- **Diseño responsive** (móvil / tablet / escritorio): sidebar deslizable con fondo oscurecido en móvil, header adaptativo, tablas con scroll horizontal, rejillas `auto-fit` y modales que se ajustan al ancho de pantalla.
- **Encabezado de página unificado** (`PageHeader` + `Breadcrumbs`) en todos los módulos, con icono acento, insignias y acciones.
- **Paginación reutilizable** (`Pagination`) en Usuarios, Auditoría, Docentes y Estudiantes (vistas de tabla).
- **Estado vacío unificado** (`EmptyState`) en Auditoría y actividad del Panel.
- **Mensajería unificada con toasts**: Universidad, Docentes, Estudiantes, Roles y Auditoría usan notificaciones toast en lugar de banners/`console`; se añadió confirmación al deshabilitar usuarios.
- **Dashboard con estadísticas lineales interactivas**: `LineChart` (SVG con tooltip al pasar el cursor, navegación por teclado y tabla equivalente) para **Actividad de Auditoría**, **Matrícula por Ciclo**, **Docentes por Categoría** y **Docentes por Facultad**, con selector **Línea/Barras** por tarjeta y vista lineal por defecto; se retiró la tarjeta "Actividad Reciente". Cards con padding fluido y rejillas responsive corregidas.
- **Notificaciones reales en el encabezado**: la campana consume `GET /api/v1/notifications`, muestra el número de avisos sin leer, permite marcarlos como leídos, actualizar el listado y navegar con teclado; los avisos son agregados, se filtran por permisos y no contienen PII.
- **Bitácora de auditoría legible**: tabla con las columnas **Acción, Usuario, Dispositivo / IP, Detalle y Fecha y hora**, reloj con la hora actual de Lima, búsqueda por usuario/IP/dispositivo/detalle y filtros por acción y resultado. Las fechas se publican en UTC y se convierten a `America/Lima`; el backend resuelve la IP real detrás de Nginx (`X-Forwarded-For`/`X-Real-IP`) y registra el `User-Agent` para identificar el dispositivo.
- **Panel dinámico de actividad**: `GET /api/v1/audit/summary?dias=7|14|30` agrega totales, tasa de éxito, promedio diario, día pico, variación frente al periodo anterior, serie por día y distribución por acción. El panel permite cambiar el periodo sin recargar, explora las barras con teclado y ofrece una tabla equivalente para lectores de pantalla.
- **Módulo de roles interactivo en español (v3.7)**: **Roles y permisos** en dos pestañas con búsqueda y ordenamiento de roles, tarjetas con **usuarios asignados**, permisos y módulos, panel lateral de detalle accesible (cierre con `Escape`), duplicado de roles y selector de permisos por módulo con búsqueda y selección masiva. El backend calcula `usuarios` por rol con una consulta agregada y **bloquea la eliminación** de roles con usuarios asignados. Toda la interfaz usa etiquetas en español y deja el código técnico (`ROLE_*`, `MODULO_ACCION`) como referencia secundaria.
- **Cards dinámicas en el Panel**: "Población por Facultades" con selector de métrica (Matrícula/Docentes/Carreras), ordenamiento y totales; "Calendario Académico" con barra de progreso del semestre y línea de tiempo expandible.
- **Patrón dinámico extendido**: **Auditoría** con gráfico de tendencia (eventos por día) y filtro segmentado con conteos por acción; **Roles** con tarjetas de resumen (roles/permisos/módulos), filtro segmentado por módulo y paginación del catálogo de permisos.
- **Evaluación Académica (Fase 8.1)**: módulo `/evaluation` con evaluaciones por sección, planilla de notas, asistencia por fecha, cierre de acta, promedio ponderado y créditos aprobados. Bloquea notas/asistencia tras el cierre y audita cada operación.
- **Portales académicos (Fase 8.2)**: `/my-progress` para estudiantes (cursos, notas, asistencia y acta) y `/my-sections` para docentes (secciones, estudiantes, evaluaciones y estado de acta), acotados por la cuenta autenticada.
- **Estructura Académica (Fase 7 completa)**: módulo `/academic` con periodos, cursos, planes, malla curricular, secciones, matrícula, prerrequisitos y horarios estructurados con detección de choques por docente/aula. Incluye calendario, activación del periodo vigente, cupos y créditos máximos, con CRUD auditado y permisos por módulo.
- **Login rediseñado y auditado (v4.0)**: layout de dos paneles con hero de capacidades reales (sin métricas ficticias), fecha y hora en vivo, formulario con etiquetas accesibles, aviso de Bloq Mayús, mensajes de error claros, modal de recuperación accesible, tema claro/oscuro y sesión no persistente por defecto.
- **Rediseño de módulos (UI/UX profesional)**: lenguaje visual unificado en **Estudiantes, Docentes, Roles y Auditoría** con componentes reutilizables `Toolbar`, `ViewToggle` y `StatTile`, y estilos de sistema `.toolbar`, `.data-table` (cabecera fija, filas con hover) y `.entity-card`.
- **Capa de animaciones y transiciones (v1.7)**: micro-interacciones globales en tarjetas (elevación + brillo al pasar el cursor), botones (gloss, elevación y press), pestañas (`.tab`), tablas (filas con entrada escalonada y acento lateral al hover), badges (pop-in) y títulos con degradado, con soporte de `prefers-reduced-motion`.
- **Rediseño impactante de encabezados (v1.8)**: todos los módulos usan un **hero con degradado** de acento, icono en vidrio, título grande y una **franja de estadísticas** (KPIs) — aplicado a Universidad, Docentes, Estudiantes, Usuarios, Roles y Auditoría.
- **Módulo Roles funcional (CRUD) (v1.9)**: el backend incorpora `POST/PUT/DELETE /api/v1/roles` con validación, unicidad y auditoría; el frontend permite **crear, editar (asignando permisos por módulo) y eliminar** roles, con permisos `ROL_CREATE/EDIT/DELETE`. Se protegieron los roles base (no eliminables).
- **Refinamiento de tipografía, botones y tablas (v1.9)**: tablas `data-table` con mejor jerarquía tipográfica, botones y acciones (`link-action`) más definidos y checkboxes con color de acento.
- **Permisos funcionales (CRUD) (v2.2)**: endpoints `POST/PUT/DELETE /api/v1/roles/permissions` con auditoría; en Roles se pueden **crear/editar/eliminar permisos** (el catálogo se movió a una barra propia con filtro por módulo y acciones por fila).
- **Header profesional + tarjetas de entidad modernas (v2.2)**: header con acciones agrupadas, selector de rol y **menú de usuario** desplegable (perfil/logout); tarjetas de Docentes/Estudiantes con avatar, info con iconos, **franja de métricas** y **botones de acción**; Usuarios en tarjetas; acciones de tabla como **botones con iconos** (`.action-btn`).
- **Login profesional (v2.3)**: layout de dos paneles, **“¿Olvidaste tu contraseña?”** con modal de recuperación, sin acceso rápido y **animación de inicio de sesión** (overlay con spinner y check de éxito antes de redirigir).
- **Gestión de usuarios (v3.2)**: **editar usuario** (datos, rol y **cambio de contraseña**), **avatar/imagen** (subida con recorte a 200px y guardado como data URL) y **sidebar profesional** (secciones, indicador activo y gradiente).
- **Módulo Universidad + navegación (v3.4)**: **tabs con iconos**, sedes y autoridades como **tarjetas de entidad** (`entity-card-v2`) con métricas y botones, parámetros como **data-table** con acciones; **avatar** en header/menú/perfil (subida propia vía `PUT /api/v1/auth/profile`), nombre de universidad **desde el Módulo Universidad** en el header y **sidebar interactivo** (búsqueda + secciones colapsables).
- **Catálogo académico en Universidad (v3.9)**: nuevas pestañas **Facultades** (tarjetas con carreras, estudiantes y docentes) y **Carreras** (tabla con filtro por facultad y contador de estudiantes), con modales de alta/edición, borrado lógico protegido por reglas de dependencia y acciones condicionadas por los permisos `FACULTAD_*` y `CARRERA_*`. La reasignación de una carrera propaga la facultad a sus estudiantes.