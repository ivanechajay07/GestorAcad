# Auditoría visual final

**Proyecto:** Gestor Académico Virtual  
**Alcance:** escritorio 1440×900, móvil 390×844, claro/oscuro, teclado y axe-core.  
**Fecha:** noviembre 2026

---

## 1. Estado final

El proyecto pasó de un panel administrativo plano a una **consola académica premium**, manteniendo orden y accesibilidad:

- Hero propio por módulo con acento, icono, marca de agua y atmósfera animada.
- Superficies planas, una sola familia tipográfica y un solo acento.
- Tablas de datos con avatar, código, hover y modo tarjeta móvil.
- Modales de formulario con stepper, estados completados y entrada animada.
- Dashboard con contadores y gráficos animados.
- Asistente móvil como bottom sheet.
- Command palette y transiciones de ruta.

### Evidencia

| Pantalla | Captura |
| :--- | :--- |
| Dashboard | `docs/assets/design/dashboard.png` |
| Estudiantes | `docs/assets/design/students.png` |
| Roles | `docs/assets/design/roles.png` |
| Modal de estudiante | `docs/assets/design/modal-student.png` |
| Asistente móvil | `docs/assets/design/assistant-mobile.png` |

---

## 2. Fases entregadas

| Fase | Entregable |
| :--- | :--- |
| 1 | Hero premium por módulo y sistema de movimiento |
| 2 | Tablas, modales y visualizaciones animadas |
| 3 | Roles en tabla y Universidad por secciones |
| 4 | Asistente móvil, rutas y command palette |
| 5 | Evidencia, captura automatizada y checklist de calidad |

---

## 3. Resultados de calidad

| Control | Resultado |
| :--- | :--- |
| `npm run build` | Correcto |
| `npm run lint` | 0 errores |
| `npm test -- --run` | 101 pruebas, 24 archivos |
| axe-core WCAG 2 A/AA | 0 violaciones en 12 pantallas + móvil |
| Consola del navegador | 0 errores |
| Scroll horizontal móvil | Sin desbordes de documento |
| `prefers-reduced-motion` | Animaciones desactivadas |
| Teclado | Foco visible y menús con Escape |

---

## 4. Checklist manual pendiente

- [ ] Leer Dashboard, Estudiantes y un modal con NVDA o VoiceOver.
- [ ] Probar zoom al 200 % en escritorio.
- [ ] Recorrer el asistente móvil solo con teclado.
- [ ] Verificar objetivos táctiles de 40×40 px en tabla móvil.
- [ ] Revisar modo oscuro en pantalla OLED real.
- [ ] Medir FPS del hero en un móvil de gama baja.
- [ ] Validar que los gráficos anuncian su descripción accesible.

---

## 5. Captura visual automatizada

Script: `scripts/visual-capture.mjs`  
Comando:

```bash
npm --prefix frontend run build
node scripts/visual-capture.mjs
```

Variables:

| Variable | Uso |
| :--- | :--- |
| `BASE_URL` | URL del frontend; por defecto `http://localhost:3010` |
| `VISUAL_USER` | Usuario; por defecto `admin` |
| `VISUAL_PASSWORD` | Contraseña; por defecto `gestor123` |
| `VISUAL_OUT` | Carpeta de salida; por defecto `visual-audit/` |
| `CHROME_PATH` | Ruta de Chrome/Chromium en Linux o CI |

Salida:

- 10 pantallas de escritorio.
- Modal de estudiante.
- 3 pantallas móviles.
- Asistente móvil.
- Código de salida 2 si hay errores de consola.

También existe el workflow manual `.github/workflows/visual.yml` para ejecutarlo sobre Docker y publicar las capturas como artefacto.

---

## 6. Riesgos residuales

1. La comparación pixel-perfect no está integrada todavía; las capturas son evidencia y revisión manual.
2. Las animaciones del hero usan `filter: blur`; en dispositivos muy antiguos conviene reducir aún más los orbes.
3. Los estados vacíos de gráficos dependen de datos reales; el dashboard con datos completos no los muestra.
4. La lectura con lector de pantalla requiere una pasada manual.
5. El FAB del asistente en escritorio puede seguir tapando contenido en pantallas muy bajas.

---

## 7. Criterio de cierre

El rediseño se considera cerrado cuando:

- [ ] Las capturas de `visual-audit/` se revisan contra la versión anterior.
- [ ] El checklist manual de accesibilidad está completo.
- [ ] No hay regresiones de consola ni de axe.
- [ ] El equipo aprueba la dirección visual final.
