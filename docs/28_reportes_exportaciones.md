# Reportes y exportaciones auditadas

**Fecha:** 22/11/2026  
**Alcance:** primera entrega de la fase de reportes — exportación CSV compatible con Excel para los listados institucionales.

---

## 1. Endpoints

| Método | Ruta | Permiso | Contenido |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/students` | `ESTUDIANTE_EXPORT` | Padrón estudiantil |
| `GET` | `/api/v1/reports/teachers` | `DOCENTE_EXPORT` | Padrón docente y carga horaria |
| `GET` | `/api/v1/reports/users` | `USUARIO_EXPORT` | Directorio de usuarios y roles |

Todos devuelven `text/csv; charset=UTF-8` con `Content-Disposition: attachment` y un nombre fechado, por ejemplo `estudiantes_20261122.csv`.

## 2. Formato

- Codificación **UTF-8 con BOM**, para que Excel reconozca tildes y caracteres especiales.
- Separador `;`, habitual en configuraciones regionales de España y Latinoamérica.
- Valores con `;`, comillas o saltos de línea se escapan entre comillas dobles.
- Se neutralizan celdas que podrían interpretarse como fórmulas (`=`, `@`, `+` no telefónico, `-` no numérico).
- Fechas en `dd/MM/yyyy`; montos y promedios con punto decimal.

## 3. Auditoría

Cada exportación se registra automáticamente en la bitácora:

| Campo | Valor |
| :--- | :--- |
| Acción | `EXPORT` |
| Módulo | `REPORTES` |
| Endpoint | Ruta solicitada |
| Resultado | `SUCCESS` |
| Descripción | Listado y cantidad de registros exportados |
| IP / User-Agent | Origen de la solicitud |

La exportación puede verificarse desde **Bitácora de Auditoría** o con `GET /api/v1/audit/recent`.

## 4. Interfaz

- **Padrón Estudiantil:** botón `Exportar padrón` en la barra de filtros.
- **Claustro Docente:** botón `Exportar padrón` en la barra de filtros.
- **Usuarios del Sistema:** botón `Exportar` junto al selector Tarjetas/Tabla.

Los botones solo aparecen cuando el usuario tiene el permiso de exportación correspondiente. Al finalizar se muestra un toast con el nombre del archivo generado.

## 5. Verificación

- Pruebas de controlador: autenticación, permiso específico, tipo de contenido, BOM y cabeceras.
- Prueba de extremo a extremo en navegador: descarga de los tres archivos con nombres y contenido correctos.
- Registro de auditoría comprobado tras cada descarga.
- `build`, `lint`, pruebas frontend y Axe sin errores.

## 6. Siguientes pasos

1. Reportes PDF con plantilla institucional (matrícula, actas, carga docente).
2. Exportación de auditoría y de catálogos (roles, sedes, autoridades).
3. Exportaciones asíncronas para volúmenes altos.
4. Filtros de exportación equivalentes a los filtros de pantalla.
