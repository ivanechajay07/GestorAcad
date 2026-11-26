# Gestor Académico Virtual - Directrices de Base de Datos (DBA)

## 1. Motor y Parámetros
- **Motor:** MySQL 8.0+ / MySQL 8.4 LTS
- **Charset:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`
- **Storage Engine:** InnoDB (con soporte transaccional ACID estricto)

## 2. Convenciones de Diseño y Nomenclatura
- **Tablas:** Minúsculas con prefijo descriptivo `tb_` y en plural o sustantivo descriptivo (ej. `tb_usuarios`, `tb_roles`, `tb_auditoria`).
- **Claves Primarias:** `id` tipo `BIGINT AUTO_INCREMENT`.
- **Claves Foráneas:** `<entidad>_id` con nombres explícitos de restricción `fk_<origen>_<destino>`.
- **Restricciones UNIQUE:** Con prefijo `uk_<tabla>_<columnas>`.
- **Restricciones CHECK:** Con prefijo `chk_<tabla>_<regla>`.
- **Índices:** Con prefijo `idx_<tabla>_<columnas>`.
- **Nombres de columnas:** Formato `snake_case`.

## 3. Principio de Normalización (3FN Obligatorio)
1. **1FN (Primera Forma Normal):**
   - Atomicidad de datos: Ningún campo almacena listas separadas por comas ni múltiples valores.
2. **2FN (Segunda Forma Normal):**
   - Cumple 1FN y cada atributo no clave tiene dependencia funcional completa de la clave primaria.
3. **3FN (Tercera Forma Normal):**
   - Cumple 2FN y no existen dependencias transitivas entre atributos no clave.
   - Las relaciones N:M se implementan mediante tablas asociativas intermedias (`tb_usuario_rol`, `tb_rol_permiso`).

## 4. Esquema Implementado en Fase 2

### 4.1. `tb_roles`
- `id` BIGINT AUTO_INCREMENT PK
- `nombre` VARCHAR(50) NOT NULL UNIQUE
- `descripcion` VARCHAR(255) NOT NULL
- Auditoría estándar (`created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, `is_active`)

### 4.2. `tb_permisos`
- `id` BIGINT AUTO_INCREMENT PK
- `nombre` VARCHAR(100) NOT NULL UNIQUE
- `modulo` VARCHAR(50) NOT NULL
- `descripcion` VARCHAR(255) NOT NULL
- Auditoría estándar

### 4.3. `tb_usuarios`
- `id` BIGINT AUTO_INCREMENT PK
- `username` VARCHAR(50) NOT NULL UNIQUE
- `email` VARCHAR(100) NOT NULL UNIQUE
- `password_hash` VARCHAR(255) NOT NULL (Hash BCrypt de 60 caracteres)
- `nombre` VARCHAR(100) NOT NULL
- `apellido` VARCHAR(100) NOT NULL
- `telefono` VARCHAR(25) NULL
- `departamento` VARCHAR(100) NULL
- `cuenta_bloqueada` BOOLEAN NOT NULL DEFAULT FALSE
- `cuenta_expirada` BOOLEAN NOT NULL DEFAULT FALSE
- `credenciales_expiradas` BOOLEAN NOT NULL DEFAULT FALSE
- `ultima_conexion` DATETIME(6) NULL (último acceso o actividad; reemplaza a `ultimo_login` desde la Fase 8)
- Auditoría estándar

### 4.4. `tb_usuario_rol` (Intermedia 3FN)
- `id` BIGINT AUTO_INCREMENT PK
- `usuario_id` BIGINT NOT NULL (FK -> `tb_usuarios.id` ON DELETE CASCADE)
- `rol_id` BIGINT NOT NULL (FK -> `tb_roles.id` ON DELETE RESTRICT)
- `asignado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- `asignado_por` VARCHAR(100) NOT NULL DEFAULT 'SISTEMA'
- UNIQUE KEY `uk_usuario_rol` (`usuario_id`, `rol_id`)

### 4.5. `tb_rol_permiso` (Intermedia 3FN)
- `id` BIGINT AUTO_INCREMENT PK
- `rol_id` BIGINT NOT NULL (FK -> `tb_roles.id` ON DELETE CASCADE)
- `permiso_id` BIGINT NOT NULL (FK -> `tb_permisos.id` ON DELETE RESTRICT)
- `asignado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- UNIQUE KEY `uk_rol_permiso` (`rol_id`, `permiso_id`)

### 4.6. `tb_auditoria`
- `id` BIGINT AUTO_INCREMENT PK
- `usuario_id` BIGINT NULL (FK -> `tb_usuarios.id` ON DELETE SET NULL)
- `username` VARCHAR(100) NOT NULL
- `accion` VARCHAR(20) CHECK ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT')
- `modulo` VARCHAR(50) NOT NULL
- `descripcion` TEXT NOT NULL
- `endpoint` VARCHAR(255) NOT NULL
- `metodo_http` VARCHAR(10) NOT NULL
- `ip_origen` VARCHAR(45) NULL
- `resultado` CHECK ('SUCCESS', 'FAILURE')
- `fecha_hora` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- Índices de alto rendimiento en `fecha_hora`, `usuario_id`, `modulo`, `accion`.

### 4.7. `tb_schema_version`
Control de migraciones y versiones del esquema ejecutadas por el DBA.

---

## 5. Catálogos normalizados (Fase 7)

### 5.1. `tb_facultades`
- `id` BIGINT AUTO_INCREMENT PK
- `nombre` VARCHAR(200) NOT NULL UNIQUE
- Auditoría estándar y `is_active`

### 5.2. `tb_carreras`
- `id` BIGINT AUTO_INCREMENT PK
- `facultad_id` BIGINT NOT NULL (FK -> `tb_facultades.id` ON DELETE RESTRICT)
- `nombre` VARCHAR(200) NOT NULL UNIQUE
- Auditoría estándar y `is_active`
- Índice `idx_carreras_facultad`

### 5.3. Integridad referencial académica
- `tb_estudiantes.facultad_id` FK -> `tb_facultades.id`
- `tb_estudiantes.carrera_id` FK -> `tb_carreras.id`
- `tb_docentes.facultad_id` FK -> `tb_facultades.id`

Las columnas de texto `facultad` y `carrera` **se eliminaron en la Fase 8**. La API
sigue enviando y recibiendo nombres, pero el backend
(`ServicioCatalogoAcademico`) los traduce a `facultad_id`/`carrera_id` y registra
el nombre en el catálogo si aún no existe.

### 5.4. Normalización de la Fase 8

- `tb_estudiantes` ya no guarda `periodo_ingreso`, `modalidad_ingreso` ni
  `colegio_procedencia`: el hecho histórico vive en `tb_estudiante_admisiones`.
- `tb_docente_asignaciones` ya no guarda `horas_totales`: la carga se calcula como
  `horas_teoricas + horas_practicas`.
- `tb_usuarios` ya no guarda `ultimo_login`: `ultima_conexion` es el último acceso.
- Se retiraron los seis triggers de sincronización de catálogo y de horas.

### 5.5. Catálogo académico editable (Fase 9)

El módulo Universidad expone el mantenimiento del catálogo sin romper el contrato
de la API, que sigue trabajando con nombres:

| Recurso | Endpoints | Permisos |
| :--- | :--- | :--- |
| Facultades | `GET/POST /api/v1/faculties`, `GET/PUT/DELETE /api/v1/faculties/{id}` | `FACULTAD_VIEW/CREATE/EDIT/DELETE` |
| Carreras | `GET/POST /api/v1/careers`, `GET/PUT/DELETE /api/v1/careers/{id}`, `GET /api/v1/careers/faculty/{facultyId}` | `CARRERA_VIEW/CREATE/EDIT/DELETE` |

Reglas de integridad aplicadas en el servicio:

- Una facultad no se desactiva si tiene carreras, estudiantes o docentes activos.
- Una carrera no se desactiva si tiene estudiantes activos.
- Si una carrera cambia de facultad, `tb_estudiantes.facultad_id` se sincroniza en
  la misma transacción para conservar la coherencia de la jerarquía.
- Los listados incluyen contadores (`careerCount`, `studentCount`, `teacherCount`)
  calculados con consultas agregadas, no con datos derivados almacenados.

Los permisos se crean y asignan con `database/09_catalogo_academico_permisos.sql`
a `ROLE_UNIVERSIDAD` y a los roles que ya administran sedes.

### 5.6. Estructura académica (Fase 7.1)

Primer incremento del módulo `/academic`:

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_periodos_academicos` | Código, nombre, fechas de clases y matrícula, periodo vigente | Código único; fin ≥ inicio; solo un vigente |
| `tb_cursos` | Código, nombre, créditos, horas teóricas/prácticas y tipo | Código único; créditos 1-30; horas 0-40 y suma > 0 |

Permisos `PERIODO_VIEW/CREATE/EDIT/DELETE` y `CURSO_VIEW/CREATE/EDIT/DELETE`
asignados a `ROLE_UNIVERSIDAD`. La migración `10_estructura_academica.sql` es
idempotente e incluye dos periodos y cuatro cursos de ejemplo.

Reglas adicionales:

- El primer periodo activo se marca como vigente.
- Al activar otro periodo se desmarca el anterior y se actualiza el parámetro
  `PERIODO_ACADEMICO_ACTUAL`, consumido por el Dashboard y las notificaciones.
- No se puede desactivar el periodo vigente.
- Las horas totales de un curso se calculan (`teoría + práctica`), no se almacenan.

### 5.7. Planes, secciones y matrícula (Fase 7.2)

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_planes_estudio` | Carrera, código, nombre, año | Código único; FK a carrera |
| `tb_plan_cursos` | Plan, curso, ciclo, obligatoriedad | Único curso por plan; ciclo 1-20 |
| `tb_secciones` | Periodo, curso, docente, código, capacidad, turno, aula, horario | Código único por periodo/curso; capacidad 1-200 |
| `tb_matriculas` | Estudiante, sección, fecha, estado | Única por estudiante/sección; `MATRICULADO`/`RETIRADO` |

Permisos `PLAN_*`, `SECCION_*` y `MATRICULA_*` (12 nuevos), asignados a
`ROLE_UNIVERSIDAD`. Reglas: cupo, créditos máximos del periodo, duplicidad de
curso y ventana de matrícula con opción extemporánea.

La migración `11_estructura_academica_72.sql` es idempotente y añade 2 planes,
5 cursos de malla y 2 secciones de ejemplo. Los scripts 10 y 11 deben ejecutarse
en ese orden sobre instalaciones existentes.

### 5.8. Prerrequisitos y horarios (Fase 7.3)

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_curso_prerrequisitos` | Curso y prerrequisito | Único por par; sin auto-prerrequisito ni ciclo directo |
| `tb_seccion_horarios` | Sección, día, inicio, fin y aula | Fin > inicio; sin choques de sección, docente o aula |

La migración `12_estructura_academica_73.sql` es idempotente y siembra el
prerrequisito `SIS-201 ← MAT-101` y los horarios de las dos secciones de ejemplo.

### 5.9. Evaluación académica (Fase 8.1)

| Tabla | Contenido | Reglas |
| :--- | :--- | :--- |
| `tb_evaluaciones` | Sección, nombre, tipo, peso, fecha y nota máxima | Peso 0-100; nota máxima 0-20; nombre único por sección |
| `tb_calificaciones` | Evaluación, estudiante y nota | Única por evaluación/estudiante; nota 0-20 |
| `tb_asistencias` | Sección, estudiante, fecha y estado | Única por sección/estudiante/fecha |
| `tb_actas` | Sección, estado y cierre | Única por sección; `ABIERTA`/`CERRADA` |
| `tb_actas_detalle` | Estudiante, promedio, aprobación y créditos | Único por acta/estudiante |

La migración `13_evaluacion_academica.sql` añade 8 permisos
`EVALUACION/NOTA/ASISTENCIA/ACTA` y las tablas del ciclo de evaluación.

### 5.10. Portales de estudiante y docente (Fase 8.2)

- `tb_docentes.usuario_id` y `tb_estudiantes.usuario_id` (nullable, único, FK a `tb_usuarios`).
- Vínculos iniciales resueltos por correo institucional.
- Los portales consultan únicamente la ficha asociada a la cuenta autenticada.

La migración `14_portales_estudiante_docente.sql` es idempotente y añade los
vínculos necesarios.

---

## 6. Objetos programables

- **Funciones:** `fn_periodo_actual`, `fn_estudiantes_activos`,
  `fn_docentes_activos`, `fn_total_usuarios_activos`,
  `fn_carga_horaria_docente`, `fn_promedio_facultad`,
  `fn_estado_licenciamiento`, `fn_carreras_por_facultad`.
- **Procedimientos:** `sp_resolver_catalogo_academico`,
  `sp_resumen_institucional`, `sp_reporte_facultades`,
  `sp_reporte_carga_docente`, `sp_estudiantes_por_ciclo`,
  `sp_verificar_integridad`, `sp_reporte_auditoria`,
  `sp_registrar_auditoria`.
- **Triggers:** solo inmutabilidad de `tb_auditoria` (`UPDATE`/`DELETE`
  bloqueados). Los triggers de catálogo y de horas se retiraron en la Fase 8.
- **Vistas:** `vw_panel_institucional`, `vw_catalogo_academico`,
  `vw_estudiantes_por_facultad`, `vw_docentes_por_categoria`,
  `vw_carga_docente`, `vw_actividad_auditoria_diaria`,
  `vw_matriz_permisos`, `vw_integridad_datos`.

Detalle, evidencias y hallazgos: `docs/11_auditoria_base_datos.md`.

---

## 7. Operación de los scripts 07 a 14

`database/07_db_functions_normalization.sql`,
`database/08_normalizacion_duplicaciones.sql`,
`database/09_catalogo_academico_permisos.sql`,
`database/10_estructura_academica.sql`,
`database/11_estructura_academica_72.sql`,
`database/12_estructura_academica_73.sql`,
`database/13_evaluacion_academica.sql` y
`database/14_portales_estudiante_docente.sql` son **idempotentes** y se ejecutan
automáticamente en instalaciones nuevas (montados en `docker-compose.yml` después
de los scripts 01–06). Para una base existente:

```powershell
docker cp database/07_db_functions_normalization.sql gestoracad_mysql:/tmp/07.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/07.sql'

docker cp database/08_normalizacion_duplicaciones.sql gestoracad_mysql:/tmp/08.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/08.sql'

docker cp database/09_catalogo_academico_permisos.sql gestoracad_mysql:/tmp/09.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/09.sql'

docker cp database/10_estructura_academica.sql gestoracad_mysql:/tmp/10.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/10.sql'

docker cp database/11_estructura_academica_72.sql gestoracad_mysql:/tmp/11.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/11.sql'

docker cp database/12_estructura_academica_73.sql gestoracad_mysql:/tmp/12.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/12.sql'

docker cp database/13_evaluacion_academica.sql gestoracad_mysql:/tmp/13.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/13.sql'

docker cp database/14_portales_estudiante_docente.sql gestoracad_mysql:/tmp/14.sql
docker exec gestoracad_mysql sh -c `
  'mysql -uroot -pgestor_root_pass_2026 --default-character-set=utf8mb4 gestoracad_db < /tmp/14.sql'
```

> **Collation:** el servidor MySQL 8 usa `utf8mb4_0900_ai_ci` por defecto, mientras
> que la base usa `utf8mb4_unicode_ci`. Los parámetros de texto de las rutinas
> declaran explícitamente `COLLATE utf8mb4_unicode_ci` para evitar el error 1267.
