# Auditoría de Base de Datos, Normalización y Objetos Programables

**Proyecto:** Gestor Académico Virtual (GESTORACAD)  
**Fase:** 7 técnica — Auditoría de base de datos  
**Fecha:** 28 de octubre de 2026  
**Motor:** MySQL 8.0.46 · InnoDB · `utf8mb4_unicode_ci`  
**Script:** `database/07_db_functions_normalization.sql`, `database/08_normalizacion_duplicaciones.sql` y `database/09_catalogo_academico_permisos.sql`  
**Estado:** aplicado y verificado sobre la base viva

> **Actualización Fase 8 (28/10/2026):** este documento describe la auditoría de la
> Fase 7. La normalización completa se aplicó después con
> `database/08_normalizacion_duplicaciones.sql`: se eliminaron las columnas de
> texto `facultad`/`carrera`, los datos de ingreso duplicados en el padrón,
> `horas_totales` y `ultimo_login`, y se retiraron los triggers de sincronización
> y de horas. El backend resuelve ahora los nombres contra el catálogo mediante
> `ServicioCatalogoAcademico`; el detalle está en
> `docs/12_auditoria_bd_duplicaciones.md`.

> **Actualización Fase 9 (28/10/2026):** se habilitó el mantenimiento del
> catálogo desde el módulo Universidad con `database/09_catalogo_academico_permisos.sql`.
> El script crea los permisos `FACULTAD_*` y `CARRERA_*` y los asigna a
> `ROLE_UNIVERSIDAD` y a los roles con `SEDE_VIEW`. El CRUD valida duplicados,
> impide bajas con dependencias activas y sincroniza la facultad de los
> estudiantes cuando una carrera cambia de adscripción.

---

## 1. Resumen ejecutivo

La base de datos partía de un modelo relacional correcto en lo esencial (16 tablas InnoDB, claves primarias, claves foráneas y restricciones de dominio), pero presentaba cuatro brechas frente al objetivo de auditoría:

1. **No existían objetos programables**: 0 funciones, 0 procedimientos, 0 triggers y 0 vistas.
2. **La relación carrera → facultad estaba denormalizada** en `tb_estudiantes` (texto libre), con dependencia transitiva y sin integridad referencial.
3. **La carga horaria (`horas_totales`) era un valor derivado almacenado** sin garantía de consistencia.
4. **La bitácora de auditoría era mutable** y no había controles de rango para promedios, ciclos, puntajes, horas o aforos.

Tras aplicar el script 07, la base queda así:

| Indicador | Antes | Después |
| :--- | ---: | ---: |
| Tablas base | 16 | **18** (se añaden `tb_facultades` y `tb_carreras`) |
| Funciones almacenadas | 0 | **8** |
| Procedimientos almacenados | 0 | **8** |
| Triggers | 0 | **8** |
| Vistas | 0 | **8** |
| Índices | 45 | **62** (índices de apoyo y de catálogos; 5 redundantes eliminados y 1 índice de FK absorbido por un compuesto) |
| Claves foráneas | 10 | **14** |
| Restricciones CHECK | 14 | **21** |
| Índices redundantes detectados por `sys.schema_redundant_indexes` | — | **0** |
| Controles de integridad en `vw_integridad_datos` | — | **11, todos en OK** |

El dashboard institucional sigue respondiendo **HTTP 200**, con **1,92 KB**, sin PII y con los mismos totales reales: 6 estudiantes, 5 docentes, 3 usuarios, 4 facultades, 5 carreras, 3 sedes y periodo `2026-I`.

---

## 2. Metodología

1. **Inspección del esquema vivo** con `INFORMATION_SCHEMA` (`TABLES`, `COLUMNS`, `STATISTICS`, `KEY_COLUMN_USAGE`, `REFERENTIAL_CONSTRAINTS`, `TABLE_CONSTRAINTS`, `CHECK_CONSTRAINTS`, `ROUTINES`, `TRIGGERS`, `VIEWS`).
2. **Comparación con los scripts 01–06** para detectar deriva de esquema (*schema drift*).
3. **Análisis de normalización** (1FN, 2FN, 3FN y BCNF) tabla por tabla.
4. **Pruebas de integridad y calidad** con consultas de huérfanos, coherencia de horas, duplicados y rangos.
5. **Migración idempotente** mediante procedimientos que consultan `INFORMATION_SCHEMA` antes de crear columnas, índices, claves foráneas y CHECK (MySQL 8 no soporta `IF NOT EXISTS` para esos objetos).
6. **Pruebas de comportamiento** de triggers dentro de transacciones con `ROLLBACK`, sin alterar los datos reales.
7. **Regresión funcional**: reinicio del backend y verificación del endpoint `/api/v1/dashboard/summary`.

---

## 3. Inventario final

### 3.1 Tablas base (18)

| Dominio | Tablas |
| :--- | :--- |
| Infraestructura | `tb_schema_version` |
| Seguridad y auditoría | `tb_roles`, `tb_permisos`, `tb_usuarios`, `tb_usuario_rol`, `tb_rol_permiso`, `tb_auditoria` |
| Universidad | `tb_universidad`, `tb_sedes`, `tb_autoridades`, `tb_parametros` |
| Catálogos académicos | `tb_facultades`, `tb_carreras` |
| Docentes | `tb_docentes`, `tb_docente_especialidades`, `tb_docente_asignaciones` |
| Estudiantes | `tb_estudiantes`, `tb_estudiante_admisiones` |

### 3.2 Volumen de datos auditado

| Tabla | Filas |
| :--- | ---: |
| `tb_universidad` | 1 |
| `tb_sedes` | 3 |
| `tb_autoridades` | 3 |
| `tb_parametros` | 6 |
| `tb_roles` | 3 |
| `tb_permisos` | 52 |
| `tb_usuarios` | 3 |
| `tb_usuario_rol` | 3 |
| `tb_rol_permiso` | 58 |
| `tb_auditoria` | 13 |
| `tb_facultades` | 4 |
| `tb_carreras` | 5 |
| `tb_docentes` | 5 |
| `tb_docente_especialidades` | 7 |
| `tb_docente_asignaciones` | 7 |
| `tb_estudiantes` | 6 |
| `tb_estudiante_admisiones` | 6 |
| `tb_schema_version` | 7 |

> El evento 13 de auditoría corresponde al login de la propia verificación; los 12 iniciales son los registrados por la operación normal del sistema.

---

## 4. Auditoría de normalización

### 4.1 Primera Forma Normal (1FN)

**Cumple.** Todas las columnas son atómicas: no hay listas separadas por comas ni grupos repetidos. Las especialidades docentes, las admisiones y las asignaciones lectivas ya estaban modeladas como tablas hijas (`tb_docente_especialidades`, `tb_estudiante_admisiones`, `tb_docente_asignaciones`), no como columnas multivaluadas.

### 4.2 Segunda Forma Normal (2FN)

**Cumple.** Todas las tablas tienen clave primaria sustituta (`id BIGINT AUTO_INCREMENT`). Las tablas puente `tb_usuario_rol` y `tb_rol_permiso` tienen además clave única compuesta (`usuario_id, rol_id`) y (`rol_id, permiso_id`), por lo que no existen dependencias parciales.

### 4.3 Tercera Forma Normal (3FN)

**Cumplía parcialmente.** El hallazgo principal era:

```
tb_estudiantes(id, carrera, facultad, ...)
    id  →  carrera
    carrera  →  facultad        (dependencia transitiva)
```

La facultad dependía de la carrera, que a su vez dependía del estudiante. Lo mismo ocurría, sin dependencia transitiva interna pero con referencia por texto libre, en `tb_docentes.facultad`.

**Corrección aplicada:**

```
tb_facultades(id, nombre UNIQUE, ...)
tb_carreras(id, facultad_id FK, nombre UNIQUE, ...)
tb_estudiantes(..., facultad_id FK, carrera_id FK)
tb_docentes(..., facultad_id FK)
```

`tb_carreras.facultad_id` es ahora el único lugar donde reside la relación carrera → facultad. Los catálogos se poblaron a partir de los datos existentes y las claves foráneas se rellenaron sin pérdida de información (0 estudiantes sin `facultad_id`/`carrera_id`, 0 docentes sin `facultad_id`, 0 inconsistencias de texto).

**Normalización completa (Fase 8):** la API mantiene el contrato de texto, pero
las columnas `facultad`/`carrera` ya no existen en el padrón. El backend
(`ServicioCatalogoAcademico`) traduce cada nombre a `tb_facultades` /
`tb_carreras` y persiste únicamente las claves foráneas. Si el nombre no existe,
lo registra en el catálogo.

La fuente de verdad es el catálogo y no queda ninguna copia de texto que pueda
divergir.

### 4.4 Forma Normal de Boyce-Codd (BCNF)

Los catálogos cumplen BCNF: `id` y `nombre` son claves candidatas y no hay dependencias funcionales distintas de las claves. Desde la Fase 8 las tablas heredadas solo referencian el catálogo mediante FK, sin proyecciones de texto.

### 4.5 Desnormalizaciones intencionales y justificadas

| Elemento | Motivo | Control |
| :--- | :--- | :--- |
| `tb_auditoria.username` | Valor histórico del usuario en el momento del evento | Snapshot inmutable por diseño forense |
| `tb_auditoria.usuario_id` + `username` | Permite conservar la trazabilidad aunque la cuenta se elimine | Bitácora inmutable (`trg_auditoria_no_update/delete`) |

Las columnas de texto de facultad/carrera, `horas_totales`, los datos de ingreso
en el padrón y `ultimo_login` se eliminaron en la Fase 8.

### 4.6 Integridad referencial

Se añadieron cuatro claves foráneas:

| Constraint | Tabla | Referencia | Regla |
| :--- | :--- | :--- | :--- |
| `fk_carreras_facultad` | `tb_carreras` | `tb_facultades(id)` | `ON DELETE RESTRICT`, `ON UPDATE CASCADE` |
| `fk_estudiantes_facultad` | `tb_estudiantes` | `tb_facultades(id)` | `ON DELETE RESTRICT`, `ON UPDATE CASCADE` |
| `fk_estudiantes_carrera` | `tb_estudiantes` | `tb_carreras(id)` | `ON DELETE RESTRICT`, `ON UPDATE CASCADE` |
| `fk_docentes_facultad` | `tb_docentes` | `tb_facultades(id)` | `ON DELETE RESTRICT`, `ON UPDATE CASCADE` |

Las 10 claves foráneas preexistentes se conservaron sin cambios. El total es **14**.

---

## 5. Hallazgos y correcciones

| # | Hallazgo | Severidad | Corrección |
| :-- | :--- | :--- | :--- |
| 1 | Sin funciones, procedimientos, triggers ni vistas | Alta | 8 funciones, 8 procedimientos, vistas e inmutabilidad de auditoría (Fase 7) |
| 2 | Dependencia transitiva carrera → facultad | Alta | Catálogos `tb_facultades`/`tb_carreras` + FK obligatorias (Fase 8) |
| 3 | Referencias por texto sin integridad referencial | Alta | Columnas `facultad_id`/`carrera_id` + 4 FK; textos eliminados en la Fase 8 |
| 4 | `horas_totales` podía desincronizarse de teóricas + prácticas | Media | Columna eliminada (Fase 8); se calcula en consultas + CHECK de no negativos |
| 5 | Auditoría modificable o borrable | Alta | Triggers de inmutabilidad `UPDATE`/`DELETE` |
| 6 | Sin controles de rango en promedios, ciclos, créditos, puntajes, horas y aforos | Media | 7 restricciones CHECK |
| 7 | Índices ausentes para filtros y agregaciones del panel | Media | Índices en facultad, carrera, ciclo, categoría, periodo, modalidad, estado y auditoría |
| 8 | Índices redundantes en usuarios y tablas puente | Baja | 5 índices eliminados; 0 redundantes según `sys` |
| 9 | Collation del servidor `utf8mb4_0900_ai_ci` frente a tablas `utf8mb4_unicode_ci` | Alta | Collation explícita en parámetros de rutinas |
| 10 | Deriva de esquema por `spring.jpa.hibernate.ddl-auto=update` | Media | Documentada; script idempotente y recomendación de Flyway/`validate` |

### 5.1 Detalle del hallazgo de collation

El servidor MySQL 8 usa por defecto `utf8mb4_0900_ai_ci`, mientras que la base se creó con `utf8mb4_unicode_ci`. La conexión JDBC no fija `connectionCollation`, por lo que los parámetros de una rutina podían heredar `0900` y provocar:

```
ERROR 1267 (HY000): Illegal mix of collations
(utf8mb4_unicode_ci, IMPLICIT) and (utf8mb4_0900_ai_ci, IMPLICIT)
```

Se corrigió declarando los parámetros de texto de `fn_promedio_facultad`, `fn_carreras_por_facultad` y `sp_resolver_catalogo_academico` con `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`. Las funciones se probaron con la collation de conexión por defecto y devuelven los valores correctos.

### 5.2 Deriva de esquema

`tb_usuarios` contiene dos columnas que no están en `02_security_users_roles_audit.sql`:

- `avatar TEXT NULL`
- `ultima_conexion DATETIME(6) NULL`

Fueron añadidas por Hibernate con `ddl-auto=update`. No rompen la migración (el script 07 no las toca), pero confirman el riesgo de que el esquema real dependa del arranque de la aplicación. Recomendación: migrar a Flyway/Liquibase y usar `ddl-auto=validate` en producción.

---

## 6. Objetos programables creados

### 6.1 Funciones (8)

| Función | Retorno | Propósito | Resultado verificado |
| :--- | :--- | :--- | :--- |
| `fn_periodo_actual()` | `VARCHAR(20)` | Periodo vigente desde `tb_parametros` | `2026-I` |
| `fn_estudiantes_activos()` | `INT` | Estudiantes activos no eliminados | `6` |
| `fn_docentes_activos()` | `INT` | Docentes activos no eliminados | `5` |
| `fn_total_usuarios_activos()` | `INT` | Usuarios activos no eliminados | `3` |
| `fn_carga_horaria_docente(id)` | `INT` | Horas del docente en el periodo vigente | `10, 10, 7, 5, 4` |
| `fn_promedio_facultad(nombre)` | `DECIMAL(5,2)` | Promedio de estudiantes activos de la facultad | `16.02, 18.20, 15.30, 14.15` |
| `fn_estado_licenciamiento()` | `VARCHAR(50)` | Estado de la universidad activa | `LICENCIADA` |
| `fn_carreras_por_facultad(nombre)` | `INT` | Carreras activas de la facultad | `2, 1, 1, 1` |

### 6.2 Procedimientos (8)

| Procedimiento | Propósito |
| :--- | :--- |
| `sp_resolver_catalogo_academico(...)` | Resuelve o crea facultad/carrera y devuelve claves canónicas (disponible para scripts y mantenimiento; el alta desde la API la hace el backend) |
| `sp_resumen_institucional()` | Una fila con periodo, universidad, licenciamiento, sedes, estudiantes, docentes, usuarios, facultades, carreras y eventos |
| `sp_reporte_facultades()` | Estudiantes, carreras y promedio por facultad |
| `sp_reporte_carga_docente()` | Asignaciones y horas por docente en el periodo vigente |
| `sp_estudiantes_por_ciclo()` | Distribución de estudiantes activos por ciclo |
| `sp_verificar_integridad()` | Ejecuta los 11 controles de `vw_integridad_datos` |
| `sp_reporte_auditoria(dias)` | Actividad agrupada por fecha, módulo, acción y resultado |
| `sp_registrar_auditoria(...)` | Canal centralizado de inserción de eventos de auditoría |

### 6.3 Triggers (2 desde la Fase 8)

| Trigger | Tabla / evento | Regla |
| :--- | :--- | :--- |
| `trg_auditoria_no_update` | `tb_auditoria` / `BEFORE UPDATE` | Bloquea modificaciones (`SQLSTATE 45000`) |
| `trg_auditoria_no_delete` | `tb_auditoria` / `BEFORE DELETE` | Bloquea borrados (`SQLSTATE 45000`) |

Los seis triggers de sincronización de catálogo y de cálculo de horas se
retiraron en la Fase 8: esa lógica vive ahora en el backend y en las vistas.

### 6.4 Vistas (8)

| Vista | Contenido |
| :--- | :--- |
| `vw_panel_institucional` | Fila única de KPIs institucionales |
| `vw_catalogo_academico` | Facultades con número de carreras y estudiantes |
| `vw_estudiantes_por_facultad` | Carreras, estudiantes y promedio por facultad |
| `vw_docentes_por_categoria` | Docentes y horas asignadas por categoría |
| `vw_carga_docente` | Detalle de asignaciones y horas por docente |
| `vw_actividad_auditoria_diaria` | Eventos, éxitos, fallos y usuarios por día |
| `vw_matriz_permisos` | Permisos por rol y módulo |
| `vw_integridad_datos` | 11 controles de calidad con estado `OK`/`ALERTA` |

### 6.5 Índices

**Añadidos en tablas existentes (18):**

- `tb_estudiantes`: `idx_estudiantes_ciclo`, `idx_estudiantes_activo`, `idx_estudiantes_facultad_id`, `idx_estudiantes_carrera_id`
- `tb_docentes`: `idx_docentes_categoria`, `idx_docentes_activo`, `idx_docentes_facultad_id`
- `tb_estudiante_admisiones`: `idx_admisiones_periodo`, `idx_admisiones_modalidad`
- `tb_docente_asignaciones`: `idx_asignaciones_periodo`, `idx_asignaciones_docente_periodo`
- `tb_docente_especialidades`: `idx_especialidades_nivel`
- `tb_sedes`: `idx_sedes_tipo`, `idx_sedes_activo`
- `tb_auditoria`: `idx_auditoria_fecha_resultado`

> El índice compuesto `idx_asignaciones_docente_periodo(docente_id, periodo)` absorbe el antiguo índice de la FK `fk_asignaciones_docente`. Tras la Fase 8 se retiraron además `idx_estudiantes_facultad`, `idx_estudiantes_carrera` y `idx_docentes_facultad`, por lo que el total final es 59.

**Propios de los catálogos:** `uk_facultades_nombre`, `uk_carreras_nombre`, `idx_carreras_facultad`.

**Eliminados por redundantes (5):**

| Índice eliminado | Cubierto por |
| :--- | :--- |
| `tb_usuarios.idx_usuarios_email` | `uk_usuarios_email` |
| `tb_usuarios.idx_usuarios_username` | `uk_usuarios_username` |
| `tb_usuario_rol.idx_usuario_rol_usuario` | `uk_usuario_rol(usuario_id, rol_id)` |
| `tb_rol_permiso.idx_rol_permiso_rol` | `uk_rol_permiso(rol_id, permiso_id)` |
| `tb_auditoria.idx_auditoria_fecha_hora` | `idx_auditoria_fecha_resultado(fecha_hora, resultado)` |

Resultado final tras la Fase 8: **59 índices**, **0 redundantes** según `sys.schema_redundant_indexes`.

### 6.6 Restricciones CHECK añadidas (7)

| Constraint | Regla |
| :--- | :--- |
| `chk_estudiantes_promedio` | `promedio_ponderado BETWEEN 0 AND 20` |
| `chk_estudiantes_ciclo` | `ciclo_actual BETWEEN 1 AND 12` |
| `chk_estudiantes_creditos` | `creditos_aprobados >= 0` |
| `chk_asignaciones_horas` | Horas teóricas y prácticas no negativas (la suma se calcula en consultas) |
| `chk_admisiones_puntaje` | `puntaje` nulo o entre 0 y 20 |
| `chk_sedes_aforo` | `aforo` nulo o mayor que 0 |
| `chk_sedes_ambientes` | Pabellones y laboratorios nulos o no negativos |

Total de CHECK en la base: **21**.

---

## 7. Evidencias de ejecución

### 7.1 Aplicación idempotente

```powershell
docker cp database/07_db_functions_normalization.sql gestoracad_mysql:/tmp/07.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/07.sql'
```

El script 07 se ejecutó varias veces con **exit code 0**. La segunda ejecución no
duplica columnas, índices, FKs, CHECK ni catálogos, y recrea rutinas/vistas de
forma controlada.

La normalización de la Fase 8 se aplicó con `database/08_normalizacion_duplicaciones.sql`:

```powershell
docker cp database/08_normalizacion_duplicaciones.sql gestoracad_mysql:/tmp/08.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/08.sql'
```

También se ejecutó dos veces con **exit code 0**: la segunda pasada no recrea
columnas ni duplica la admisión de respaldo y reaplica vistas/funciones.

Los permisos del catálogo académico se aplicaron con
`database/09_catalogo_academico_permisos.sql`:

```powershell
docker cp database/09_catalogo_academico_permisos.sql gestoracad_mysql:/tmp/09.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/09.sql'
```

Se ejecutó dos veces con **exit code 0**; la segunda pasada mantuvo 8 permisos y
1 rol asignado por permiso, sin duplicar relaciones.

### 7.2 Conteo de objetos

```sql
SELECT
  (SELECT COUNT(DISTINCT table_name, index_name)
     FROM information_schema.statistics
    WHERE table_schema = 'gestoracad_db') AS indices,
  (SELECT COUNT(*) FROM information_schema.triggers
    WHERE trigger_schema = 'gestoracad_db') AS triggers,
  (SELECT COUNT(*) FROM information_schema.routines
    WHERE routine_schema = 'gestoracad_db') AS rutinas,
  (SELECT COUNT(*) FROM information_schema.views
    WHERE table_schema = 'gestoracad_db') AS vistas;
```

Resultado tras la Fase 8:

| indices | triggers | rutinas | vistas |
| ---: | ---: | ---: | ---: |
| 59 | 2 | 16 | 8 |

### 7.3 Vista de panel institucional

```sql
SELECT * FROM vw_panel_institucional;
```

| periodo | universidad | estado_licenciamiento | sedes_activas | estudiantes | docentes | usuarios | facultades | carreras | eventos_auditoria |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-I | UNINTEP | LICENCIADA | 3 | 6 | 5 | 3 | 4 | 5 | 13 |

### 7.4 Controles de integridad

```sql
SELECT * FROM vw_integridad_datos;
```

| Métrica | Valor | Esperado | Estado |
| :--- | ---: | ---: | :--- |
| `estudiantes_activos_sin_facultad` | 0 | 0 | OK |
| `estudiantes_activos_sin_carrera` | 0 | 0 | OK |
| `estudiantes_carrera_facultad_incoherente` | 0 | 0 | OK |
| `docentes_activos_sin_facultad` | 0 | 0 | OK |
| `docentes_facultad_incoherente` | 0 | 0 | OK |
| `asignaciones_horas_incoherentes` | 0 | 0 | OK |
| `usuarios_activos_sin_rol` | 0 | 0 | OK |
| `estudiantes_promedio_fuera_rango` | 0 | 0 | OK |
| `estudiantes_ciclo_fuera_rango` | 0 | 0 | OK |
| `admisiones_puntaje_fuera_rango` | 0 | 0 | OK |
| `parametros_requeridos_faltantes` | 0 | 0 | OK |

### 7.5 Funciones

```sql
SELECT f.nombre,
       fn_promedio_facultad(f.nombre)     AS promedio,
       fn_carreras_por_facultad(f.nombre) AS carreras
  FROM tb_facultades f;
```

| Facultad | Promedio | Carreras |
| :--- | ---: | ---: |
| Facultad de Ingeniería y Arquitectura | 16.02 | 2 |
| Facultad de Ciencias de la Salud | 18.20 | 1 |
| Facultad de Ciencias Económicas y Empresariales | 15.30 | 1 |
| Facultad de Derecho y Ciencias Políticas | 14.15 | 1 |

### 7.6 Verificación de la normalización (Fase 8)

**Columnas eliminadas:**

```sql
SELECT table_name, column_name
  FROM information_schema.columns
 WHERE table_schema = 'gestoracad_db'
   AND column_name IN ('facultad', 'carrera', 'periodo_ingreso',
                       'modalidad_ingreso', 'colegio_procedencia',
                       'horas_totales', 'ultimo_login');
-- 0 filas
```

**Contrato de la API preservado:**

```powershell
GET /api/v1/students      -> 6 estudiantes con career, faculty, entryPeriod,
                             admissionModality y highSchool
GET /api/v1/teachers      -> 5 docentes con faculty y weeklyLoad calculado
GET /api/v1/dashboard/summary -> 4 facultades, 5 carreras y distribuciones
```

**Resolución de catálogo:** se actualizó un estudiante vía `PUT` con los nombres
`Ingeniería de Sistemas e Informática` y `Facultad de Ingeniería y Arquitectura`.
El catálogo permaneció en 4 facultades y 5 carreras (sin duplicados) y el número
de admisiones se mantuvo en 6 (el ingreso se actualiza, no se duplica).

**Inmutabilidad de auditoría:** se conserva en la base viva.

```
ERROR 1644 (45000): tb_auditoria es inmutable: no se permite UPDATE
ERROR 1644 (45000): tb_auditoria es inmutable: no se permite DELETE
```

**Horas negativas:** la restricción `chk_asignaciones_horas` está activa y
rechaza valores negativos en `horas_teoricas` o `horas_practicas` (verificado en
`information_schema.table_constraints`).

**Borrado de usuario con `ON DELETE SET NULL`:** se creó un usuario temporal y un evento de auditoría asociado, se eliminó el usuario y el evento permaneció con `usuario_id = NULL`; la acción referencial no fue bloqueada por el trigger de inmutabilidad. El `ROLLBACK` revirtió ambas filas.

### 7.7 Regresión del dashboard

Tras reiniciar el backend con el nuevo esquema y los triggers activos:

| Verificación | Resultado |
| :--- | :--- |
| Backend | `Up (healthy)`, `Started AplicacionGestorAcademico` sin errores |
| `GET /api/v1/dashboard/summary` | HTTP 200 |
| Tamaño de respuesta | 1,92 KB |
| Periodo | `2026-I` |
| Estudiantes / docentes / usuarios | 6 / 5 / 3 |
| Facultades / carreras / sedes | 4 / 5 / 3 |
| PII en el payload | No |

### 7.8 Catálogo académico editable (Fase 9)

**Permisos y asignaciones:**

| Permiso | Módulo | Roles asignados |
| :--- | :--- | ---: |
| `FACULTAD_VIEW`, `FACULTAD_CREATE`, `FACULTAD_EDIT`, `FACULTAD_DELETE` | FACULTAD | 1 |
| `CARRERA_VIEW`, `CARRERA_CREATE`, `CARRERA_EDIT`, `CARRERA_DELETE` | CARRERA | 1 |

`tb_schema_version` registra `FASE_09` con estado `SUCCESS`.

**Verificación en vivo del CRUD:**

| Prueba | Resultado |
| :--- | :--- |
| `GET /api/v1/faculties` | HTTP 200 · 4 facultades con contadores |
| `GET /api/v1/careers` | HTTP 200 · 5 carreras con facultad y estudiantes |
| Alta de facultad/carrera temporal | HTTP 201 · IDs creados |
| Nombre duplicado | HTTP 400 · mensaje de negocio |
| Baja de facultad con carrera activa | HTTP 400 · bloqueo por dependencia |
| Cambio de facultad de una carrera | HTTP 200 · estudiantes sincronizados |
| Baja de carrera y facultades temporales | HTTP 200 · borrado lógico |
| Catálogo final tras limpiar pruebas | 4 facultades / 5 carreras |
| `GET /api/v1/dashboard/summary` | 4 / 5 / 6 / 5 sin cambios |

La limpieza de las filas temporales se hizo con `DELETE` físico solo sobre
`tb_carreras` y `tb_facultades` de prueba; no se alteraron los datos reales ni la
bitácora de auditoría.

---

## 8. Operación y mantenimiento

### 8.1 Instalaciones nuevas

Los scripts están montados en `docker-compose.yml` después de los scripts 01–06:

```yaml
- ./database/07_db_functions_normalization.sql:/docker-entrypoint-initdb.d/07_db_functions_normalization.sql:ro
- ./database/08_normalizacion_duplicaciones.sql:/docker-entrypoint-initdb.d/08_normalizacion_duplicaciones.sql:ro
- ./database/09_catalogo_academico_permisos.sql:/docker-entrypoint-initdb.d/09_catalogo_academico_permisos.sql:ro
```

MySQL lo ejecuta automáticamente al crear el volumen `gestoracad_mysql_data`.

### 8.2 Instalaciones existentes

```powershell
# Respaldo previo
docker exec gestoracad_mysql sh -c `
  'mysqldump -uroot -pgestor_root_pass_2026 --routines --triggers --single-transaction gestoracad_db > /tmp/gestoracad_pre07.sql'

# Copia y aplicación (preserva UTF-8; evita problemas de encoding de PowerShell)
docker cp database/07_db_functions_normalization.sql gestoracad_mysql:/tmp/07.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/07.sql'
```

### 8.3 Requisitos y privilegios

- Crear funciones, procedimientos y triggers requiere privilegios de DBA (`CREATE ROUTINE`, `TRIGGER`, `SUPER`/equivalentes). El script debe ejecutarse como `root` o un usuario administrador.
- El usuario de aplicación (`gestor_user`) conserva `EXECUTE` y `SELECT` sobre la base, por lo que puede invocar las rutinas y consultar las vistas.
- Las vistas y funciones usan `SQL SECURITY DEFINER` por defecto; su ejecución es consistente con el esquema.

### 8.4 Inmutabilidad de auditoría

Los triggers bloquean `UPDATE` y `DELETE`. Limitaciones y recomendaciones:

- `TRUNCATE TABLE tb_auditoria` **no dispara triggers**; debe restringirse por privilegios y auditoría externa.
- Para retención legal o purgas excepcionales, un DBA puede deshabilitar temporalmente el trigger con autorización y dejar registro del procedimiento.
- Para archivar, exportar a un almacenamiento inmutable antes de cualquier purga.

### 8.5 Catálogos y calidad futura

- Desde la Fase 9 el catálogo se administra con el CRUD del módulo Universidad
  (`/api/v1/faculties` y `/api/v1/careers`), que valida duplicados y aplica reglas
  de baja. Ya no existe el trigger que creaba facultades/carreras automáticamente:
  los nombres desconocidos se resuelven en el backend y el catálogo se mantiene
  explícitamente.
- Las columnas de texto `facultad`/`carrera` se eliminaron en la Fase 8; los nuevos reportes y servicios usan `facultad_id`/`carrera_id` y las vistas.

---

## 9. Pendientes y hoja de ruta

1. **Fase 7 oficial (Estructura Académica):** planes de estudio, cursos, periodos y matrícula; catálogos con códigos oficiales (facultad/carrera) y vigencias.
2. **Catálogos con códigos oficiales:** el CRUD de facultades/carreras ya existe
   (Fase 9); falta añadir códigos y vigencias para integrarlos con sistemas externos.
3. **Migraciones versionadas:** Flyway/Liquibase y `ddl-auto=validate` en producción para eliminar la deriva de Hibernate.
4. **Pruebas de objetos de BD en CI:** Testcontainers que ejecute 01–08 y valide funciones, triggers, vistas e integridad en cada build.
5. **Retención de auditoría:** particionamiento por fecha o exportación a almacenamiento inmutable, con política de retención aprobada.
6. **Restricciones de negocio adicionales:** unicidad de asignaciones por docente/periodo/curso/sección y catálogo de periodos académicos.
7. **Monitoreo:** alertas sobre `vw_integridad_datos` y sobre el crecimiento de `tb_auditoria`.

---

## 10. Conclusión

La base de datos cumple un nivel **3FN/BCNF** en su núcleo académico, con catálogos normalizados, claves foráneas y restricciones de dominio. La Fase 8 eliminó las columnas que duplicaban el catálogo o que se podían calcular, de modo que el contrato de texto de la API se resuelve en el backend (`ServicioCatalogoAcademico`) sin almacenar copias. Incorpora **8 funciones, 8 procedimientos, 2 triggers y 8 vistas**, además de **59 índices sin redundancias** y **21 restricciones CHECK**. Los 11 controles de integridad están en `OK`, la verificación de columnas eliminadas devolvió 0 filas, la regresión del dashboard fue exitosa y los scripts 07, 08 y 09 son idempotentes y están integrados en el arranque de Docker para instalaciones nuevas. La Fase 9 añade el mantenimiento del catálogo desde el módulo Universidad, con 8 permisos nuevos, reglas de baja y sincronización de la facultad de los estudiantes al reasignar una carrera.
