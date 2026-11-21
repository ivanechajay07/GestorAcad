# Auditoría de duplicaciones y normalización de la base de datos

**Fecha:** 2026-10-28
**Base:** `gestoracad_db` (MySQL 8.0, InnoDB, `utf8mb4_unicode_ci`)
**Alcance:** 18 tablas y 8 vistas de `gestoracad_db`, con datos reales del entorno Docker.
**Modo:** auditoría en solo lectura; la normalización posterior se aplicó el mismo día y está documentada en la sección 6.

---

## 1. Resumen ejecutivo

| Verificación | Resultado |
| :--- | :--- |
| Tablas duplicadas o con el mismo propósito | **0** |
| Filas duplicadas en catálogos (`facultades`, `carreras`, `roles`, `permisos`, `parámetros`) | **0** |
| Duplicados en tablas puente (`tb_usuario_rol`, `tb_rol_permiso`) | **0** (protegidas por `uk_usuario_rol` y `uk_rol_permiso`) |
| Índices redundantes (`sys.schema_redundant_indexes`) | **0** |
| Claves foráneas huérfanas | **0** en las 14 FK |
| Controles de `vw_integridad_datos` | **11/11 en `OK`** |
| Restricciones `CHECK` | **21**, todas activas |
| Índices totales | **66**, sin redundancias detectadas |
| Duplicación **a nivel de esquema** | **4 patrones** (columnas derivadas o de compatibilidad) |

**Conclusión:** no hay corrupción ni duplicación de datos. La deuda está en el
**modelo**: cuatro grupos de columnas guardan información que ya existe en otra
tabla o que se puede calcular. La normalización es posible, pero dos de los cuatro
grupos afectan el contrato de la API y requieren migración coordinada.

---

## 2. Hallazgos

### H-01 · `facultad`/`carrera` de texto junto a `facultad_id`/`carrera_id` — Severidad **alta**

| Tabla | Columnas de texto | Columnas normales |
| :--- | :--- | :--- |
| `tb_estudiantes` | `facultad`, `carrera` | `facultad_id`, `carrera_id` |
| `tb_docentes` | `facultad` | `facultad_id` |

- **Estado de datos:** 0 incoherencias entre texto y catálogo; 0 registros con ID
  nulo y texto presente.
- **Origen:** compatibilidad temporal con la API de las fases 2–6. El script
  `07_db_functions_normalization.sql` mantiene el texto sincronizado con triggers
  (`trg_estudiantes_catalogo_bi/bu`, `trg_docentes_catalogo_bi/bu`).
- **Por qué es duplicación:** el nombre de la facultad/carrera vive en
  `tb_facultades.nombre` / `tb_carreras.nombre`. Guardarlo otra vez en el padrón
  viola 3FN y permite divergencias si un trigger falla o se desactiva.
- **Dependencias:** entidades `Estudiante` y `Docente`, DTOs, mapeadores,
  `RepositorioEstudiante` (agregados del dashboard), `RepositorioDocente`,
  `vw_estudiantes_por_facultad`, `vw_carga_docente`, `fn_carreras_por_facultad`,
  formularios de Estudiantes y Docentes.
- **Deuda ya declarada:** `docs/11_auditoria_base_datos.md` la documenta como
  cambio para una versión mayor.

### H-02 · Datos de ingreso duplicados en `tb_estudiantes` y `tb_estudiante_admisiones` — Severidad **media**

| `tb_estudiantes` | `tb_estudiante_admisiones` |
| :--- | :--- |
| `periodo_ingreso` | `periodo` |
| `modalidad_ingreso` | `modalidad` |
| `colegio_procedencia` | `colegio_procedencia` |

- **Estado de datos:** 6 estudiantes y 6 admisiones; los tres campos coinciden al
  100 % en todos los registros.
- **Por qué es duplicación:** el hecho histórico del ingreso pertenece a la
  admisión. Un estudiante puede tener varias admisiones (traslados, segunda
  carrera) y el campo del padrón solo conserva una copia arbitraria.
- **Dependencias:** `Estudiante.entryPeriod/admissionModality/highSchool`,
  `MapeadorEstudiante`, `DtoEstudiante`, `ServicioEstudianteImpl`.

### H-03 · `tb_docente_asignaciones.horas_totales` derivada — Severidad **media**

- **Fórmula:** `horas_totales = horas_teoricas + horas_practicas`.
- **Estado de datos:** 0 filas incoherentes.
- **Mantenimiento:** triggers `trg_asignaciones_horas_bi/bu` y
  `chk_asignaciones_horas`.
- **Por qué es duplicación:** es una columna calculada almacenada; puede
  desincronizarse si se carga por `LOAD DATA` o se deshabilitan los triggers.
- **Dependencias:** `AsignacionDocente.totalHours`, `vw_carga_docente`,
  `vw_docentes_por_categoria`, `fn_carga_horaria_docente`.

### H-04 · `tb_usuarios.ultimo_login` y `tb_usuarios.ultima_conexion` — Severidad **media**

- **Estado de datos:** en el login se escriben ambas con el mismo instante
  (`ServicioAutenticacionImpl`, líneas 96–97). `ultima_conexion` se actualiza
  además al renovar el token.
- **Uso real:** el frontend solo consume `lastSeen` (columna `ultima_conexion`)
  para mostrar «En línea / Desconectado». `ultimo_login` viaja en el DTO pero no
  se usa en la interfaz.
- **Por qué es duplicación:** dos columnas para el mismo hecho, con distinta
  precisión (`timestamp` vs `datetime(6)`).

### H-05 · Correo repetido entre padrón y cuenta — Severidad **baja**, no se elimina

- `lucia.vega@gestoracad.edu` aparece en `tb_estudiantes` y en `tb_usuarios`.
- **No es duplicación de esquema:** son dos entidades distintas (persona y cuenta
  de acceso). Unificarlas exigiría un modelo de identidad único, fuera del
  alcance de esta fase. Se deja documentado.

### H-06 · `tb_auditoria.username` junto a `usuario_id` — Severidad **baja**, intencional

- La bitácora guarda el identificador y el nombre de usuario del momento del
  evento. Es una **instantánea histórica** deliberada: si el usuario cambia de
  nombre o se elimina, la auditoría debe conservar el valor original. No se toca.

---

## 3. Lo que **no** se encontró

- No hay tablas con el mismo contenido ni vistas que dupliquen tablas completas.
- No hay filas repetidas en catálogos ni en tablas puente.
- No hay índices redundantes ni sin uso evidente.
- No hay FK huérfanas ni registros activos sin rol, facultad o carrera.
- No hay parámetros requeridos faltantes.
- Los 11 controles de `vw_integridad_datos` están en `OK`.

---

## 4. Plan de normalización propuesto

### Opción A · Normalización completa (recomendada)

Elimina las cuatro duplicaciones y adapta la aplicación manteniendo el contrato
de la API (el frontend sigue enviando y recibiendo nombres; el backend resuelve
los IDs).

1. **Respaldo** `mysqldump` completo antes de cualquier cambio.
2. **Backfill**: completar admisiones faltantes desde `tb_estudiantes` y
   verificar que todo texto tenga su ID.
3. **Esquema** (script `08_normalizacion_duplicaciones.sql`, idempotente):
   - Eliminar `tb_estudiantes.facultad`, `carrera`, `periodo_ingreso`,
     `modalidad_ingreso`, `colegio_procedencia` y sus índices.
   - Eliminar `tb_docentes.facultad` y su índice.
   - Eliminar `tb_docente_asignaciones.horas_totales` y `chk_asignaciones_horas`.
   - Eliminar `tb_usuarios.ultimo_login`.
   - Retirar los triggers de sincronización y de horas.
   - Actualizar vistas y funciones para usar joins y sumas.
4. **Backend**:
   - Entidades `Facultad` y `Carrera`; `@ManyToOne` desde `Estudiante`/`Docente`.
   - Servicios resuelven nombre → catálogo al crear/editar (crea el catálogo si
     no existe, como hacía el trigger).
   - `DtoEstudiante` conserva `entryPeriod/admissionModality/highSchool`, pero se
     leen de la admisión más antigua.
   - `AsignacionDocente` calcula `totalHours` en el servicio y en las vistas.
   - Retirar `lastLogin` de entidad, DTO, mapeador y tipo del frontend.
5. **Pruebas**: actualizar fixtures de dashboard/estudiantes/docentes, añadir
   pruebas de resolución de catálogo y ejecutar `mvn verify` + `npm test`.
6. **Verificación en vivo**: reconstruir backend, comprobar `/api/v1/students`,
   `/api/v1/teachers`, `/api/v1/dashboard/summary` y `vw_integridad_datos`.

**Riesgo:** medio-alto por el número de archivos y por ser un cambio de esquema
irreversible sin el respaldo. **Beneficio:** modelo 3FN/BCNF real, sin columnas
derivadas ni texto replicado.

### Opción B · Limpieza conservadora (rápida)

Aplica solo H-02, H-03 y H-04; conserva `facultad`/`carrera` de texto y sus
triggers. Menos archivos tocados, pero la duplicación principal (H-01) permanece.

### Opción C · Solo informe

No se modifica nada; queda este documento como evidencia y el script 07 sigue
siendo la fuente del esquema.

---

## 5. Consultas de verificación usadas

```sql
-- Índices redundantes
SELECT * FROM sys.schema_redundant_indexes WHERE table_schema = 'gestoracad_db';

-- Duplicados en tablas puente
SELECT rol_id, permiso_id FROM tb_rol_permiso
 GROUP BY rol_id, permiso_id HAVING COUNT(*) > 1;

-- Coherencia texto ↔ catálogo
SELECT COUNT(*) FROM tb_estudiantes e
  LEFT JOIN tb_facultades f ON f.id = e.facultad_id
 WHERE e.facultad_id IS NOT NULL AND (f.id IS NULL OR f.nombre <> e.facultad);

-- Columnas derivadas
SELECT COUNT(*) FROM tb_docente_asignaciones
 WHERE horas_totales <> horas_teoricas + horas_practicas;

-- Controles de calidad
SELECT * FROM vw_integridad_datos;
```

---

## 6. Resultado de la aplicación

**Estado:** Opción A aplicada el 2026-10-28 sobre `gestoracad_db`.

| Acción | Resultado |
| :--- | :--- |
| Respaldo previo | `backups/gestoracad_pre_normalizacion_20261028.sql` (123.768 bytes) |
| Migración | `database/08_normalizacion_duplicaciones.sql`, ejecutada dos veces con exit code 0 |
| Columnas eliminadas | `tb_estudiantes.{facultad, carrera, periodo_ingreso, modalidad_ingreso, colegio_procedencia}`, `tb_docentes.facultad`, `tb_docente_asignaciones.horas_totales`, `tb_usuarios.ultimo_login` |
| Triggers retirados | 6 (catálogo en estudiantes/docentes y horas en asignaciones) |
| Triggers conservados | `trg_auditoria_no_update`, `trg_auditoria_no_delete` |
| Backend | Entidades `Facultad`/`Carrera`, `ServicioCatalogoAcademico`, admisión más antigua y carga semanal derivada |
| Pruebas | 126 backend (`mvn test`, BUILD SUCCESS) y 64 frontend (Vitest) en la Fase 8; 178/90 tras el catálogo editable, login, estructura académica 7.1–7.3 y evaluación 8.1 |
| Contrato API | `/students`, `/teachers` y `/dashboard/summary` verificados en vivo |
| Integridad | 11/11 controles en `OK`; 21 CHECK; 0 duplicados de catálogo tras un `PUT` |
| Objetos | 8 funciones, 8 procedimientos, 2 triggers, 8 vistas, 59 índices |

La API sigue enviando y recibiendo nombres de facultad y carrera; el backend los
resuelve contra el catálogo y persiste solo las claves foráneas. Los datos de
ingreso se leen de la admisión más antigua y la carga horaria se calcula en cada
consulta.

---

## 7. Conclusión

La base **no necesitaba una reconstrucción**: los datos estaban íntegros y no
había duplicados de filas ni índices redundantes. La normalización eliminó las
columnas que replicaban el catálogo o que se podían calcular, y dejó el modelo en
3FN/BCNF sin romper el contrato de la API ni el historial de admisiones.
