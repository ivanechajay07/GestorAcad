# Cumplimiento Arquitectónico: MVC, DAO, SOLID, TDD y Seguridad

Documento de evidencia verificable. Cada afirmación se puede reproducir con los
comandos de la sección final.

**Última verificación:** build `mvn -B verify` + `npm test` + `npm run build`.

---

## 1. Resumen ejecutivo

| Criterio | Estado | Evidencia principal | Verificación automática |
| :--- | :---: | :--- | :--- |
| **MVC** | ✅ Cumple | 18 controladores REST delgados → 19 servicios (interfaz + implementación) → 20 repositorios DAO → 16 entidades. 35 DTOs y 15 mappers. Frontend separado en `pages/`, `components/`, `contexts/`, `services/`. | 5 reglas ArchUnit + tests `@SpringBootTest`/`MockMvc` |
| **DAO** | ✅ Cumple | Paquete `repository` declarado formalmente como capa DAO; contratos Spring Data JPA con consultas JPQL encapsuladas; única capa con acceso a datos. | Regla ArchUnit `repositorios_no_dependen_de_negocio_ni_web` + 3 tests `@DataJpaTest` |
| **SOLID** | ✅ Cumple | Inyección por constructor en todo el backend; controladores dependen de interfaces de servicio; responsabilidades separadas (controller/service/repository/mapper/security/audit); MapStruct eliminado por no usarse. | Reglas ArchUnit de inversión de dependencias y dirección de capas |
| **TDD** | ✅ Cumple | **178 pruebas backend** (JUnit 5 + Mockito + MockMvc + DataJpaTest + ArchUnit) y **90 pruebas frontend** (Vitest + jsdom). JaCoCo con umbral mínimo obligatorio. | `mvn -B verify` (falla el build si baja la cobertura) y `npm test` |
| **Seguridad** | ✅ Cumple | JWT de acceso + refresco con rotación/revocación, BCrypt, bloqueo de cuenta, rate limit por IP, RBAC con `@PreAuthorize`, política de contraseñas, CORS por perfil, actuator sin detalles públicos, validación de secretos en producción y auditoría. | Tests de seguridad + verificación en vivo de endpoints |

---

## 2. MVC (Modelo–Vista–Controlador)

### Backend

| Capa | Paquete | Responsabilidad | Nº de clases |
| :--- | :--- | :--- | :---: |
| Controlador | `com.gestoracad.controller` | Recibir HTTP, validar DTO, delegar y responder | 16 |
| Servicio | `com.gestoracad.service` + `service.impl` | Reglas de negocio y transacciones | 16 interfaces + 16 impl |
| DAO | `com.gestoracad.repository` | Acceso a datos | 13 |
| Modelo | `com.gestoracad.entity` | Entidades JPA auditadas | 14 |
| Transferencia | `com.gestoracad.dto` + `mapper` | Contratos de entrada/salida y ensamblado | 31 DTOs + 13 mappers |

Reglas verificadas por `ArquitecturaCapasTest`:

1. Los controladores no dependen de `repository` ni de `entity`.
2. Los controladores no dependen de `service.impl` (solo de la interfaz).
3. Los servicios no dependen de controladores.
4. Los repositorios no dependen de servicios ni controladores.
5. Las entidades no dependen de repositorios, servicios ni controladores.

### Frontend

- `pages/` contiene las vistas; `components/` la UI reutilizable; `services/` las
  llamadas HTTP; `contexts/` el estado global (`AuthContext`, `ThemeContext`, etc.).
- Ninguna página llama a Axios directamente: siempre pasa por `src/services/*`.

---

## 3. DAO (Data Access Object)

Spring Data JPA es una implementación del patrón DAO: la interfaz declara el
contrato (`RepositorioUsuario`) y el framework provee la implementación y las
transacciones. Para dejar constancia explícita:

- `backend/src/main/java/com/gestoracad/repository/package-info.java` documenta el
  paquete como **capa DAO**.
- Las consultas complejas están encapsuladas con `@Query` JPQL
  (`findByUsernameWithRolesAndPermissions`, etc.), no dispersas en servicios.
- El paquete DAO solo importa entidades y tipos de Spring Data; no conoce DTOs,
  servicios ni controladores (regla ArchUnit).
- `RepositorioUsuarioTest` valida las consultas reales contra H2 en modo MySQL:
  carga de `roles` + `permissions` con `LEFT JOIN FETCH`, detección de duplicados y
  los conteos de usuarios por rol (`countUsuariosPorRol` agrupado en una sola
  consulta y `countByRoleId` para el detalle).

---

## 4. SOLID

| Principio | Aplicación concreta |
| :--- | :--- |
| **S** — Responsabilidad única | Controlador (HTTP), servicio (negocio), repositorio (datos), mapper (ensamblado), filtro (seguridad), validador (`ValidadorContrasenaSegura`). |
| **O** — Abierto/cerrado | Interfaces de servicio: se puede cambiar la implementación sin tocar controladores. Validadores extensibles vía `ConstraintValidator`. |
| **L** — Sustitución de Liskov | Los controladores reciben `ServicioX`, nunca `ServicioXImpl`; cualquier implementación que respete el contrato es válida. |
| **I** — Segregación de interfaces | 16 interfaces de servicio pequeñas y orientadas a un dominio, en lugar de una interfaz monolítica. |
| **D** — Inversión de dependencias | Inyección por constructor en todos los componentes; las capas altas dependen de abstracciones. Verificado por ArchUnit. |

Se retiró **MapStruct** del `pom.xml`: estaba declarado pero ningún mapper lo usaba
(todos son clases manuales `@Component`). Mantener una dependencia sin uso es
deuda técnica y una violación del principio de mínima dependencia.

---

## 5. TDD (Test-Driven Development)

### Backend — 178 pruebas, 0 fallos

| Clase de prueba | Tipo | Pruebas |
| :--- | :--- | ---: |
| `ControladorModuloDocenteTest` | Integración MockMvc | 10 |
| `ControladorModuloEstudianteTest` | Integración MockMvc | 10 |
| `ControladorModuloUniversidadTest` | Integración MockMvc | 10 |
| `ControladorAutenticacionTest` | Integración MockMvc | 9 |
| `ControladorCatalogoAcademicoTest` | Integración MockMvc | 8 |
| `ControladorEstructuraAcademicaTest` | Integración MockMvc | 7 |
| `ControladorModuloRolTest` | Integración MockMvc | 8 |
| `ServicioAutenticacionTest` | Unitaria Mockito | 7 |
| `ServicioResumenDashboardTest` | Unitaria Mockito | 5 |
| `ServicioLimiteIntentosTest` | Unitaria | 5 |
| `ArquitecturaCapasTest` | ArchUnit | 5 |
| `ControladorUsuarioTest` | Integración MockMvc | 4 |
| `ControladorAuditoriaTest` | Integración MockMvc | 4 |
| `ServicioAuditoriaTest` | Unitaria Mockito | 4 |
| `ServicioRolTest` | Unitaria Mockito | 6 |
| `ServicioPeriodoAcademicoTest` | Unitaria Mockito | 5 |
| `ServicioCursoTest` | Unitaria Mockito | 5 |
| `ServicioPlanEstudioTest` | Unitaria Mockito | 5 |
| `ServicioSeccionTest` | Unitaria Mockito | 4 |
| `ServicioMatriculaTest` | Unitaria Mockito | 6 |
| `ServicioPrerrequisitoTest` | Unitaria Mockito | 3 |
| `ServicioHorarioSeccionTest` | Unitaria Mockito | 4 |
| `ServicioEvaluacionAcademicaTest` | Unitaria Mockito | 5 |
| `RepositorioDashboardTest` | `@DataJpaTest` | 4 |
| `RepositorioAuditoriaTest` | `@DataJpaTest` (H2) | 3 |
| `ServicioNotificacionesTest` | Unitaria Mockito | 4 |
| `ControladorDashboardTest` | Integración MockMvc | 3 |
| `ControladorSaludTest` | Integración | 3 |
| `RepositorioUsuarioTest` | `@DataJpaTest` (H2) | 5 |
| `ServicioUsuarioTest` | Integración | 3 |
| `FiltroLimiteIntentosLoginTest` | Integración | 2 |
| `ControladorNotificacionesTest` | Integración MockMvc | 2 |
| `MapeadorRegistroAuditoriaTest` | Unitaria | 2 |
| `ResolutorIpClienteTest` | Unitaria | 5 |
| `FiltroIpClienteRealTest` | Unitaria (MockHttpServletRequest) | 2 |
| `AplicacionGestorAcademicoTests` | Contexto | 1 |
| **Total** | | **178** |

Cobertura de líneas de la última medición JaCoCo: **61,0 %** (1802/2956). El build exige un
mínimo de **55 %** (`jacoco:check`, fase `verify`) sobre el código de negocio
(se excluyen DTOs, entidades, configuración, excepciones, mappers y auditoría).
La verificación `mvn verify` tras 7.1–7.2 finalizó con **All coverage checks have been met**.

### Frontend — 90 pruebas, 0 fallos

| Archivo | Qué valida |
| :--- | :--- |
| `tokenStorage.test.ts` | Persistencia en `localStorage` vs `sessionStorage`, migración entre almacenes, limpieza total y lectura segura de JSON corrupto. |
| `authService.test.ts` | Contrato de `/auth/login`, `/auth/refresh` y `/auth/logout` (incluye envío del token de refresco). |
| `dashboardService.test.ts` | Contrato de `/dashboard/summary` y normalización de bloques no autorizados (`null`). |
| `notificationService.test.ts` | Contrato de `/notifications` y propagación de errores de red. |
| `notificationReadState.test.ts` | Estado leído por usuario en `localStorage`, normalización de duplicados y tolerancia a datos corruptos. |
| `dashboardFormatters.test.ts` | Formato de métricas, porcentajes, ciclos y fechas del panel. |
| `BarChart.test.tsx` | Render de barras, etiquetas, valores y accesibilidad. |
| `LineChart.test.tsx` | Render de la serie temporal, puntos y descripción accesible. |
| `DistributionChart.test.tsx` | Vista lineal por defecto, selector Línea/Barras, etiquetas completas y estado vacío. |
| `NotificationBell.test.tsx` | Contador real de no leídos, apertura/cierre con Escape, actualización al abrir y estado "Todo al día". |
| `auditFormatters.test.ts` | Etiquetas de acción, tonos, conversión UTC→Lima, agrupación por día, IP/red y lectura de `User-Agent`. |
| `AuditTable.test.tsx` | Orden de las cinco columnas (Acción, Usuario, Dispositivo/IP, Detalle, Fecha), contenido comprensible, fallos y datos ausentes. |
| `AuditActivityPanel.test.tsx` | KPIs del periodo, comparación con el periodo anterior, selector 7/14/30, barras accesibles, estados de carga/error y vacío. |
| `roleFormatters.test.ts` | Traducción de roles, módulos y permisos al español, normalización de búsqueda sin tildes, plurales, agrupación por módulo, iniciales y protección del rol base. |
| `RoleCard.test.tsx` | Nombre en español y código técnico, conteo de usuarios/permisos/módulos, acciones interactivas, eliminación deshabilitada por usuarios asignados y por rol base, y omisión de acciones sin permiso. |
| `universityService.test.ts` | Contrato de facultades y carreras (`GET/POST/PUT`), filtro por facultad y propagación de errores de negocio del catálogo. |
| `studentCatalog.test.ts` | Normalización de nombres del catálogo, filtrado de carreras por facultad y resolución de la facultad canónica de una carrera. |
| `loginErrors.test.ts` | Mensajes de login para 401, 423, 429, fallo de conexión y prioridad del mensaje de negocio de la API. |
| `academicService.test.ts` | Contrato de periodos y cursos (`GET/POST/PUT/PATCH/DELETE`) del módulo de estructura académica. |

Herramientas: **Vitest 5 + jsdom**. Comandos: `npm test`, `npm run test:coverage`.

---

## 6. Seguridad

| Control | Implementación | Evidencia |
| :--- | :--- | :--- |
| Autenticación | JWT firmado HS256 con BCrypt para contraseñas | `ProveedorTokenJwt`, `ConfiguracionSeguridad` |
| Token de refresco | JWT con claim `tipo=refresh`, `jti` único, rotación y revocación | `ServicioAutenticacionImpl.refresh`, `RegistroTokensRevocados` |
| Separación de tokens | El filtro JWT rechaza tokens cuyo `tipo` no sea `access` | `FiltroAutenticacionJwt` |
| Logout seguro | Revoca el token de refresco recibido en el cuerpo | `ControladorAutenticacion.logout` |
| Autorización | RBAC por permiso atómico con `@PreAuthorize` en todos los endpoints de negocio | 18 controladores |
| Fuerza bruta | Límite por IP (HTTP 429) + bloqueo de cuenta a los 5 intentos durante 15 min | `FiltroLimiteIntentosLogin`, `ServicioAutenticacionImpl` |
| IP y dispositivo reales | `getRemoteAddr()` se resuelve contra `X-Forwarded-For`/`X-Real-IP` solo si el par directo es loopback o red privada; la auditoría guarda IP y `User-Agent` | `ResolutorIpCliente`, `FiltroIpClienteReal` + pruebas unitarias |
| Política de contraseñas | Mín. 8, máx. 100, mayúscula, minúscula, dígito, símbolo y bloqueo de claves comunes | `@ContrasenaSegura` + `ValidadorContrasenaSegura` |
| Cabeceras | CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` | `ConfiguracionSeguridad` |
| CORS | Orígenes exactos por variable; en `prod` se vacían los patrones de red local | `ConfiguracionCors`, `application-prod.yml` |
| Actuator | `show-details: when_authorized`; en `prod`, `never` y solo `health,info` | `application.yml`, `application-prod.yml` |
| Secretos | `.env` ignorado por Git; `.env.example` con placeholders `CAMBIAR_*`; arranque productivo rechaza secretos por defecto | `.gitignore`, `ValidacionConfiguracionProductiva` |
| Esquema | `ddl-auto: update` en desarrollo; `validate` en producción | `application-prod.yml` |
| Auditoría | Registro de login, logout, refresh fallido/exitoso y CRUD con IP y user-agent | `ServicioAuditoria` |
| Resumen de auditoría | `GET /api/v1/audit/summary` exige `AUDITORIA_VIEW`, acota la ventana a 90 días y devuelve solo agregados (sin usuarios ni IP) | `ControladorAuditoria`, `ServicioAuditoriaImpl` + pruebas MockMvc y `@DataJpaTest` |
| Sesión en cliente | `sessionStorage` si no se marca "Mantener sesión activa"; `localStorage` solo si se marca | `tokenStorage.ts`, `LoginPage.tsx` |
| Integridad de roles | `DELETE /api/v1/roles/{id}` rechaza el rol base `ROLE_UNIVERSIDAD` y cualquier rol con usuarios asignados (mensaje en español + evento `FAILURE` en auditoría); la UI deshabilita el botón en ambos casos | `ServicioRolImpl.deleteRole`, `RepositorioUsuario.countByRoleId`, `RoleCard` + pruebas unitarias |
| Mínimo privilegio en el catálogo | El conteo de usuarios por rol se calcula con una proyección agregada (`ProyeccionConteoRol`) y solo devuelve números, sin exponer datos personales | `RepositorioUsuario.countUsuariosPorRol`, `DtoRol.usuarios` |

### Verificación en vivo

```powershell
# No debe devolver componentes internos sin autenticación
Invoke-RestMethod http://localhost:8094/actuator/health

# Login (devuelve accessToken + refreshToken)
$login = Invoke-RestMethod -Method Post -Uri http://localhost:8094/api/v1/auth/login `
  -ContentType 'application/json' `
  -Body '{"usernameOrEmail":"admin","password":"gestor123"}'

# Renovación con rotación
Invoke-RestMethod -Method Post -Uri http://localhost:8094/api/v1/auth/refresh `
  -ContentType 'application/json' `
  -Body ("{`"refreshToken`":`"" + $login.data.refreshToken + "`"}")
```

---

## 7. Limitaciones conocidas (declaradas)

1. **Revocación de tokens en memoria**: `RegistroTokensRevocados` es local al
   proceso. Con varias instancias hace falta Redis o una tabla compartida.
2. **Almacenamiento del token en el navegador**: si el usuario marca "Mantener
   sesión activa", el token va a `localStorage` y sigue siendo vulnerable a XSS.
   La mitigación completa requiere cookies `HttpOnly` + `SameSite` + CSRF.
3. **Migraciones**: producción usa `ddl-auto: validate`, pero aún no se versionan
   migraciones con Flyway/Liquibase; los scripts de `database/` son la fuente
   actual del esquema.
4. **Cobertura**: 61,0 % de líneas. El umbral de 55 % es una garantía mínima, no
   una meta; los servicios con más lógica (roles, estudiantes) admiten más tests.

---

## 8. Cómo reproducir la verificación

```powershell
# Backend: compila, ejecuta las 178 pruebas, genera JaCoCo y valida el umbral
docker run --rm `
  -v "C:/Users/Usuario/Downloads/GESTORACAD/GESTORACAD/backend:/app" `
  -v gestoracad_m2:/root/.m2 -w /app `
  maven:3.9-eclipse-temurin-21 mvn -B verify

# Cobertura HTML
start backend/target/site/jacoco/index.html

# Frontend: 90 pruebas + build de producción
cd frontend
npm test
npm run build
```

Criterio de aceptación del pipeline: `BUILD SUCCESS` en Maven (incluye
`All coverage checks have been met`) y `Tests 86 passed` en Vitest.

---

## 9. Auditoría, normalización y catálogo académico (Fases 7, 8 y 9 técnicas)

La base de datos fue auditada y normalizada con los scripts idempotentes
`database/07_db_functions_normalization.sql` y
`database/08_normalizacion_duplicaciones.sql`:

- **Normalización 3FN/BCNF:** catálogos `tb_facultades`/`tb_carreras` con FK
  obligatorias desde estudiantes y docentes; se eliminó la dependencia transitiva
  carrera → facultad y las columnas de texto duplicadas.
- **Datos derivados:** `horas_totales` se calcula como teóricas + prácticas; los
  datos de ingreso viven solo en `tb_estudiante_admisiones`; `ultima_conexion` es
  el último acceso del usuario.
- **Objetos programables:** 8 funciones, 8 procedimientos, 2 triggers y 8 vistas.
- **Integridad:** 14 claves foráneas, 21 CHECK y auditoría inmutable ante
  `UPDATE`/`DELETE`.
- **Rendimiento:** 59 índices, 0 redundantes según `sys.schema_redundant_indexes`.
- **Calidad:** `vw_integridad_datos` con 11 controles, todos en `OK`.
- **Regresión:** el backend reinicia sin errores y `GET /api/v1/students`,
  `GET /api/v1/teachers` y `GET /api/v1/dashboard/summary` mantienen el contrato
  y los mismos totales reales (6 estudiantes, 5 docentes, 4 facultades, 5 carreras).

La **Fase 9** habilita el mantenimiento del catálogo desde el módulo Universidad
con `database/09_catalogo_academico_permisos.sql`:

- **Endpoints:** `/api/v1/faculties` y `/api/v1/careers` con CRUD completo y
  filtro `GET /api/v1/careers/faculty/{facultyId}`.
- **Autorización:** permisos `FACULTAD_VIEW/CREATE/EDIT/DELETE` y
  `CARRERA_VIEW/CREATE/EDIT/DELETE`, creados y asignados de forma idempotente a
  `ROLE_UNIVERSIDAD` y a los roles con `SEDE_VIEW`.
- **Reglas:** no se desactivan facultades con carreras o personas activas ni
  carreras con estudiantes activos; el cambio de facultad de una carrera
  sincroniza `tb_estudiantes.facultad_id` en la misma transacción.
- **Verificación en vivo:** listados con 4 facultades y 5 carreras, alta/edición/
  baja de prueba, duplicados rechazados con 400, bloqueos de baja con 400,
  reasignación correcta y dashboard sin cambios (4/5/6/5).

Evidencia completa, hallazgos y operación: `docs/11_auditoria_base_datos.md` y
`docs/12_auditoria_bd_duplicaciones.md`.
