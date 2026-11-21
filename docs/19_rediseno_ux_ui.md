# Rediseño UX/UI — v5.0

**Estado:** implementado en el frontend.  
**Alcance:** layout, navegación, cabeceras, paneles por rol, tablas/formularios y asistente académico.  
**Backend:** sin cambios.

## 1. Objetivo

Unificar la experiencia visual de todos los módulos con una interfaz compacta, legible y sobria, priorizando las tareas de cada rol:

- **Universidad:** indicadores institucionales, estructura académica y administración.
- **Docente:** acceso directo a sus secciones, notas, asistencia y actas.
- **Estudiante:** acceso directo a su avance, cursos, calificaciones y créditos.

## 2. Sistema visual

- Tokens de espaciado, radios y elevación más contenidos.
- Superficies sólidas con borde sutil en lugar de sombras profundas.
- Paleta académica basada en `--primary` y acentos por módulo.
- Jerarquía tipográfica compacta: título de página, descripción, acciones y métricas.
- Estados de foco visibles y transiciones breves (0,16–0,2 s).
- Respeto a `prefers-reduced-motion`.

## 3. Navegación

- **Sidebar** más denso, con secciones colapsables y búsqueda local.
- **Buscador global real** en el header (`Ctrl/Cmd + K`):
  - filtra solo los módulos permitidos por permisos y rol;
  - navegación con flechas, `Enter` para abrir y `Esc` para cerrar;
  - foco atrapado dentro del diálogo mientras está abierto.

La navegación se centralizó en `src/config/navigation.tsx` para que sidebar y buscador compartan las mismas reglas de acceso.

## 4. Paneles por rol

`/dashboard` conserva los indicadores institucionales para el perfil Universidad. Para Docente y Estudiante:

- se ocultan KPIs y gráficos administrativos;
- el hero muestra una acción principal hacia `/my-sections` o `/my-progress`;
- los accesos rápidos se limitan a los módulos pertinentes;
- las reglas de permisos existentes se mantienen intactas.

## 5. Asistente académico

- Composer central en el estado vacío y fijo al pie durante la conversación.
- Sugerencias por rol, conversación legible y fuentes identificadas.
- Búsqueda local normalizada (sin acentos, con palabras vacías descartadas) y fragmento de la fuente.
- Aviso explícito: **prototipo local**, sin GPT ni almacenamiento institucional.
- Carga de `.txt` solo en la sesión de la pestaña; sin envío a servicios externos.
- Estados de carga, error de formato, archivo vacío y conversación vacía.

## 6. Componentes y pantallas revisadas

- `PageHeader`: cabecera compacta sobre superficie, icono de acento, acciones y métricas en línea.
- `Card` y `glass-panel`: padding y elevación reducidos.
- Tablas, filtros, formularios, modales y estados vacíos: alineados al nuevo sistema.
- Portales de estudiante y docente verificados en escritorio y móvil.
- Temas claro y oscuro verificados.

## 7. Verificación

- `npm run lint`: sin errores.
- `npm test`: 90 pruebas aprobadas.
- `npm run build`: compilación correcta.
- Verificación visual con Chrome headless en escritorio (1440 px), tablet y móvil (390 px), en temas claro y oscuro.
- Sin errores de consola en los flujos revisados.

## 8. Refinamiento v6.1

- **Tipografía editorial:** `Source Serif 4` para títulos de página, modales y hero; `Plus Jakarta Sans` para interfaz y formularios.
- **Sidebar blanco flotante:** panel con superficie clara, borde y sombra sutiles; estado activo en azul primario; tooltip de módulo en modo colapsado.
- **Modales compartidos:** `components/ui/Modal.tsx` con cabecera, descripción, cierre accesible, `Escape`, trampa de foco y bloqueo de scroll.
- **Selector con búsqueda:** `components/ui/SearchableSelect.tsx` para listas largas, con búsqueda sin acentos, navegación por teclado y portal para evitar recortes.
- **Formularios:** controles homogéneos, etiquetas asociadas, ayudas, estados inválidos y placeholders descriptivos.
- **Toasts:** iconos por variante, título, mensaje, cierre manual, barra de progreso, deduplicación y posición bajo el header.
- **Accesibilidad:** foco visible, `aria-*` en selectores/modales, nombres accesibles y respeto a `prefers-reduced-motion`.

## 9. Formularios de Universidad (v6.2)

- **Paleta azul institucional:** primario `#2563eb` en claro y `#3b82f6` en oscuro.
- **Formularios ordenados por secciones:** identificación, ubicación, infraestructura, datos académicos, contacto, nombramiento y periodo.
- **Iconos junto a cada etiqueta:** edificio, código, mapa, correo, teléfono, calendario, clave, tipo de dato, etc.
- **Placeholders descriptivos:** ejemplos concretos para sede, facultad, carrera, autoridad y parámetro.
- **Ayudas contextuales:** reglas de claves, alcance de la facultad, reasignación de carrera y documento de nombramiento.
- **Errores visibles:** banner con icono y `role="alert"` en todos los formularios de Universidad.
- **Composición equilibrada:** parámetro en dos columnas y nombramiento de autoridad a ancho completo.

## 10. Modales académicos y Roles (v6.4)

- **Modales académicos ordenados:** Periodo, Curso, Plan, Sección y Evaluación con secciones, iconos por campo, placeholders y errores visibles.
- **Docentes y estudiantes:** campos con iconos, ayudas y placeholders consistentes.
- **Selector de permisos rediseñado:** búsqueda, progreso, contadores, módulos plegables, checkboxes compactos y acciones por módulo.
- **Modal de rol ampliado:** formulario en dos columnas, código interno visible, permisos con scroll propio y footer fijo.
- **Corrección de layout:** los módulos de permisos ya no se comprimen cuando hay muchos grupos; el panel usa scroll real.

## 11. Limitaciones

El rediseño no resuelve:

- la conexión real a un proveedor GPT;
- el almacenamiento institucional o la indexación de documentos PDF/Word;
- la persistencia de la base de conocimiento del asistente;
- la ausencia de repositorio Git, CI/CD y backups automáticos.

Estas brechas siguen registradas en `docs/16_auditoria_cierre_proyecto.md`.
