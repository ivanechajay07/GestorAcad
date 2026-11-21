# Plan de cierre profesional — Gestor Académico Virtual

**Fecha:** 06/11/2026  
**Propósito:** ordenar lo que falta para llevar el proyecto de un MVP académico funcional a una plataforma institucional mantenible, segura y operable.

---

## 1. Estado actual

### Funcionalidad implementada

| Área | Estado |
| :--- | :---: |
| Autenticación, JWT, refresh, bloqueo y auditoría | ✅ |
| Usuarios, roles y permisos | ✅ |
| Universidad: institución, sedes, autoridades y parámetros | ✅ |
| Facultades y carreras | ✅ |
| Docentes, especialidades y asignaciones | ✅ |
| Estudiantes, admisiones y expediente | ✅ |
| Dashboard y notificaciones | ✅ |
| Bitácora de auditoría inmutable | ✅ |
| Estructura académica 7.1: periodos y cursos | ✅ |
| Estructura académica 7.2: planes, malla, secciones y matrícula | ✅ |
| Estructura académica 7.3: prerrequisitos y horarios estructurados | 🕓 |
| Notas, evaluaciones, asistencia y actas | 🕓 |
| Base de conocimiento y IA/RAG | 🕓 |
| Reportes, optimización y despliegue productivo | 🕓 |

### Calidad y datos

- **178 pruebas backend** y **90 pruebas frontend**.
- Build de producción correcto y despliegue local con Docker.
- **87 permisos**, 3 roles y 3 usuarios.
- Integridad de base de datos: **11/11 controles OK**.
- Datos de ejemplo: 2 periodos, 4 cursos, 2 planes, 5 cursos de malla y 2 secciones.

### Conclusión

El núcleo de gestión académica está operativo. Lo que falta ya no es “pantallas”, sino **completar el ciclo académico** (notas, asistencia, actas, reportes) y **profesionalizar la operación** (CI/CD, respaldos, observabilidad, seguridad de producción y migraciones automatizadas).

---

## 2. Brechas por categoría

### 2.1. Funcional

1. **Fase 7.3 — Estructura académica avanzada**
   - Prerrequisitos y correquisitos por curso.
   - Horarios estructurados (día, hora inicio/fin, aula) en lugar de texto.
   - Filtros de secciones por periodo, curso, docente y disponibilidad.
   - Lista de espera y cupos por mérito (opcional).
2. **Fase 8 — Ciclo académico**
   - Evaluaciones por sección (parciales, prácticas, examen final).
   - Registro de notas con escala 0-20 y redondeo institucional.
   - Cálculo de promedio ponderado y créditos aprobados.
   - Asistencia por sesión y porcentaje de asistencia.
   - Actas de evaluación, cierre de periodo y bloqueo de edición.
   - Historial académico y récord de notas del estudiante.
3. **Fase 9 — Base de conocimiento**
   - Reglamentos, estatutos, normativas, guías y FAQs.
   - Búsqueda por texto y por categoría.
   - Control de vigencia y autoría documental.
4. **Fase 10 — IA/RAG**
   - Indexación de la base de conocimiento.
   - Consultas en lenguaje natural con citas a la fuente.
   - Control de acceso por rol y registro de consultas.
5. **Fase 11 — Reportes y cierre**
   - PDF/Excel de matrícula, carga docente, actas y avance curricular.
   - Reportes de ocupación de secciones y deserción.
   - Exportaciones auditadas.

### 2.2. Seguridad

| Brecha | Riesgo | Prioridad |
| :--- | :--- | :---: |
| Nginx no emite CSP/HSTS para el SPA | XSS y downgrade | P0 |
| Swagger, actuator y health públicos | Exposición de superficie y metadatos | P1 |
| `USUARIO_EDIT` puede asignar `ROLE_UNIVERSIDAD` | Escalada de privilegios | P1 |
| No se protege al último administrador | Bloqueo total del sistema | P1 |
| Tokens en `localStorage`/`sessionStorage` | Robo por XSS | P2 |
| Sin recuperación automática de contraseña | Operación manual | P2 |
| Secretos de ejemplo en `.env` local | Riesgo si se copia a producción | P1 (mitigado por perfil `prod`) |
| Sin MFA para cuentas administrativas | Mayor impacto de phishing | P2 |

> Ya existen: BCrypt, bloqueo por intentos, rate limit por IP, rotación/revocación de refresh tokens, auditoría inmutable y validación de configuración productiva.

### 2.3. Calidad y pruebas

- Ejecutar **`mvn verify`** para recalcular JaCoCo tras 7.1–7.2 y confirmar el umbral.
- Pruebas **E2E** (Playwright/Cypress) para login, matrícula, notas y actas.
- Pruebas de **accesibilidad automatizadas** (axe) en las páginas principales.
- Pruebas de **carga** para matrícula y dashboard (k6/JMeter).
- Pruebas de **contrato** de la API y ejemplos OpenAPI.
- Pruebas de integración de los controladores de planes, secciones y matrículas (hoy cubiertos por servicios y smoke tests).

### 2.4. Datos y operación

| Brecha | Impacto | Prioridad |
| :--- | :--- | :---: |
| Migraciones SQL manuales | Riesgo de entornos desalineados | P0 |
| Sin CI/CD | Regresiones y despliegues manuales | P0 |
| Un solo respaldo manual | Pérdida de datos | P0 |
| Sin entorno de staging | Validación insuficiente | P1 |
| Sin monitoreo ni alertas | Incidentes silenciosos | P1 |
| Sin política de retención de auditoría | Crecimiento indefinido | P2 |
| Sin runbook de recuperación | Tiempo de recuperación alto | P1 |

Recomendación: **Flyway o Liquibase**, backups automáticos con prueba de restauración, `docker-compose.prod.yml`, pipeline CI y monitoreo (Prometheus/Grafana o servicio gestionado, Sentry para frontend/backend).

### 2.5. Rendimiento y escala

- Paginación y filtros **en servidor** para estudiantes, docentes, usuarios y auditoría (hoy se cargan listas completas y se filtran en cliente).
- Caché del dashboard y de catálogos estables.
- Reducir el `heartbeat` de 30 s a 2–5 min o actualizar solo por evento.
- Índices y planes de ejecución para matrícula y reportes.
- Exportaciones asíncronas para grandes volúmenes.

### 2.6. UX y accesibilidad

- Auditoría de accesibilidad de todas las páginas (el login ya fue corregido).
- Unificar componentes duplicados: `Modal`, `Field`, estilos de formularios y tablas.
- Estados vacíos, carga y error homogéneos.
- Tablas responsive con columnas prioritarias en móvil.
- Revisión de textos, tildes y consistencia de marca.
- Manual de usuario y ayuda contextual.

### 2.7. Documentación y gobernanza

- Actualizar `docs/03_analisis_funcional_academico.md` al alcance real 7.1–7.2.
- ADRs (decisiones de arquitectura) y changelog.
- Diccionario de datos y catálogo de endpoints.
- Runbooks: despliegue, rollback, backups, incidentes.
- Política de versionado y ramas (GitFlow o trunk-based).
- Manual de usuario por rol.
- Revisar `ComingSoonPage` sin uso y limpiar código legado.

---

## 3. Roadmap ordenado propuesto

### Sprint 0 — Profesionalización base (P0)

1. Pipeline CI: `mvn verify`, `npm test`, `npm run build`, análisis de dependencias.
2. Migraciones con Flyway/Liquibase y versión de esquema.
3. Backups automáticos + restauración verificada.
4. CSP/HSTS en Nginx y restricción de Swagger/health en producción.
5. Protección del último administrador y de la asignación del rol base.
6. `docker-compose.prod.yml` y `.env.example` definitivo.

**Criterio de aceptación:** pipeline verde, backup restaurado en un entorno limpio, CSP activa y pruebas de seguridad básicas.

### Sprint 1 — Fase 7.3 (✅ completado)

- Prerrequisitos/correquisitos.
- Horarios estructurados.
- Filtros de secciones y validaciones de choque de horario.

**Criterio:** un plan puede definir prerrequisitos y una sección no puede solaparse con otra del mismo docente/aula.

### Sprints 2–3 — Fase 8

- Evaluaciones, notas, promedios y créditos.
- Asistencia.
- Actas y cierre de periodo.
- Historial académico.

**Criterio:** un docente registra notas y asistencia; el acta se cierra y no se puede editar; el estudiante ve su avance.

### Sprint 4 — Reportes y rendimiento

- PDF/Excel de matrícula, actas, carga docente y ocupación.
- Paginación de servidor y caché del dashboard.
- Pruebas de carga.

**Criterio:** reportes exportables y tiempos de respuesta aceptables con datos simulados.

### Sprint 5 — Fase 9 y 10

- Base de conocimiento.
- Búsqueda y RAG con citas y control de acceso.

**Criterio:** consultas responden con fuentes verificables y respetan permisos.

### Sprint 6 — Producción

- Staging, monitoreo, alertas, runbooks, rollback.
- Auditoría de seguridad y accesibilidad.
- Manual de usuario y capacitación.

**Criterio:** despliegue reproducible, monitoreado y con recuperación documentada.

---

## 4. Prioridad inmediata (qué haría primero)

1. **CI/CD + `mvn verify` + backups**: sin esto, cada avance incrementa el riesgo.
2. **CSP/HSTS y restricciones de producción**: cierre de seguridad de bajo esfuerzo y alto impacto.
3. **Último administrador y asignación de rol base**: evita bloqueos y escaladas.
4. **Paginación de servidor**: evita que el módulo académico se vuelva lento al crecer.
5. **Fase 7.3 + Fase 8**: completar el ciclo académico real.

---

## 5. Definition of Done por módulo

Un módulo se considera terminado cuando cumple:

- CRUD y reglas de negocio validadas en backend.
- Permisos `MODULO_ACCION` y guardias en frontend.
- Auditoría de éxitos y rechazos.
- Pruebas unitarias, de integración y de contrato.
- Migración idempotente y datos de ejemplo.
- UI con estados de carga, vacío y error; accesible por teclado.
- Documentación técnica y manual de usuario.
- Sin regresiones en `mvn verify`, `npm test` y build.
- Sin hallazgos críticos de seguridad o rendimiento.

---

## 6. Riesgos principales

| Riesgo | Mitigación |
| :--- | :--- |
| Migraciones manuales desalineadas | Flyway/Liquibase y CI |
| Pérdida de datos | Backups automáticos y restauración probada |
| Escalada de privilegios | Restringir roles base y auditoría |
| Bajo rendimiento con volumen real | Paginación, índices y pruebas de carga |
| Dependencia de una sola persona | Runbooks, ADRs y documentación |
| Alcance creciente sin cierre | Roadmap por sprints y Definition of Done |

---

## 7. Recomendación

El proyecto ya tiene una base funcional sólida. Para considerarlo **profesional y ordenado**, el orden correcto es:

1. **Asegurar** (CI, backups, seguridad de producción).
2. **Completar el ciclo académico** (7.3 y Fase 8).
3. **Escalar** (reportes, rendimiento, observabilidad).
4. **Agregar valor** (conocimiento e IA).

No conviene avanzar a IA o nuevos módulos antes de cerrar CI/CD, backups, seguridad de producción y el ciclo de notas/actas.
