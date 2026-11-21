# Auditoría de cierre del proyecto — Gestor Académico Virtual

**Fecha:** 19/11/2026  
**Alcance:** código, pruebas, seguridad, permisos, datos, operación, documentación y funcionalidad pendiente.  
**Método:** revisión estática, `mvn verify`, `npm test`, build, API en vivo, consultas SQL y navegador headless.

---

## 1. Veredicto general

El proyecto tiene un **núcleo académico funcional y coherente**: autenticación, usuarios, roles, universidad, facultades/carreras, docentes, estudiantes, dashboard, auditoría y estructura académica 7.1–7.2.

No está listo para producción institucional todavía. Lo que falta no es “más pantallas”, sino:

1. **Cerrar el ciclo académico** (notas, asistencia, actas y reportes).
2. **Cerrar brechas de integridad y permisos**.
3. **Profesionalizar la operación** (CI/CD, migraciones, backups, monitoreo y seguridad de producción).

**Estado:** núcleo funcional sólido; preparación productiva incompleta.

---

## 2. Evidencia verificada

| Control | Resultado |
| :--- | :--- |
| Backend `mvn verify` | **178 pruebas, 0 fallos**, `BUILD SUCCESS` |
| Cobertura JaCoCo | **61,0 %** (1802/2956), umbral 55 % cumplido |
| Frontend `npm test` | **90 pruebas, 20 archivos, 0 fallos** |
| Frontend build | Correcto |
| Lint frontend | 0 errores; advertencias de lint |
| Docker | MySQL, backend, frontend y phpMyAdmin activos |
| Frontend | `http://localhost:3010` → HTTP 200 |
| Backend | `/api/v1/health` → UP |
| Autorización API | Recurso sin token → **401** |
| Integridad BD | **11/11 controles OK** |
| Permisos | 79 |
| Datos | 2 periodos, 4 cursos, 2 planes, 5 cursos de malla, 2 secciones, 0 matrículas |
| Swagger | Público |
| Health | Público |
| CI/CD | **No existe** |
| Control de versiones | **No hay repositorio Git** |
| Backups | **1 respaldo manual** |

---

## 3. Hallazgos críticos y altos

### A. Sin control de versiones ni CI/CD

- No existe repositorio Git (`.git`) ni historial de cambios.
- No existe `.github/workflows`, `.gitlab-ci.yml` ni equivalente.
- Los builds y pruebas se ejecutan manualmente.
- Riesgo: no hay trazabilidad de cambios, ramas, revisiones, rollback ni validación automática.

**Recomendación:** inicializar Git, remoto institucional, estrategia de ramas y pipeline con `mvn verify`, `npm test`, `npm run build`, análisis de dependencias y publicación de artefactos.

### B. Migraciones manuales y un solo respaldo

- El esquema se aplica con scripts SQL montados en Docker; no hay Flyway/Liquibase.
- Solo existe `backups/gestoracad_pre_normalizacion_20261028.sql`.
- Riesgo: entornos desalineados y pérdida de datos sin restauración probada.

**Recomendación:** Flyway/Liquibase, backups automáticos diarios y simulacro de restauración.

### C. Portales de docente y estudiante — resuelto parcialmente

- `ROLE_ESTUDIANTE` ya accede a `/my-progress` con cursos, notas, asistencia y acta.
- `ROLE_DOCENTE` accede a `/my-sections` y puede gestionar notas/asistencia y cerrar actas solo en sus secciones.
- **Pendiente:** reportes de actas, historial por periodos y notificaciones.

**Recomendación:** completar reportes y notificaciones en Fase 11.

### D. Integridad de bajas incompleta

Por revisión de servicios:

- Un **periodo no vigente** puede desactivarse aunque tenga secciones.
- Un **curso** puede desactivarse aunque tenga secciones activas.
- Un **estudiante** puede desactivarse con matrículas activas.
- Un **docente** puede desactivarse con secciones asignadas.

Las bajas de sección y matrícula sí tienen controles, pero las entidades superiores no.

**Recomendación:** bloquear la baja mientras existan dependencias activas, con mensaje y auditoría `FAILURE`.

### E. Escalada de privilegios y último administrador

- `USUARIO_EDIT` puede asignar `ROLE_UNIVERSIDAD` a cualquier cuenta.
- Se puede deshabilitar la propia cuenta o al último administrador.
- `ROL_EDIT` puede modificar el rol base y sus permisos; `ROL_DELETE` puede eliminar permisos usados por `@PreAuthorize`.

**Recomendación:** permisos diferenciados para asignar roles base, proteger la última cuenta administradora y bloquear la edición/eliminación de permisos críticos.

### F. CSP/HSTS ausentes en el frontend

- Spring envía CSP y cabeceras en las respuestas de API.
- Nginx sirve el HTML/JS del SPA **sin CSP ni HSTS**.
- Verificado en vivo: el frontend solo envía `X-Frame-Options`, `X-Content-Type-Options` y `Referrer-Policy`.

**Recomendación:** CSP y HSTS en `docker/nginx.conf`; validar con `curl -I`.

### G. Swagger y health públicos

- `/swagger-ui/**`, `/v3/api-docs/**`, `/actuator/health` y `/actuator/info` están en la whitelist.
- `health` expone la versión del motor de base de datos y una fase obsoleta (“FASE 1”).

**Recomendación:** restringir en producción o exponer una versión mínima.

---

## 4. Hallazgos medios

### H. Rendimiento y escala

- Estudiantes, docentes, usuarios y auditoría cargan listas completas y filtran/paginan en cliente.
- Auditoría solo expone los últimos 100 eventos.
- El dashboard recalcula conteos en cada petición.
- El heartbeat escribe `ultima_conexion` cada 30 segundos por usuario.

**Recomendación:** paginación/filtros en servidor, caché de agregados estables, retención/archivo de auditoría y heartbeat cada 2–5 minutos.

### I. Cobertura y pruebas

- Cobertura global 61,0 %: supera el mínimo, pero está por debajo de un objetivo profesional de 75–80 %.
- No hay pruebas E2E.
- Los controladores de planes, secciones y matrículas no tienen pruebas de integración MockMvc; están cubiertos por servicios y smoke tests.
- No hay pruebas de carga ni de accesibilidad automatizada.

### J. Seguridad de sesión

- Tokens en `localStorage`/`sessionStorage`.
- No hay recuperación automática de contraseña; el modal solo registra una solicitud.
- No hay MFA para cuentas administrativas.

### K. Estado de notificaciones

- “Leído” se guarda por usuario en `localStorage`; no se sincroniza entre dispositivos.

### L. Accesibilidad y UX

- El login fue corregido; el resto de páginas no tiene auditoría formal.
- Los tabs académicos no declaran `aria-controls`/`tabpanel`.
- El modal académico no implementa cierre con `Escape` ni trampa de foco.
- Tablas anchas dependen de scroll horizontal en móvil.

### M. Deuda técnica y documentación

- `ComingSoonPage` quedó sin uso.
- `docs/03_analisis_funcional_academico.md` describe el alcance antiguo.
- No hay ADRs, changelog, runbooks ni manual de usuario.
- advertencias de lint, principalmente `set-state-in-effect` y `only-export-components`; no bloquean el build, pero conviene reducirlas.

### N. Prototipo de asistente académico

- Se detectó `AssistantPage` (`/assistant`) con búsqueda local de textos y carga de `.txt`.
- La propia pantalla lo identifica como **“Prototipo funcional / Modo demostración”**: no hay backend, índice, embeddings, modelo ni control de permisos.
- No debe considerarse Fase 9 o 10 completada. La Fase 9 requiere base documental persistente y la Fase 10 un proveedor de IA/RAG real.

### O. Detalles menores

- `ensureUnique` de secciones registra `CREATE` incluso en una actualización.
- `health.currentPhase` sigue en “FASE 1”.
- El avatar no tiene límite de tamaño en backend.

---

## 5. Funcionalidad pendiente

| Fase | Estado | Observación |
| :--- | :--- | :--- |
| **7.3** | ✅ Implementado | Prerrequisitos y horarios estructurados |
| **8** | ✅ 8.1–8.3 | Notas, asistencia, actas y portales; faltan reportes e historial |
| **9** | ⚠️ Prototipo local | Sin persistencia ni backend documental |
| **10** | ❌ Pendiente | IA/RAG real con proveedor |
| **11** | ❌ Pendiente | Reportes PDF/Excel y producción |

Además, falta el **portal del estudiante**, una vista docente de “mis secciones” y los reportes de actas.

---

## 6. Qué falta para considerarlo “completo y profesional”

### P0 — Antes de seguir agregando módulos

1. Repositorio Git + pipeline CI/CD.
2. Flyway/Liquibase + backups automáticos + restauración probada.
3. CSP/HSTS en Nginx y restricción de Swagger/health.
4. Protección del último administrador y de la asignación de roles base.
5. Bloqueos de baja por dependencias activas.
6. Reportes PDF/Excel de actas, matrícula y ocupación.
7. Pruebas E2E de los flujos críticos.

### P1 — Cierre funcional

8. Historial académico completo por periodos.
9. Paginación de servidor y caché.
10. Notificaciones de publicación de notas/actas.

### P2 — Madurez

11. Base de conocimiento persistente.
12. IA/RAG real.
13. MFA, cookies `HttpOnly`, recuperación automática de contraseña.
14. Observabilidad, staging, runbooks, ADRs y manual de usuario.

---

## 7. Orden recomendado

1. **Asegurar**: CI/CD, migraciones, backups, CSP/HSTS, roles y bajas.
2. **Completar reportes**: actas PDF/Excel, historial y notificaciones.
3. **Escalar**: reportes, paginación, caché, observabilidad.
4. **Agregar valor**: base de conocimiento e IA/RAG.

---

## 8. Conclusión

El proyecto ya demuestra arquitectura, permisos, auditoría, normalización y un módulo académico real. Para llamarlo **completo y profesional** falta convertir ese núcleo en un sistema **operable, seguro y cerrado funcionalmente**.

La prioridad no debería ser añadir IA ni más catálogos, sino:

**CI/CD + backups + seguridad de producción + integridad de bajas + portales por rol + notas/actas.**

Con eso, el proyecto pasa de “sistema académico funcional” a “plataforma institucional lista para operar”.
