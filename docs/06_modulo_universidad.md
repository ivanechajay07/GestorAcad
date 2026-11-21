# Módulo Universidad (Fase 4)

Documentación técnica del módulo institucional que gestiona la **institución matriz**, sus **sedes/campus**, las **autoridades rectorales** y la **parametrización global** del Gestor Académico Virtual.

---

## 1. Alcance Funcional

| Submódulo | Descripción |
| :--- | :--- |
| **Institución matriz** | Datos oficiales de la universidad (nombre, sigla, lema, RUC, licenciamiento, acreditación, fundación, contacto). Se modela como catálogo con una única institución activa. |
| **Sedes y campus** | Sedes principales, campus y filiales, con ubicación, aforo, pabellones y laboratorios. Código único. |
| **Autoridades** | Rector, vicerrectores y demás autoridades de gobierno, con cargo, grado académico, despacho, periodo y resolución de nombramiento. |
| **Parametrización global** | Parámetros de configuración del sistema (`clave`, `valor`, `tipo_valor`, `modulo`). Clave única. |

Las entidades de sedes y autoridades dependen de la institución matriz (FK `universidad_id`). Todas heredan de `BaseEntity` (auditoría `created_at/updated_at/created_by/updated_by`, `deleted_at`, `is_active`).

---

## 2. Modelo de Datos

| Tabla | Entidad JPA | Clave de negocio |
| :--- | :--- | :--- |
| `tb_universidad` | `University` | `ruc` (única) |
| `tb_sedes` | `Campus` | `codigo` (único) |
| `tb_autoridades` | `Authority` | — |
| `tb_parametros` | `SystemParameter` | `clave` (única) |

Migración: `database/04_university_module.sql` (incluye `SET NAMES utf8mb4;` para preservar acentos). El borrado es **lógico** (`deleted_at` + `is_active = 0`).

---

## 3. Permisos (`MODULO_ACCION`)

| Módulo | Permisos |
| :--- | :--- |
| `UNIVERSIDAD` | `UNIVERSIDAD_VIEW`, `UNIVERSIDAD_EDIT`, `UNIVERSIDAD_EXPORT` |
| `SEDE` | `SEDE_VIEW`, `SEDE_CREATE`, `SEDE_EDIT`, `SEDE_DELETE`, `SEDE_EXPORT` |
| `AUTORIDAD` | `AUTORIDAD_VIEW`, `AUTORIDAD_CREATE`, `AUTORIDAD_EDIT`, `AUTORIDAD_DELETE`, `AUTORIDAD_EXPORT` |
| `PARAMETRO` | `PARAMETRO_VIEW`, `PARAMETRO_EDIT` |

Los 15 permisos se asignan a `ROLE_UNIVERSIDAD`. La autorización se aplica con `@PreAuthorize("hasAuthority('...')")` en el backend y con `hasPermission(...)` para filtrar menú y acciones en el frontend.

---

## 4. API REST

Base: `/api/v1`. Todas las respuestas usan `ApiResponseDto<T>` (`success`, `message`, `data`, `timestamp`).

### Institución — `/university`

| Método | Ruta | Permiso | Descripción |
| :--- | :--- | :--- | :--- |
| GET | `/university` | `UNIVERSIDAD_VIEW` | Lista de instituciones |
| GET | `/university/active` | `UNIVERSIDAD_VIEW` | Institución activa |
| GET | `/university/{id}` | `UNIVERSIDAD_VIEW` | Detalle por ID |
| POST | `/university` | `UNIVERSIDAD_EDIT` | Registrar institución (RUC único) |
| PUT | `/university/{id}` | `UNIVERSIDAD_EDIT` | Actualizar institución |
| PATCH | `/university/{id}/status?active=` | `UNIVERSIDAD_EDIT` | Habilitar/deshabilitar |

### Sedes — `/campuses`

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/campuses`, `/campuses/{id}`, `/campuses/university/{universityId}` | `SEDE_VIEW` |
| POST | `/campuses` | `SEDE_CREATE` |
| PUT | `/campuses/{id}` | `SEDE_EDIT` |
| DELETE | `/campuses/{id}` | `SEDE_DELETE` |

### Autoridades — `/authorities`

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/authorities`, `/authorities/{id}`, `/authorities/university/{universityId}` | `AUTORIDAD_VIEW` |
| POST | `/authorities` | `AUTORIDAD_CREATE` |
| PUT | `/authorities/{id}` | `AUTORIDAD_EDIT` |
| DELETE | `/authorities/{id}` | `AUTORIDAD_DELETE` |

### Parámetros — `/parameters`

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/parameters`, `/parameters/{key}` | `PARAMETRO_VIEW` |
| POST | `/parameters` | `PARAMETRO_EDIT` |
| PUT | `/parameters/{id}` | `PARAMETRO_EDIT` |
| DELETE | `/parameters/{id}` | `PARAMETRO_EDIT` |

---

## 5. Auditoría

Cada operación de escritura invoca `AuditService.log(...)` con usuario responsable (`SecurityUtils.getCurrentUsername()`), acción (`CREATE`/`UPDATE`/`DELETE`), módulo, descripción, endpoint, método HTTP, IP, user-agent, resultado (`SUCCESS`/`FAILURE`), entidad (`tb_universidad`, `tb_sedes`, `tb_autoridades`, `tb_parametros`) e ID afectado. Los intentos con RUC o código/clave duplicados se registran como `FAILURE` antes de lanzar `ApiException` (HTTP 400).

---

## 6. Frontend

`frontend/src/pages/UniversityPage.tsx` consume `universityService.ts` mediante el cliente Axios con token JWT. Organiza la información en cuatro pestañas: **Información General** (formulario institucional), **Sedes & Campus**, **Gobierno Universitario** y **Parametrización Global**. Los botones de creación/edición/desactivación se muestran solo si el usuario posee el permiso correspondiente. La pestaña de parámetros solo se renderiza con `PARAMETRO_VIEW`. El acceso al módulo se controla desde `Sidebar.tsx` con `UNIVERSIDAD_VIEW` y la ruta exige el mismo permiso.

Los parámetros validan su tipo (`STRING`, `NUMBER`, `BOOLEAN`, `DATE`) y las claves obligatorias (`PERIODO_ACADEMICO_ACTUAL`, `NOTA_MINIMA_APROBATORIA`, `MAX_CREDITOS_POR_PERIODO`) no pueden renombrarse ni desactivarse.

---

## 7. Datos Semilla

- **Institución:** UNINTEP (RUC `20548763921`, estado `LICENCIADA`).
- **Sedes:** `SEDE-CENTRAL`, `CAMPUS-SALUD`, `FILIAL-NORTE`.
- **Autoridades:** Rector, Vicerrectora Académica, Vicerrector de Investigación.
- **Parámetros:** periodo académico, nota mínima aprobatoria, máximo de créditos, matrícula extemporánea, moneda institucional, zona horaria.

Versión de esquema registrada: `FASE_04` en `tb_schema_version`.
