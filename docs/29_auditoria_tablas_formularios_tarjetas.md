# Auditoría de tablas, formularios, modales y tarjetas

**Fecha:** 22/11/2026  
**Alcance:** revisión transversal de los componentes visuales del sistema y correcciones aplicadas.

---

## 1. Tablas

### Hallazgos corregidos

- Varias tablas no tenían `colgroup`, por lo que las columnas cambiaban de ancho según el contenido.
- En Planes de estudio y Secciones, el ancho fijo inicial provocaba solapamientos entre código, nombre y acciones.
- La tabla de auditoría no era legible en móvil porque mantenía un ancho mínimo de 880 px.
- Faltaban etiquetas de celda en la vista apilada de auditoría.

### Mejoras aplicadas

- `colgroup` en Planes, Malla, Secciones, Matrículas, Prerrequisitos, Horarios, Portal del estudiante, Detalle docente, Carreras y Auditoría.
- Ajuste de anchos para que códigos, nombres y botones de acción no se solapen.
- Tabla de auditoría convertida a tarjetas apiladas en móvil con etiquetas `Acción`, `Usuario`, `Dispositivo / IP`, `Detalle` y `Fecha y hora`.
- Cabeceras con borde inferior y fondo consistente.
- Resaltado de fila al pasar el cursor y al enfocar un control interno.
- Estados vacíos dentro de la tabla con icono y explicación.

## 2. Formularios

### Hallazgos corregidos

- No se distinguían visualmente los campos obligatorios.
- Algunos formularios no tenían una agrupación clara entre identificación, contacto y configuración.

### Mejoras aplicadas

- Asterisco rojo automático en etiquetas de campos `required`, incluido el selector de fecha.
- Secciones de formulario con barra de acento y separadores.
- Rejillas adaptativas de 1, 2 o 3 columnas según el ancho.
- Pie de acciones fijo con sombra suave.
- Estados hover y focus consistentes en inputs, selects y fechas.
- DatePicker propio con calendario, teclado y formato `dd/mm/aaaa`.

## 3. Modales

### Verificación

| Tamaño | Resultado |
| :--- | :--- |
| 320 × 568 | Centrado, 12 px laterales, scroll interno, pie visible |
| 360 × 740 | Centrado |
| 390 × 844 | Centrado |
| 414 × 896 | Centrado |
| 768 × 1024 | Modal de 640 px centrado |
| 1024 × 768 | Centrado |
| 1440 × 900 | Centrado |

### Mejoras aplicadas

- Se eliminó el comportamiento de hoja pegada al fondo en móvil.
- Altura máxima `92dvh` y scroll interno del cuerpo.
- Cabecera compacta en móvil y tabla de pasos legible.
- Footer fijo con separador y sombra.
- Selector de fecha dentro del modal con cierre de calendario antes que el modal.

## 4. Tarjetas

### Hallazgos corregidos

- Auditoría usaba el mismo acento verde en todas las tarjetas y pestañas, sin jerarquía semántica.
- Algunas tarjetas conservaban cabeceras antiguas con título inline.

### Mejoras aplicadas

- KPIs de auditoría con color semántico:
  - Eventos: azul primario.
  - Tasa de éxito: verde.
  - Promedio diario: cian.
  - Día más activo: ámbar.
- Iconos en mosaico, borde superior de acento y hover elevado.
- Pestañas de periodo con estado activo sólido y contraste alto.
- Cabecera de tabla de auditoría con `SectionHeader`.
- Cabecera de Universidad migrada al mismo patrón.
- Tarjetas con superficie, borde y sombra consistentes en claro y oscuro.

## 5. Accesibilidad y calidad

- Foco visible en botones, enlaces, campos y días del calendario.
- Etiquetas apiladas en tablas móviles.
- Contraste verificado en modo claro y oscuro.
- `prefers-reduced-motion` respetado.
- Axe: **0 violaciones**.
- Pruebas frontend y backend aprobadas.
