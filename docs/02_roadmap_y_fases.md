# Plan Director y Hoja de Ruta por Fases

El desarrollo del **Gestor Académico Virtual** se ejecuta bajo un estricto enfoque iterativo por fases. Cada fase debe cumplir rigurosamente sus criterios de aceptación y verificación técnica antes de habilitar la siguiente fase.

---

## Matriz General de Fases

| Fase | Denominación | Estado | Alcance Principal |
| :---: | :--- | :---: | :--- |
| **1** | **Arquitectura, Configuración Inicial y Análisis** | **COMPLETADA** | Estructura `/backend`, `/frontend`, `/database`, `/docker`, `/docs`. Spring Boot 3.4, React 19 + Vite, MySQL 8+, phpMyAdmin, Docker Compose, endpoints de salud `/api/v1/health` y suite de pruebas inicial. |
| **2** | **Base de Datos Normalizada + Seguridad + Roles + Auditoría** | **COMPLETADA** | Esquema SQL 3FN (`tb_usuarios`, `tb_roles`, `tb_permisos`, `tb_usuario_rol`, `tb_rol_permiso`, `tb_auditoria`). Entidades JPA, repositorios, contraseñas cifradas con BCrypt, DTOs sin exposición de credenciales, servicio de auditoría transaccional autónomo y vistas frontend (`/users`, `/roles`, `/audit`). |
| **3** | **Autenticación Completa + Login + Gestión de Usuarios** | **COMPLETADA** | Login real con JWT (`/api/v1/auth/login`, `/logout`, `/me`, `/change-password`), `JwtAuthenticationFilter` en cada petición, autorización por permisos `MODULO_ACCION` (`@PreAuthorize`) en backend y filtrado de menú/acciones en frontend. Bloqueo de cuenta tras 5 intentos fallidos (15 min). Auditoría extendida (entidad, ID entidad, user agent, IP, endpoint, método, resultado). Frontend: `AuthContext` con token/roles/permisos, `LoginPage`, `ProfilePage` y menú adaptado por rol. |
| **4** | **Módulo Universidad** | **COMPLETADA** | Institución matriz, sedes/campus, autoridades rectorales y parametrización global. Tablas `tb_universidad`, `tb_sedes`, `tb_autoridades`, `tb_parametros`; 15 permisos `UNIVERSIDAD/SEDE/AUTORIDAD/PARAMETRO`; API REST (`/api/v1/university`, `/campuses`, `/authorities`, `/parameters`) con `@PreAuthorize`, soft-delete y auditoría; frontend `UniversityPage` con pestañas General/Sedes/Autoridades/Parámetros y CRUD filtrado por permisos. |
| **5** | **Módulo Docente** | **COMPLETADA** | Padrón del claustro, especialidades académicas y asignaciones/carga lectiva. Tablas `tb_docentes`, `tb_docente_especialidades`, `tb_docente_asignaciones`; 13 permisos `DOCENTE/ESPECIALIDAD/ASIGNACION`; API REST (`/api/v1/teachers`, `/teacher-specialties`, `/teacher-assignments`) con `@PreAuthorize`, soft-delete y auditoría; frontend `TeachersPage` con búsqueda/filtros, vistas tarjetas/tabla y modal de gestión (especialidades y cátedras) por permisos. |
| **6** | **Módulo Estudiante** | **COMPLETADA** | Expediente estudiantil, datos personales, historial de ingreso y estado académico. Tablas `tb_estudiantes`, `tb_estudiante_admisiones`; 9 permisos `ESTUDIANTE/ADMISION`; API REST (`/api/v1/students`, `/student-admissions`) con `@PreAuthorize`, soft-delete y auditoría; frontend `StudentsPage` con búsqueda/filtros (carrera y condición), vistas tarjetas/tabla y modal de expediente con gestión del historial de ingreso. |
| **7** | **Estructura Académica** | **COMPLETADA (7.1–7.3)** | **Implementado:** periodos, cursos, planes de estudio con malla, secciones, matrícula, prerrequisitos y horarios estructurados con detección de choques. Permisos `PERIODO_*`, `CURSO_*`, `PLAN_*`, `SECCION_*` y `MATRICULA_*`, auditoría y sincronización del periodo con el Dashboard. **Siguiente:** Fase 8 (notas, asistencia y actas). |
| **8** | **Módulos Académicos Adicionales** | **COMPLETADA (8.1–8.4)** | Evaluaciones, notas, asistencia y actas; portales de estudiante y docente; historial académico; validación de prerrequisitos; vínculo cuenta-ficha. **Pendiente:** reportes PDF/Excel, reapertura de actas y regla de asistencia mínima. |
| **9** | **Base de Conocimiento Académica** | **9.1 implementada** | Repositorio documental persistente, búsqueda local, fuentes visibles y carga de `.txt`. **Pendiente:** PDF/Word, categorías avanzadas, vigencia y FAQs estructuradas. |
| **10**| **Integración Opcional IA / GPT + RAG** | *Pendiente* | Motor de recuperación aumentada (RAG) para consultas en lenguaje natural basadas en la base de conocimiento institucional. |
| **11**| **Reportes, Optimización, Seguridad Avanzada y Despliegue** | *Pendiente* | Generación de reportes PDF/Excel, optimización de consultas SQL, auditoría forense y despliegue final en producción. |

> **Nota sobre fases técnicas:** además del roadmap funcional, se ejecutaron dos
> fases técnicas de base de datos: la **Fase 7 técnica** (auditoría, catálogos de
> facultades/carreras, funciones, procedimientos y vistas, script
> `07_db_functions_normalization.sql`) y la **Fase 8 técnica** (normalización
> completa: eliminación de columnas duplicadas y derivadas, script
> `08_normalizacion_duplicaciones.sql`). Ambas están documentadas en
> `docs/11_auditoria_base_datos.md` y `docs/12_auditoria_bd_duplicaciones.md`.
