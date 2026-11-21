# Sistema de diseño — Gestor Académico Virtual

**Objetivo:** mantener una interfaz consistente, accesible y fácil de evolucionar.
Este documento es la referencia para nuevas pantallas y componentes.

**Dirección vigente:** *Consola académica sobria*. Superficies planas, un solo
acento azul, una sola familia tipográfica y color reservado para estados.

---

## 1. Principios

1. **Claridad antes que decoración.** Cada color, borde y sombra debe comunicar jerarquía o estado.
2. **Una sola acción primaria por contexto.** Las acciones secundarias van a botones outline o a un menú.
3. **Densidad con aire.** Tablas en escritorio, tarjetas en móvil; nunca tablas cortadas sin aviso.
4. **Accesibilidad por defecto.** Contraste AA, foco visible, teclado y `prefers-reduced-motion`.
5. **Un dato, una vez.** No repetir la misma cifra en tarjeta, barra y etiqueta.

---

## 2. Tokens

### Color

| Token | Claro | Oscuro | Uso |
| :--- | :--- | :--- | :--- |
| `--primary` | `#2563eb` | `#3b82f6` | Acción principal, enlaces |
| `--accent-cyan` | `#0891b2` | `#22d3ee` | Acento, datos secundarios |
| `--bg-app` | `#f6f7f9` | `#0b0f19` | Fondo de aplicación |
| `--bg-surface` | `#ffffff` | `#111827` | Tarjetas y modales |
| `--text-main` | `#0f172a` | `#f9fafb` | Texto principal |
| `--text-secondary` | `#475569` | `#9ca3af` | Texto de apoyo |
| `--text-muted` | `#5f6f85` | `#9ca3af` | Metadatos y ayudas || `--status-up` / `--status-up-text` | `#10b981` / `#047857` | `#10b981` / `#34d399` | Éxito |
| `--status-warn` / `--status-warn-text` | `#f59e0b` / `#b45309` | `#f59e0b` / `#fbbf24` | Advertencia |
| `--status-down` / `--status-down-text` | `#ef4444` / `#b91c1c` | `#ef4444` / `#f87171` | Error o peligro |

Regla: los colores vivos se usan para **puntos, iconos y rellenos**; las variantes `*-text` para **texto**.

### Tipografía

Una sola familia para toda la interfaz: **Plus Jakarta Sans**. Los títulos se
diferencian por tamaño y peso, no por otra tipografía. No usar tamaños
arbitrarios como `0.72rem` o `0.78rem`: elegir el token más cercano.

| Token | Tamaño | Uso |
| :--- | :--- | :--- |
| `--text-xs` | 12 px | Etiquetas, ayudas, metadatos |
| `--text-sm` | 13 px | Tablas, texto secundario |
| `--text-base` | 14 px | Cuerpo |
| `--text-md` | 16 px | Subtítulos |
| `--text-lg` | 18 px | Títulos de tarjeta |
| `--text-xl` | 20 px | Títulos de sección |
| `--text-2xl` | 24 px | Título de página |
| `--text-3xl` | 32 px | Hero / login |

No usar tamaños arbitrarios como `0.72rem` o `0.78rem`: elegir el token más cercano.

### Espaciado y radios

| Token | Valor |
| :--- | :--- |
| `--space-1` … `--space-6` | 4, 8, 12, 16, 24, 32 px |
| `--radius-sm` | 7 px |
| `--radius-md` | 10 px |
| `--radius-lg` | 14 px |
| `--radius-xl` | 20 px |

---

## 3. Componentes

### Button

- Variantes: `primary`, `secondary`, `outline`, `ghost`, `danger`.
- Tamaños: `sm`, `md`, `lg`; usan `--radius-sm/md/lg`.
- Una pantalla debe tener **una** acción `primary`; el resto `secondary` u `outline`.
- Peligro solo en el paso final de una acción destructiva.
- Iconos siempre con `aria-label` si el botón no tiene texto.

### PageHeader

- Título, descripción breve, acciones y métricas.
- Métricas: 4 columnas en escritorio, 2 en móvil; un número impar ocupa la fila completa.
- No duplicar migas de pan fuera de la cabecera.

### Toolbar

- Búsqueda + filtros + vista (Tarjetas/Tabla).
- Una sola acción de actualización por pantalla.
- En móvil, los filtros se apilan y la vista se mantiene visible.

### Tablas

- Escritorio: tabla por defecto en listados administrativos.
- Móvil: `data-table--stack` convierte filas en tarjetas con etiquetas.
- Acciones: máximo dos iconos visibles + menú `⋯`.
- Encabezados en `--text-xs`, nunca por debajo de 12 px.

### Badges

- Un badge principal por entidad (estado).
- Metadatos secundarios en texto, no en una pila de badges.
- No usar badges para información técnica extensa; usar código monoespaciado.

### Modales

- Ancho máximo 640–810 px.
- Cabecera fija, pie fijo, scroll solo en el cuerpo.
- `Escape`, foco atrapado y retorno de foco al cerrar.

### Gráficos

- Dona para proporciones, barras para comparación, línea para series temporales.
- Cada gráfico con título, leyenda/tooltip, eje cuando aplique y estado vacío.
- Los controles del gráfico viven **dentro** de su tarjeta.

---

## 4. Responsive

| Breakpoint | Comportamiento |
| :--- | :--- |
| ≤ 640 px | Una columna, tabs 2×2, tablas apiladas, acciones compactas |
| ≤ 760 px | Tablas como tarjetas |
| ≤ 900 px | Sidebar como panel deslizante |
| ≥ 1024 px | Tabla por defecto en listados |
| ≥ 1440 px | Contenido centrado, sin estirar formularios |

---

## 5. Accesibilidad

- Contraste mínimo **4,5:1** para texto normal y **3:1** para texto grande.
- Foco visible en todos los elementos interactivos (`:focus-visible`).
- No eliminar `outline` sin reemplazarlo por un anillo equivalente.
- Áreas táctiles de al menos 40 × 40 px en móvil.
- `prefers-reduced-motion` respetado en animaciones.
- Iconos decorativos con `aria-hidden="true"`; botones con icono y sin texto con `aria-label`.
- Formularios con `label` asociado o `aria-label`, errores junto al campo y `role="alert"`.

---

## 6. Checklist para una pantalla nueva

- [ ] Usa `PageHeader` y una sola acción primaria.
- [ ] Los textos usan tokens tipográficos.
- [ ] Estados de carga, vacío y error definidos.
- [ ] Tabla en escritorio y tarjetas o tabla apilada en móvil.
- [ ] Contraste y foco revisados.
- [ ] Sin duplicar actualizar, migas de pan o búsquedas.
- [ ] Probado en claro/oscuro y a 390 px.
- [ ] `npm run build`, `npm run lint`, `npm test` y axe sin violaciones A/AA.
