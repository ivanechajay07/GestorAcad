# Mejoras Transversales (v1.1)

Pasada de endurecimiento y pulido aplicada sobre la base de las Fases 1–6, previa a la Fase 7 (Estructura Académica). Cubre seis ejes: experiencia de usuario, calidad de código, rendimiento, seguridad, documentación/API y pruebas.

---

## 1. Experiencia de Usuario (UI/UX)

| Mejora | Implementación | Alcance |
| :--- | :--- | :--- |
| Tema claro/oscuro | `frontend/src/contexts/ThemeContext.tsx` (`useTheme`) + `components/ui/ThemeToggle.tsx` | Conmutador en el header; detecta la preferencia del sistema y persiste en `localStorage` (`gestoracad_theme`). Todo el diseño usa tokens CSS (`data-theme`) que se adaptan dinámicamente. |
| Notificaciones toast | `frontend/src/contexts/ToastContext.tsx` (`useToast`) | Reemplazan los `alert()` de `UsersPage`, `KnowledgeAiPage` y `AcademicStructurePage`. |
| Diálogos de confirmación | `frontend/src/contexts/ConfirmContext.tsx` (`useConfirm`) | Reemplazan los `window.confirm` de `UniversityPage`, `TeachersPage` y `StudentsPage`. |
| Captura de errores de render | `frontend/src/components/ErrorBoundary.tsx` | Envuelve la aplicación; evita pantallas en blanco y ofrece volver al panel. |

Los proveedores se registran en `App.tsx` en el orden `ErrorBoundary → ToastProvider → ConfirmProvider → AuthProvider`.

- **Toast:** variantes `success | error | info | warning`, autocierre configurable (4.5 s por defecto) y cierre manual. Región `aria-live` para accesibilidad.
- **Confirm:** API basada en promesa (`const ok = await confirm({...})`), cierre con `Escape` o clic en el fondo, botón de acción en variante `danger` o `primary`.
- **Tema:** el modo se aplica en `<html data-theme="light|dark">`; los tokens se definen en `index.css` para ambos temas y el botón `ThemeToggle` (icono Sol/Luna) alterna con transición y `aria-label` accesible.

---

## 2. Calidad de Código (backend)

- `GlobalExceptionHandler` centralizado ya cubre `ResourceNotFoundException`, validación (`MethodArgumentNotValidException`), `BadCredentialsException`, `AccessDeniedException`, `ApiException`, rutas/métodos no soportados y errores genéricos.
- `RateLimitService` encapsula la política de ventana deslizante (responsabilidad única, testeable de forma aislada).
- Filtros desacoplados de la configuración mediante beans e inyección por constructor.

---

## 3. Rendimiento

- **Carga diferida de rutas** con `React.lazy` + `Suspense` en `routes/AppRouter.tsx`: el bundle inicial baja de ~530 kB a ~334 kB y cada módulo se descarga bajo demanda.
- `RateLimitService` usa `ConcurrentHashMap` + `ArrayDeque` con limpieza de marcas expiradas para evitar crecimiento de memoria.
- Índices y optimización de consultas SQL se abordan formalmente en la Fase 11 (Optimización).

---

## 4. Seguridad

### Cabeceras HTTP (`config/SecurityConfig.java`)
Todas las respuestas incluyen:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Strict-Transport-Security` (HSTS, 1 año, `includeSubDomains`)
- `Content-Security-Policy` restrictiva compatible con Swagger UI

### Límite de intentos de login (`security/LoginRateLimitFilter.java`)
- Ventana deslizante por IP sobre `POST /api/v1/auth/login`.
- Responde **429 Too Many Requests** al superar el umbral; complementa el bloqueo de cuenta por usuario ya existente.
- IP resuelta desde `X-Forwarded-For`, `X-Real-IP` o `remoteAddr`.
- Configurable por entorno:

```env
LOGIN_MAX_ATTEMPTS=10
LOGIN_WINDOW_SECONDS=60
```

- Se deshabilita el doble registro del filtro (contenedor de servlets + cadena de seguridad) mediante `FilterRegistrationBean.setEnabled(false)`.

---

## 5. Documentación y API

- `config/OpenApiConfig.java` actualizado: versión `1.0.0 - Fases 1-6`, descripción de capacidades y **tags por dominio** (Autenticación, Seguridad, Universidad, Docentes, Estudiantes, Salud).
- Documentación interactiva en `http://localhost:8080/swagger-ui.html` y esquema en `/v3/api-docs`.

---

## 6. Pruebas

- `security/RateLimitServiceTest`: 5 pruebas unitarias (límite, bloqueo, aislamiento por clave, expiración de ventana, reset).
- `controller/LoginRateLimitFilterTest`: prueba de integración del 429 y de las cabeceras de seguridad.
- Perfil `test` con umbral de rate limit alto para no interferir con las pruebas funcionales existentes.
- **Total: 57 pruebas, 0 fallos.**

---

## Archivos Afectados

**Frontend**
- `src/contexts/ThemeContext.tsx` (nuevo)
- `src/components/ui/ThemeToggle.tsx` (nuevo)
- `src/contexts/ToastContext.tsx` (nuevo)
- `src/contexts/ConfirmContext.tsx` (nuevo)
- `src/components/ErrorBoundary.tsx` (nuevo)
- `src/App.tsx`, `src/routes/AppRouter.tsx`
- `src/pages/{UsersPage,UniversityPage,TeachersPage,StudentsPage,KnowledgeAiPage,AcademicStructurePage}.tsx`

**Backend**
- `src/main/java/com/gestoracad/security/RateLimitService.java` (nuevo)
- `src/main/java/com/gestoracad/security/LoginRateLimitFilter.java` (nuevo)
- `src/main/java/com/gestoracad/config/SecurityConfig.java`
- `src/main/java/com/gestoracad/config/OpenApiConfig.java`
- `src/main/resources/application.yml`
- `src/test/java/com/gestoracad/security/RateLimitServiceTest.java` (nuevo)
- `src/test/java/com/gestoracad/controller/LoginRateLimitFilterTest.java` (nuevo)
- `src/test/resources/application-test.yml`

---

## 7. Módulos, alcance y responsive (v1.2)

### Auditoría de módulos vs. prompt
| Módulo | Decisión |
| :--- | :--- |
| Asistente IA & Normativas (`/knowledge`) | **Retirado** — la IA es opcional y de última fase; el prompt prohíbe implementarla al inicio. |
| Plano Arquitectónico (`/architecture`) | **Retirado** — documentación técnica estática, no es un módulo académico. |
| Diagnóstico & Salud (`/status`) | **Retirado** — monitoreo TI, fuera del alcance académico. |
| Estructura Académica (`/academic`) | **Reemplazado** por vista “Próximamente” (Fase 7); se eliminó el CRUD con datos simulados. |

Módulos vigentes: Panel Institucional, Universidad, Docentes, Estudiantes, Usuarios, Roles, Auditoría y Perfil.

### Responsive (móvil / tablet / escritorio)
- **Shell**: `useMediaQuery` + `MainLayout` gestionan el sidebar como panel deslizable (`app-sidebar--mobile`) con backdrop en pantallas ≤ 900 px; colapsable en escritorio.
- **Header**: buscador oculto en tablet (`hide-tablet`), selector de rol y datos de usuario ocultos en móvil (`hide-mobile`).
- **Tablas**: scroll horizontal automático en ≤ 900 px.
- **Rejillas**: sustitución de columnas fijas por `repeat(auto-fit, minmax(min(Npx, 100%), 1fr))` en formularios y tarjetas.
- **Modales**: clase `modal-card` limita el ancho al 100 % y la altura al 88 vh en móvil.

### Archivos nuevos/afectados (v1.2)
- `frontend/src/hooks/useMediaQuery.ts` (nuevo)
- `frontend/src/pages/ComingSoonPage.tsx` (nuevo)
- `frontend/src/layouts/MainLayout.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/components/Header.tsx`, `frontend/src/routes/AppRouter.tsx`, `frontend/src/index.css`
- Páginas eliminadas: `KnowledgeAiPage.tsx`, `ArchitecturePage.tsx`, `StatusPage.tsx`, `AcademicStructurePage.tsx`

---

## 8. Diseño unificado de módulos (v1.3)

### Componentes de diseño reutilizables
- **`PageHeader`** (`components/ui/PageHeader.tsx`): encabezado único para todos los módulos con icono de acento, insignias, título, subtítulo, acciones y breadcrumbs. Sustituye los banners heterogéneos (gradientes oscuros en módulos académicos y cabeceras planas en administración) por un diseño consistente y adaptado al tema.
- **`Breadcrumbs`** (`components/ui/Breadcrumbs.tsx`): ruta de navegación accesible (`aria-label`) con enlace a Inicio.
- **`Pagination`** (`components/ui/Pagination.tsx`): paginación reutilizable con rango visible, ventana de páginas y navegación anterior/siguiente.

### Aplicación por módulo
| Módulo | Encabezado | Paginación |
| :--- | :--- | :--- |
| Universidad | `PageHeader` (acento primario) | — |
| Docentes | `PageHeader` (acento violeta) | Sí (vista de tabla, 8/página) |
| Estudiantes | `PageHeader` (acento esmeralda) | Sí (vista de tabla, 8/página) |
| Usuarios | `PageHeader` | Sí (8/página) |
| Roles | `PageHeader` | — |
| Auditoría | `PageHeader` | Sí (10/página) |
| Perfil | `PageHeader` (acento cian) | — |

- **`EmptyState`** (`components/ui/EmptyState.tsx`): estado vacío unificado (icono, título, descripción y acción) aplicado a la bitácora de Auditoría y a la actividad reciente del Panel.

### Mensajería y confirmaciones (v1.4)
- **Toasts unificados**: los módulos Universidad, Docentes y Estudiantes migraron sus banners de éxito/error a `useToast`; Roles y Auditoría reportan fallos de carga con toast en lugar de `console.error`.
- **Confirmación al deshabilitar usuarios**: `UsersPage` solicita confirmación (vía `useConfirm`) antes de deshabilitar una cuenta.
- **Confirmación al deshabilitar docentes y estudiantes**: `TeachersPage` y `StudentsPage` piden confirmación antes de deshabilitar (las acciones de borrado ya confirmaban).

### Dashboard analítico y responsive (v1.5)
- **`LineChart`** (`components/ui/LineChart.tsx`): gráfico de líneas SVG interactivo (tooltip al pasar el cursor, guía vertical, leyenda, escalado responsive mediante `viewBox`), con colores por token de tema.
- **Sección "Estadísticas y tendencias"** en el Panel: "Actividad de Auditoría" (eventos por día, últimos 7 días, datos reales de `tb_auditoria`), "Matrícula por Ciclo" (distribución de estudiantes por ciclo), "Docentes por Categoría" (Principal/Asociado/Auxiliar/Contratado) y "Docentes por Facultad".
- **Distribuciones lineales dinámicas**: `DistributionChart` convierte las tres tarjetas categóricas en una serie lineal por defecto, con selector **Línea/Barras**, tooltip con la etiqueta completa, navegación por teclado (flechas, Home, End, Escape), tabla equivalente para lectores de pantalla y animación de trazo respetuosa de `prefers-reduced-motion`.
- **Campana de notificaciones funcional**: `NotificationBell` consume `GET /api/v1/notifications` (avisos agregados y filtrados por permisos, sin PII), muestra el contador real de no leídos, permite marcar avisos o todos como leídos (estado por usuario en `localStorage`), actualiza cada 5 minutos y ofrece cierre por clic fuera/Escape, foco gestionado y navegación con flechas.
- **Retirada la tarjeta "Actividad Reciente"** (lista de eventos) en favor de la gráfica interactiva.
- **Correcciones responsive**: `Card` con padding fluido (`clamp`), `min-width: 0` en las rejillas (`dash-cols`, `dash-col`, `dash-charts`) y nueva rejilla `.dash-charts` que colapsa en pantallas pequeñas.
- **"Población por Facultades" dinámica**: selector segmentado de métrica (Matrícula / Docentes / Carreras), ordenamiento de mayor a menor, totales y filas con hover.
- **"Calendario Académico" como línea de tiempo**: barra de progreso del semestre (Semana 8/16 → 50%) y hitos expandibles que muestran su descripción al hacer clic.
- **Auditoría**: gráfico de tendencia `LineChart` (eventos por día, últimos 7 días) y filtro segmentado por acción con conteos (`CREATE (n)`, `UPDATE (n)`, …).
- **Roles**: tarjetas de resumen (roles definidos, permisos atómicos, módulos cubiertos), filtro segmentado del catálogo de permisos por módulo y paginación (10/página).
- **Login rediseñado**: layout de dos paneles (panel de marca con lista de capacidades + formulario), orbes de fondo animados, conmutador de tema, campo de contraseña con **mostrar/ocultar**, botón de **acceso rápido** que rellena usuario y contraseña con las cuentas semilla, y colapso a una columna en móvil (≤860px).

### Rediseño de módulos con design system (v1.6)
- **Componentes reutilizables**: `Toolbar` (barra de búsqueda + filtros + acciones), `ViewToggle` (Tarjetas/Tabla con iconos) y `StatTile` (tarjeta de indicador con icono de acento).
- **Estilos de sistema** en `index.css`: `.toolbar`, `.search-box`, `.field-select`, `.data-table` (encabezado sticky, filas con hover, celdas `cell-strong`/`cell-mono`), `.entity-card`, `.icon-tile`, `.row-actions` y `.link-action`.
- **Aplicado en**:
  - **Estudiantes** y **Docentes**: toolbar unificada + tabla de datos (`data-table`) + toggle de vista.
  - **Roles**: resumen con `StatTile`, filtro por módulo y catálogo de permisos como `data-table`.
  - **Auditoría**: tabla de eventos como `data-table` (encabezado sticky) junto a la tendencia y el filtro segmentado.
- **Diseño ordenado y consistente**: mismas jerarquías, espaciados, radios y colores por token en todos los módulos, con soporte de tema claro/oscuro y responsive.

### Animaciones y micro-interacciones globales (v1.7)
- **Tarjetas**: `.glass-panel` con tinte superior sutil; `.glass-panel-interactive` con elevación y barrido de brillo (`shine`) al pasar el cursor.
- **Botones** (`.btn`): brillo superior, elevación en hover y efecto *press* en clic.
- **Pestañas** (`.tab`): transiciones de color/fondo, escala en clic y estado activo con sombra de acento (aplicado en Universidad).
- **Tablas** (`.data-table`): entrada escalonada de filas (`rowIn`) y acento lateral (`inset box-shadow`) en la primera celda al hover.
- **Badges** (`.badge`): animación *pop-in*.
- **Títulos**: utilidad `.gradient-title` aplicada al `PageHeader`.
- **Rejillas**: entrada escalonada (`fadeInUp`) en KPI, accesos rápidos, gráficos y tarjetas de entidades (`.stagger`).
- **Accesibilidad**: respeta `prefers-reduced-motion` (desactiva animaciones).

### Rediseño impactante de encabezados (v1.8)
- **`PageHeader` como hero con degradado**: fondo `linear-gradient` derivado del color de acento del módulo, resplandores radiales, icono en vidrio (`.page-hero-icon`), título grande en blanco y breadcrumbs en variante clara (`Breadcrumbs light`).
- **Franja de estadísticas**: prop `stats` que renderiza KPIs translúcidos (`.page-hero-stats`) — p. ej. Estudiantes (total/activos/carreras/promedio), Docentes (total/activos/facultades/horas), Universidad (sedes/autoridades/parámetros/estado), Usuarios (total/activos/inactivos), Roles (roles/permisos/módulos), Auditoría (eventos/éxitos/fallos).
- **Acciones del hero** como botones de vidrio para contraste óptimo sobre el degradado; badges del hero en blanco translúcido.
- Aplicado a **todos los módulos** con su color de acento, en tema claro y oscuro.

### Módulo Roles funcional + refinamiento (v1.9)
- **Diagnóstico**: el módulo Roles era **solo lectura** (no tenía acciones CRUD) y el endpoint de permisos respondía de forma intermitente; se verificó y se corrigió la funcionalidad.
- **Backend (CRUD de roles)**:
  - `POST /api/v1/roles` (`ROL_CREATE`), `PUT /api/v1/roles/{id}` (`ROL_EDIT`), `DELETE /api/v1/roles/{id}` (`ROL_DELETE`).
  - `RoleRequestDto` con validación; `RoleServiceImpl` con normalización de nombre (`ROLE_<NOMBRE>`), verificación de unicidad, resolución de permisos por ID, **auditoría** (`CREATE/UPDATE/DELETE` con `SUCCESS/FAILURE`) y protección del rol base `ROLE_UNIVERSIDAD`.
  - Pruebas: `RoleModuleControllerTest` (8 pruebas) → suite total **65 pruebas**.
- **Frontend (RolesPage)**: botón **Nuevo Rol**, acciones **Editar/Eliminar** por rol, **modal** con descripción y **selección de permisos agrupada por módulo** (con “Seleccionar/Quitar todos”), confirmación de borrado y toasts.
- **Refinamiento UI**: tipografía de tablas (encabezado/celdas), botones y acciones `.link-action` más definidos, checkboxes con `accent-color` y `text-wrap: balance` en títulos.

### CRUD de Permisos, Header y tarjetas modernas (v2.2)
- **Permisos (CRUD)**: `POST/PUT/DELETE /api/v1/roles/permissions` (autoridades `ROL_CREATE/EDIT/DELETE`) con validación, unicidad, auditoría y desasociación de roles al eliminar. En `RolesPage`: botón **Nuevo Permiso**, acciones por fila (Editar/Eliminar), modal de permiso y **filtro por módulo movido a una barra propia** (corrige el título aplastado).
- **Header profesional**: acciones agrupadas con separadores, selector de rol tipo pastilla, campana con badge y **menú de usuario** (avatar con iniciales, nombre/departamento, enlaces a perfil y cerrar sesión).
- **Tarjetas de entidad modernas** (`entity-card-v2`): avatar con degradado, nombre + código, insignias de categoría/estado, info con iconos, **franja de métricas** (`.entity-stats`) y **botones de acción** (`.ghost-btn`) en Docentes y Estudiantes.
- **Acciones de tabla con botones** (`.action-btn` con iconos y variantes de color) en Estudiantes, Docentes, Usuarios y Roles; tablas con cebra sutil y código sin salto.
- **Usuarios** en tarjetas (título “Usuarios”) y retiro del banner informativo; **retiro del pie del sidebar**.

### Login profesional + animación de acceso (v2.3)
- **Rediseño**: layout de dos paneles (marca + formulario) con campos modernos y mostrar/ocultar contraseña.
- **Contexto académico**: el panel de marca describe la gestión académica (facultades, carreras, claustro, padrón estudiantil) en lugar de detalles técnicos.
- **“¿Olvidaste tu contraseña?”**: enlace que abre un modal de recuperación (correo institucional) con aviso al administrador.
- **Sin acceso rápido ni etiquetas técnicas**: se retiró el bloque de cuentas semilla, el badge “JWT” y la nota de seguridad inferior.
- **Animación de inicio de sesión**: overlay a pantalla completa con anillo giratorio (`spinRing`) mientras autentica y **check de éxito** (`checkPop`) antes de redirigir al panel.

### Login: fondo dinámico y tema (v2.4)
- **Fondo dinámico académico**: gradiente animado (`.login-bg`, `bgShift`), rejilla sutil enmascarada (`.login-grid-overlay`) e **iconos académicos flotantes** (graduación, libro, capas, premio, calendario, usuarios) con animación `floatY`.
- **Botón de tema claro/oscuro**: botón **circular solo con icono** (Sol/Luna) en la esquina superior, con tooltip accesible.

### Login rediseñado estilo centrado (v2.6)
- **Layout centrado de una sola tarjeta**: logo con pulso, título con degradado y subtítulo, sobre fondo dinámico académico.
- **Selector de perfil** (Gestión / Docente / Alumno) que ajusta la pista del usuario.
- **Campos** con etiquetas en mayúsculas, pista `@usuario` y **“¿Olvidaste tu contraseña?”**; “Mantener sesión activa” + chip **Seguro**.
- **Tarjeta con borde de gradiente animado** y entrada con escala (`cardIn`); botón con brillo en movimiento.
- **Pie institucional**: Privacidad · versión · © institución.
- Se conservan el fondo dinámico, el overlay de inicio de sesión (spinner + check) y el modal de recuperación.

### Login con panel lateral dinámico (v2.7)
- **Layout de dos columnas** (panel lateral + tarjeta) en escritorio; en móvil se apila mostrando solo logo/título y la tarjeta.
- **Panel lateral dinámico**: estadísticas con **contador animado** (Facultades, Carreras, Docentes, Estudiantes), **chips de módulos** con entrada escalonada y **reloj/fecha en vivo** con indicador pulsante (`livePulse`).
- La tarjeta mantiene el selector de perfil, campos, “Mantener sesión activa”, chip Seguro y botón; el pie muestra **© 2026 UTP · Universidad Tecnológica del Perú**.

### Login: más contenido dinámico en el panel (v2.8)
- **Progreso del período académico** (2026-I, Semana 8/16) con barra animada (`growX`).
- **Feed de actividad reciente rotativo**: eventos con icono por tono (éxito/info/aviso), usuario, acción y tiempo; rota cada 3 s.
- **Estado del sistema**: chips “Sistema operativo” (pulsante) y “Matrícula abierta”.
- Estos bloques se ocultan en móvil junto con las estadísticas y chips.

### Login: ilustración dinámica lateral (v2.9)
- Se retiraron el período, el feed de actividad, el estado del sistema y los chips de módulos.
- Se añadió una **ilustración SVG animada** (`StudyIllustration`): escritorio con monitor (barras que crecen y cursor parpadeante), persona con leve balanceo, planta que se mece y burbujas flotantes; adaptada al tema con sombra suave.
- Se conservan las estadísticas con contador animado y el reloj en vivo.

### Login: ilustración tipo portal + móvil solo login (v3.0)
- **Nueva ilustración** (`StudyIllustration`): una ventana de **portal académico** con cabecera, barra lateral, tiles de indicadores, **gráfico de barras animado** (`illBar`), **línea que se dibuja** (`illDraw`) y punto pulsante; más tarjetas flotantes (stat, avatar, notificación, check) y leve flotación de la ventana (`illWindow`).
- **Móvil**: se muestra el **logo + “GESTOR ACADÉMICO VIRTUAL”** (encabezado compacto centrado) y **solo el login**; se ocultan la ilustración, las estadísticas y el reloj.

### Gestión de usuarios: edición, avatar y sidebar (v3.2)
- **Editar usuario** (`PUT /api/v1/users/{id}`, autoridad `USUARIO_EDIT`): actualiza nombres, correo, teléfono, departamento, rol, **avatar** y **contraseña opcional** (al cambiarla se desbloquea la cuenta y se reinician los intentos fallidos). Auditoría `UPDATE`.
- **Avatar/imagen**: nuevo campo `avatar` (TEXT) en `tb_usuarios`; en el frontend se **sube una imagen**, se redimensiona a 200px y se guarda como **data URL**. La tarjeta muestra la imagen (o las iniciales).
- **UsersPage**: botón **Editar** por tarjeta y **modal de edición** con subida/quita de imagen y campo “Nueva contraseña (opcional)”.
- **Sidebar profesional**: secciones con título, **indicador lateral** y gradiente en el ítem activo, hover con desplazamiento y badges adaptados al estado activo; además se retiró el selector de “Rol” del header.

### Módulo Universidad + navegación y avatar (v3.4)
- **Módulo Universidad rediseñado**: pestañas con **iconos**, **Sedes** y **Autoridades** como **tarjetas de entidad** (`entity-card-v2`) con avatar, info con iconos, franja de métricas y botones (`ghost-btn`), y **Parámetros** como `data-table` con acciones (`action-btn`); rejillas con entrada escalonada (`stagger`).
- **Avatar en la app**: `PUT /api/v1/auth/profile` para que el usuario actualice sus datos y **foto**; el **header/menú** y el **Perfil** muestran la imagen (o iniciales) y permiten cambiarla.
- **Marca del header dinámica**: el subtítulo del header toma el **nombre de la universidad** del Módulo Universidad (`/api/v1/university/active`).
- **Sidebar interactivo**: **buscador** de menú y **secciones colapsables** (con chevron animado) además del indicador activo.
- **Perfil responsive**: contenedor fluido, grids con `min()` y fila de avatar que envuelve en móvil.

### Bitácora de auditoría legible (v3.5)
- **Tabla ordenada en cinco columnas**: **Acción** (etiqueta en español + módulo), **Usuario** (+ resultado Éxito/Falló), **Dispositivo / IP** (navegador y sistema desde el `User-Agent`, IP con etiqueta de red interna/local), **Detalle** (descripción comprensible) y **Fecha y hora** (fecha exacta, hora con segundos y tiempo relativo).
- **Hora actual visible**: reloj en el encabezado con la hora de `America/Lima`, actualizado cada segundo; las marcas de la base (UTC) se convierten a esa zona para evitar desfases.
- **Búsqueda y filtros**: búsqueda por usuario, IP, dispositivo, módulo o detalle; filtros por acción (con conteos) y por resultado; paginación que se reinicia al filtrar y estado vacío con opción de limpiar filtros.
- **IP y dispositivo reales**: `ResolutorIpCliente` + `FiltroIpClienteReal` sustituyen la IP del proxy por la del cliente solo cuando el par directo es loopback o red privada (evita falsificación desde Internet); `DtoRegistroAuditoria` publica la fecha como instante UTC y el mapper la convierte desde la zona del servidor.
- **Accesibilidad**: `caption` para lectores de pantalla, encabezados `th scope="col"`, contraste de estado con texto (no solo color), etiquetas `aria-label` en búsqueda y filtros, y tooltips con el `User-Agent`/IP completos.

### Panel dinámico de actividad de auditoría (v3.6)
- **Resumen agregado real**: `GET /api/v1/audit/summary?dias=7|14|30` (autoridad `AUDITORIA_VIEW`, ventana acotada a 1–90 días) devuelve totales, éxitos, fallos, promedio diario, día pico, variación frente al periodo anterior, serie por día y distribución por acción. La agregación se hace en el DAO y se agrupa por el día institucional de `America/Lima`.
- **Panel con KPIs y comparación**: cuatro indicadores (eventos, tasa de éxito, promedio diario y día más activo) y una insignia de variación que distingue aumento, descenso y ausencia de periodo previo comparable.
- **Gráfico de barras interactivo**: cada día es un botón enfocable que muestra su valor al pasar el cursor o con `Tab`; el selector 7/14/30 días recarga el resumen sin refrescar la página y el panel atenúa los datos mientras carga.
- **Distribución por acción**: barras proporcionales con color por tipo de acción y porcentaje sobre el total; los estados vacíos explican que no hubo eventos.
- **Accesibilidad**: `role="group"` y `aria-pressed` en el selector, `aria-label` por barra, región `aria-live` con el detalle del día activo y tabla `sr-only` equivalente.
- **Detalle limpio**: se retiró la línea técnica `tb_usuarios #1 · POST /api/v1/auth/login` del Detalle para que la tabla muestre solo información comprensible.

### Módulo de roles interactivo en español (v3.7)
- **Interfaz completamente en español**: roles, módulos, permisos, botones, mensajes y estados. Los códigos técnicos (`ROLE_*`, `MODULO_ACCION`) quedan como referencia secundaria; `utils/roleFormatters.ts` centraliza las traducciones, la normalización de búsqueda sin tildes, los plurales, las iniciales y los gradientes.
- **Dos pestañas y buscador**: **Roles** con tarjetas interactivas, búsqueda por nombre/código/descripción y ordenamiento (nombre, más permisos, más usuarios); **Permisos** con búsqueda, filtro por módulo, uso por rol y paginación de 10 en 10.
- **Tarjeta de rol**: `RoleCard` resume nombre legible, código técnico, descripción, permisos, módulos cubiertos y **usuarios asignados**, con acciones **Ver detalle / Editar / Duplicar / Eliminar**.
- **Detalle lateral accesible**: `RoleDetailPanel` agrupa permisos por módulo, traduce cada permiso y su descripción, y se cierra con botón, fondo o `Escape` (`role="dialog"`, `aria-modal`, `aria-labelledby`).
- **Formulario guiado**: el modal de rol permite escribir el nombre natural y muestra el código que se guardará; `PermissionPicker` busca permisos, pliega módulos, selecciona un módulo completo, limpia la selección y anuncia el avance con `aria-live`.
- **Duplicado seguro**: **Duplicar** precarga una copia (`_COPIA`) con los mismos permisos y avisa que hay que ajustar el nombre antes de guardar.
- **Backend enriquecido**: `DtoRol.usuarios` se calcula con la proyección agregada `RepositorioUsuario.countUsuariosPorRol()` (una sola consulta) y `countByRoleId()` para el detalle; `ServicioRolImpl` bloquea la eliminación de roles con usuarios asignados y registra el intento como `FAILURE`.
- **Accesibilidad y responsive**: pestañas con `role="tab"`/`aria-selected`, búsquedas etiquetadas, `caption` y `th scope="col"` en la tabla de permisos, estados vacíos con acción de recuperación, botones deshabilitados con explicación y rejillas que pasan a una columna en móvil.

### Normalización completa de la base de datos (v3.8)
- **Catálogo como única fuente de verdad**: se eliminaron `tb_estudiantes.facultad/carrera` y `tb_docentes.facultad`; las entidades JPA usan `@ManyToOne` a `Facultad`/`Carrera` y el backend resuelve los nombres que envía la API con `ServicioCatalogoAcademico`.
- **Sin datos de ingreso duplicados**: `periodo_ingreso`, `modalidad_ingreso` y `colegio_procedencia` se leen de la admisión más antigua y se sincronizan al crear/editar el estudiante.
- **Sin columnas derivadas**: `horas_totales` se calcula como `horas_teoricas + horas_practicas` en entidades, repositorios, vistas y función `fn_carga_horaria_docente`.
- **Último acceso único**: se retiró `ultimo_login`; `ultima_conexion` (`lastSeen`) es el valor que consume la interfaz.
- **Migración idempotente**: `database/08_normalizacion_duplicaciones.sql`, con respaldo previo en `backups/gestoracad_pre_normalizacion_20261028.sql` y verificación de los 11 controles de `vw_integridad_datos`.

### Catálogo académico editable en Universidad (v3.9)
- **Pestañas nuevas**: **Facultades** muestra tarjetas con descripción, estado y contadores de carreras/estudiantes/docentes; **Carreras** muestra una tabla con facultad de adscripción, estudiantes y filtro por facultad. Ambas se cargan solo si el usuario tiene `FACULTAD_VIEW` o `CARRERA_VIEW`.
- **CRUD completo y auditado**: `ControladorFacultad` (`/api/v1/faculties`) y `ControladorCarrera` (`/api/v1/careers`) exponen listado, detalle, alta, edición y borrado lógico, protegidos por `FACULTAD_*` y `CARRERA_*`. Cada operación registra `CREATE`/`UPDATE`/`DELETE` en `tb_auditoria`, incluidos los intentos rechazados como `FAILURE`.
- **Reglas de integridad**: una facultad no se desactiva con carreras, estudiantes o docentes activos; una carrera no se desactiva con estudiantes activos. Los mensajes de error explican la dependencia que bloquea la baja.
- **Reasignación coherente**: si una carrera cambia de facultad, `RepositorioEstudiante.syncFacultyByCareerId` actualiza `facultad_id` de sus estudiantes en la misma transacción, de modo que la jerarquía carrera → facultad no se desincroniza.
- **Contadores sin datos derivados**: `careerCount`, `studentCount` y `teacherCount` se calculan con consultas agregadas (`countBy...ActiveTrue`) al construir los DTOs; no se almacenan columnas redundantes.
- **Permisos idempotentes**: `database/09_catalogo_academico_permisos.sql` crea los 8 permisos y los asigna a `ROLE_UNIVERSIDAD` y a los roles con `SEDE_VIEW`; la carga de autoridades ocurre en cada petición, sin exigir re-login.
- **Pruebas**: 8 casos nuevos en `ControladorCatalogoAcademicoTest` (401/403, alta y duplicados, contadores, reasignación de estudiantes y bloqueos de baja) y 4 en `universityService.test.ts`; total 178 backend / 90 frontend. El formulario de estudiantes usa selects del catálogo con 4 pruebas adicionales en `studentCatalog.test.ts` y el login con 5 en `loginErrors.test.ts`.

### Portal docente operativo 8.3 (v6.2)
- **Edición acotada**: el docente registra notas y asistencia solo en secciones cuya `docente_id` coincide con su ficha.
- **Cierre de acta**: el docente cierra el acta de su sección; el backend valida pesos, matrícula y propiedad.
- **Seguridad**: `ownedSection`/`ownedEvaluation`; una sección ajena responde **403**.
- **Frontend**: `/my-sections/{id}` con pestañas Notas, Asistencia y Acta.

### Portales de estudiante y docente 8.2 (v6.1)
- **Vínculo cuenta ↔ ficha**: `usuario_id` en docentes y estudiantes, resuelto por correo institucional.
- **Portal del estudiante** `/my-progress`: cursos, notas, asistencia, acta, promedio y créditos, usando la identidad autenticada.
- **Portal del docente** `/my-sections`: secciones asignadas, estudiantes, evaluaciones y estado de acta.
- **Seguridad**: endpoints `hasRole('ESTUDIANTE')`/`hasRole('DOCENTE')` y rutas con `allowedRoles`; no se expone un ID manipulable.
- **Migración**: `database/14_portales_estudiante_docente.sql`.

### Evaluación Académica 8.1 (v6.0)
- **Nuevo módulo `/evaluation`**: selector de sección y pestañas **Evaluaciones, Notas, Asistencia y Acta**.
- **Evaluaciones**: nombre, tipo, peso, fecha y nota máxima; pesos acumulados no pueden exceder 100.
- **Notas**: planilla por evaluación con estudiantes matriculados, validación 0–nota máxima y guardado en lote.
- **Asistencia**: registro por fecha con estados `PRESENTE`, `AUSENTE`, `TARDANZA` y `JUSTIFICADO`.
- **Acta**: cierre con pesos exactos de 100, promedio ponderado, aprobación según `NOTA_MINIMA_APROBATORIA` y suma de créditos aprobados. Tras cerrar, evaluaciones/notas/asistencia quedan bloqueadas.
- **Migración**: `database/13_evaluacion_academica.sql`; permisos `EVALUACION_*`, `NOTA_*`, `ASISTENCIA_*` y `ACTA_*`.
- **Pruebas**: 5 casos backend y 4 de contrato frontend.

### Estructura Académica 7.3 (v5.2)
- **Prerrequisitos**: cada curso puede declarar cursos que deben aprobarse antes; se rechazan auto-prerrequisitos, duplicados y dependencias circulares directas.
- **Horarios estructurados**: bloques por día, hora inicio/fin y aula; el sistema rechaza choques de la misma sección, del docente o del aula en el mismo periodo.
- **Resumen automático**: `tb_secciones.horario` se sincroniza como texto legible a partir de los bloques (`LUN 08:00-10:00 · MIÉ 08:00-10:00`).
- **Migración**: `database/12_estructura_academica_73.sql`; permisos existentes `CURSO_EDIT`/`SECCION_EDIT`.
- **Pruebas**: 7 casos backend nuevos (prerrequisitos y horarios).

### Estructura Académica 7.2 (v5.1)
- **Planes de estudio**: CRUD por carrera, año y código único; malla curricular con cursos, ciclo y obligatoriedad; créditos totales calculados.
- **Secciones**: oferta por periodo, curso y docente, con código, capacidad, turno, aula y horario; no se desactivan con matrículas activas ni se reduce la capacidad por debajo de los matriculados.
- **Matrículas**: registro con control de cupo, duplicidad de curso, máximo de créditos y ventana de matrícula; estados `MATRICULADO`/`RETIRADO` con reactivación y anulación.
- **Permisos**: `PLAN_*`, `SECCION_*` y `MATRICULA_*`; rutas protegidas y acciones condicionadas.
- **Diseño del módulo**: barra de pestañas propia (`academic-tabs`) separada del hero, cinco pestañas ordenadas, tablas con columnas críticas sin saltos y refresco por pestaña.
- **Migración**: `database/11_estructura_academica_72.sql`; 2 planes, 5 cursos de malla y 2 secciones de ejemplo.
- **Pruebas**: 15 casos backend nuevos y 4 de contrato frontend; total **178 backend / 90 frontend**.

### Estructura Académica 7.1 (v5.0)
- **Nuevo módulo `/academic`**: pestañas de **Periodos académicos** y **Cursos**, con CRUD, búsqueda visual, badges de estado y modales accesibles.
- **Periodos**: código único, nombre, fechas de clases y matrícula, activación de un único periodo vigente, protección del periodo vigente ante baja y sincronización automática del parámetro `PERIODO_ACADEMICO_ACTUAL` que consume el Dashboard.
- **Cursos**: código único, créditos (1-30), horas teóricas/prácticas (0-40), tipo (`GENERAL`, `ESPECIFICO`, `ELECTIVO`), horas totales derivadas y borrado lógico.
- **Seguridad**: permisos `PERIODO_VIEW/CREATE/EDIT/DELETE` y `CURSO_VIEW/CREATE/EDIT/DELETE`, `@PreAuthorize` en todos los endpoints, auditoría de éxitos y rechazos, y guardias de permiso en las rutas del frontend.
- **Migración**: `database/10_estructura_academica.sql` idempotente con tablas, permisos y semilla de 2 periodos y 4 cursos.
- **Pruebas**: 17 casos nuevos en backend (servicios de periodo/curso y controlador de integración) y 5 en `academicService.test.ts`; total **178 backend / 90 frontend**.
- **Correcciones de auditoría**: guardias de permiso por ruta, facultad de docentes desde catálogo y validación/protección de parámetros globales.

### Auditoría y rediseño del login (v4.0)
- **Sin métricas ficticias**: se retiraron los contadores animados de facultades, carreras, docentes y estudiantes, que no coincidían con los datos reales. El panel de marca ahora describe **capacidades verificables**: acceso por roles, trazabilidad en la bitácora, datos centralizados y sesión protegida.
- **Jerarquía visual profesional**: hero con logo, distintivo de plataforma, título con degradado, cuatro tarjetas de capacidad y barra de estado con **fecha y hora reales**. La tarjeta de acceso usa acento superior, sombra suave y entrada animada; el fondo conserva orbes y símbolos académicos con movimiento.
- **Formulario accesible**: etiquetas reales asociadas (`label for`), `name` y `autoComplete` para gestores de contraseñas, `aria-invalid`/`aria-describedby` en error, `aria-pressed` en mostrar/ocultar, aviso de **Bloq Mayús** y foco visible.
- **Mensajes de error claros**: `utils/loginErrors.ts` traduce fallos de red, 401, 423 y 429 a textos comprensibles; los campos se marcan en rojo y el error se anuncia con `role="alert"`.
- **Sesión más segura por defecto**: "Mantener sesión en este equipo" queda **desmarcado** salvo que el usuario ya tuviera una sesión persistente; en ese caso los tokens van a `localStorage` y, si no, a `sessionStorage` (`tokenStorage`). Se añadió la nota de renovación automática y bloqueo por intentos.
- **Modal de recuperación accesible**: `role="dialog"`, `aria-modal`, cierre con `Escape` y clic en el fondo, bloqueo del scroll y foco inicial en el correo; el enlace de privacidad sin destino se sustituyó por una nota institucional real.
- **Documento y tema**: `lang="es"`, título descriptivo y `meta description` en `index.html`; el botón de tema sigue alternando claro/oscuro y todos los estilos respetan `prefers-reduced-motion`.
- **Limpieza técnica**: se consolidaron en un único bloque los estilos `.login-*` de las versiones v2.3–v3.0 y se eliminaron reglas duplicadas y sin uso (estadísticas, chips, feed, período, spinner antiguo), manteniendo las animaciones de la ilustración.
- **Fondo continuo**: se corrigió el corte del fondo animado en ventanas altas. Los orbes decorativos generaban scroll interno porque `overflow-x: hidden` convertía el eje vertical en desplazable; ahora `.login-shell` usa `overflow: clip` (con respaldo `hidden`) y el gradiente cubre siempre toda la pantalla.
- **Pruebas**: 5 casos en `loginErrors.test.ts`; total 178 backend / 90 frontend. Verificación en navegador de las vistas claro/oscuro, móvil, modal, error y flujo real de acceso con redirección al panel.

### Archivos (v1.3)
- Nuevos: `components/ui/PageHeader.tsx`, `components/ui/Breadcrumbs.tsx`, `components/ui/Pagination.tsx`, `components/ui/EmptyState.tsx`.
- Afectados: `pages/{UniversityPage,TeachersPage,StudentsPage,UsersPage,RolesPage,AuditPage,ProfilePage,DashboardPage}.tsx`.
