# Rediseño del Dashboard — Panel institucional

**Estado:** implementado en el frontend, sin cambios de backend.  
**Ruta:** `/dashboard`  
**Tema:** claro y oscuro  
**Dependencias nuevas:** ninguna.

## 1. Nueva estructura

El panel se organiza de arriba hacia abajo en cuatro niveles:

1. **Cabecera contextual**
   - Saludo, periodo académico, rol y última actualización.
   - Acción principal según el rol: padrón estudiantil, mi avance, mis secciones o institución.
   - Acceso al asistente y actualización manual.

2. **Indicadores institucionales**
   - Seis KPI compactos: estudiantes, docentes, usuarios, eventos de los últimos 7 días,
     facultades y carreras.
   - Cada tarjeta enlaza al módulo correspondiente solo si el usuario tiene permiso.
   - Los indicadores activos muestran una barra de proporción y texto accesible.

3. **Analítica — consola ejecutiva**
   - Un único contenedor con pestañas y controles contextuales, sin tarjetas sueltas de alturas
     desiguales.
   - **Población estudiantil:** dona por facultad o carrera junto con la línea de evolución por
     ciclo (o barras).
   - **Claustro docente:** dona por categoría o facultad junto con barras comparativas del
     claustro.
   - **Actividad de auditoría:** serie lineal de los últimos 7 días, con vista diaria o
     acumulada, promedio diario, día pico, aviso cuando la actividad se concentra en un día y
     tabla de datos bajo demanda.

4. **Cobertura institucional**
   - Franja de gobernanza con institución, licenciamiento y sedes activas.

5. **Pie de panel**
   - Nota sobre cifras agregadas y permisos.

La antigua sección **“Módulos operativos”** se retiró. La navegación principal queda en el
sidebar y en las acciones contextuales de cada vista.

La consola analítica agrupa las visualizaciones en un solo bloque: pestañas a la izquierda,
filtros a la derecha y dos paneles emparejados por vista. Así no quedan huecos entre tarjetas.

## 2. KPIs sin duplicaciones

Se eliminaron la franja de “hallazgos” y las tarjetas internas de la auditoría que repetían
las mismas cifras. Cada métrica aparece una sola vez como KPI:

| KPI | Dato | Dónde se explica |
| :--- | :--- | :--- |
| Estudiantes | Total del padrón | Activos/inactivos en la pista y barra de proporción |
| Docentes | Total del claustro | Activos en la pista y barra de proporción |
| Usuarios | Total de cuentas | Activas en la pista y barra de proporción |
| Eventos (7 días) | Eventos de la serie reciente | Total histórico en la pista |
| Facultades | Facultades con matrícula activa | Sin repetir en otro resumen |
| Carreras | Carreras con estudiantes activos | Sin repetir en otro resumen |

Decisiones adicionales:

- El periodo aparece solo en la cabecera.
- El licenciamiento aparece solo en Cobertura institucional.
- La auditoría no repite el total de 7 días ni el histórico en una fila de estadísticas.
  El gráfico muestra la serie; el pie aporta promedio y concentración del día pico.
- Las donas no muestran el total como cifra central para no duplicar los KPI; muestran
  “Composición 100%” y, al enfocar una porción, su valor y porcentaje.
- El pie de matrícula por ciclo no repite el total de estudiantes; describe la serie académica
  y ofrece el acceso al padrón.

## 3. Gráficos y criterio de elección

### Línea — matrícula por ciclo

- Es la serie lineal académica principal del dashboard, independiente de auditoría.
- Usa los ciclos ordenados como eje de avance curricular.
- Tooltip, navegación con flechas y tabla **Ver datos**.
- Permite alternar a **Barras** para comparar el volumen por ciclo.
- Si no hay estudiantes, muestra un estado vacío explícito.

### Línea — actividad de auditoría

- Solo se usa para la serie temporal de 7 días.
- Se muestra únicamente si hay al menos **tres días con eventos**; una serie casi plana no
  aporta una tendencia útil. En ese caso, el KPI de eventos y el enlace a la bitácora
  siguen disponibles.
- Permite alternar **Diario / Acumulado**.
- Tooltip y navegación con flechas.
- Tabla equivalente visible con **Ver datos**.
- Si no hay eventos en 7 días, muestra un estado vacío explícito.

### Barras — vista alternativa de matrícula por ciclo

- Se usan cuando el usuario cambia la vista de la serie académica.
- Cada barra muestra valor y porcentaje del total.
- La unidad (`est.`) y el total del gráfico son explícitos en las etiquetas.

### Donas — proporciones

- **Claustro docente:** categoría o facultad, según el filtro.
- **Población estudiantil:** facultad o carrera, según el filtro.
- Cada porción es enfocable y anuncia etiqueta, valor y porcentaje.
- La leyenda repite la información como texto accesible.
- El centro muestra la composición y, al enfocar, el detalle de la porción.

## 4. Interacción

- **Pestañas analíticas:** Población estudiantil / Claustro docente / Actividad de auditoría.
- **Línea / Barras** en matrícula por ciclo.
- **Diario / Acumulado** en auditoría.
- **Categoría / Facultad** en claustro docente.
- **Facultad / Carrera** en población estudiantil.
- **Ver datos** en las series lineales.
- Hover y foco en porciones de dona, barras y puntos de línea.
- Enlaces a bitácora, padrón, claustro e institución según permisos.
- Actualización manual con estado de carga.
- Animaciones breves y respeto a `prefers-reduced-motion`.
- **Skeleton de cambio de módulo:** al navegar entre páginas, el header y el sidebar permanecen
  visibles y el área de contenido muestra un esqueleto de página durante la carga del chunk.
  Se garantiza una transición mínima de 280 ms para evitar parpadeos; si el módulo tarda más,
  el fallback de `Suspense` continúa mostrando el mismo esqueleto. El scroll vuelve al inicio
  en cada cambio de ruta.

## 5. Permisos y estados vacíos

- Los bloques nulos del resumen no se renderizan.
- Si no hay permisos para el padrón, se muestra un estado explicativo.
- Si no hay datos en una categoría, la visualización muestra su mensaje vacío.
- Si falla la carga inicial, se ofrece reintento.
- Si falla una actualización, se conserva el último resumen válido y se avisa.
- No se muestran métricas vacías ni cifras simuladas.

## 6. Accesibilidad

- Secciones con `aria-labelledby`.
- Controles con `aria-pressed`, `aria-expanded` y etiquetas explícitas.
- Gráficos con título, descripción y alternativa textual.
- Tabla de datos para la serie temporal.
- Foco visible en controles y porciones de dona.
- Navegación por teclado en línea y controles segmentados.

## 7. Archivos modificados

- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/components/dashboard/KpiCard.tsx`
- `frontend/src/components/ui/BarChart.tsx`
- `frontend/src/components/ui/LineChart.tsx`
- `frontend/src/components/ui/Card.tsx`
- `frontend/src/components/ui/DonutChart.tsx` *(nuevo)*
- `frontend/src/components/ui/DonutChart.test.tsx` *(nuevo)*
- `frontend/src/components/dashboard/DistributionChart.tsx`
- `frontend/src/components/ui/LineChart.tsx`
- `frontend/src/components/ui/PageSkeleton.tsx` *(nuevo)*
- `frontend/src/components/ui/PageSkeleton.test.tsx` *(nuevo)*
- `frontend/src/layouts/MainLayout.tsx`
- `frontend/src/components/dashboard/QuickLink.tsx` *(sin uso en el dashboard)*
- `frontend/src/components/Header.tsx`
- `frontend/src/index.css`

## 8. Verificación

- `npm run build`: correcto.
- `npm run lint`: sin errores.
- `npm test`: **93 pruebas en 22 archivos**, todas correctas.
- Verificación visual en escritorio, móvil y tema claro/oscuro.
- Interacciones verificadas: Diario/Acumulado, Ver datos, filtros de docentes y población.
- Skeleton de cambio de módulo verificado en navegador: header y sidebar permanecen visibles;
  el esqueleto aparece al navegar a otro módulo y desaparece al cargar la página.
- Sin errores de consola.

## 9. Limitaciones de los datos reales

- La auditoría solo dispone de una ventana de 7 días; no hay serie histórica más larga.
- El backend no entrega comparaciones contra periodos anteriores; no se inventaron.
- Con pocos estudiantes por ciclo, las barras pueden verse uniformes; reflejan los valores reales.
- Los porcentajes se redondean y pueden no sumar exactamente 100%.
- La paleta de dona se repite si una distribución supera seis categorías.
- La conversación y los datos dependen de los permisos del resumen; no se consultan fuentes adicionales.
