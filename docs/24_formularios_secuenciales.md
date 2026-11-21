# Formularios secuenciales de docente y estudiante

**Estado:** implementado en el frontend.  
**Rutas:** `/teachers` y `/students`.  
**Dependencias nuevas:** ninguna.  
**Backend:** sin cambios.

## 1. Objetivo

Los formularios de alta y edición de docentes y estudiantes dejaron de ser una lista larga
con scroll. Ahora se organizan en **tres pasos**, con validación antes de avanzar y un resumen
antes de guardar.

## 2. Docente

| Paso | Contenido |
| :--- | :--- |
| 1. Identidad y contacto | Código, documento, nombres, apellidos, correo, teléfono y dirección. |
| 2. Trayectoria académica | Categoría, dedicación, grado, título, facultad, departamento, especialidad y fecha de ingreso. |
| 3. Acceso y confirmación | Cuenta de acceso opcional y resumen del registro. |

## 3. Estudiante

| Paso | Contenido |
| :--- | :--- |
| 1. Datos personales | Código de matrícula, documento, nombres, apellidos, nacimiento, género, correo, teléfono y dirección. |
| 2. Información académica | Facultad, carrera, ciclo, créditos, promedio, condición y estado de matrícula. |
| 3. Acceso y confirmación | Cuenta de acceso opcional y resumen del registro. |

## 4. Comportamiento

- El **stepper** muestra el paso actual y permite volver a pasos anteriores.
- **Siguiente** valida los campos obligatorios del paso actual.
- **Enter** en un paso intermedio avanza en lugar de enviar el formulario.
- En el último paso se valida nuevamente la identidad y se envía.
- El correo institucional se valida con formato básico cuando se informa.
- El pie de acciones queda fijo al fondo del modal mientras el contenido se desplaza.
- Al cambiar de paso, el contenido vuelve arriba y el panel recibe el foco.
- El resumen final muestra los datos clave antes de guardar.
- El modal conserva cierre con Escape, trampa de foco y bloqueo de scroll.

## 5. Accesibilidad

- Stepper con `aria-current="step"`.
- Panel de paso enfocable y anunciado por su etiqueta.
- Mensajes de error con `role="alert"` y `aria-live="polite"`.
- Etiquetas asociadas a cada campo.
- Navegación completa por teclado.
- En móvil, los pasos y los campos pasan a una columna.

## 6. Archivos modificados

- `frontend/src/pages/TeachersPage.tsx`
- `frontend/src/pages/StudentsPage.tsx`
- `frontend/src/index.css`

## 7. Verificación

- `npm run build`: correcto.
- `npm run lint`: sin errores.
- `npm test`: **93 pruebas en 22 archivos**, todas correctas.
- Flujo verificado en navegador:
  - apertura del modal;
  - tres pasos visibles;
  - validación al intentar avanzar sin datos;
  - paso 2 y paso 3 del docente;
  - paso 2 y paso 3 del estudiante;
  - resumen final;
  - sin errores de consola.

## 8. Limitaciones

- No se añadieron reglas de negocio nuevas: solo se reorganizaron y validaron los campos
  obligatorios existentes.
- La validación de formato de correo es del lado del cliente; el backend sigue siendo la
  autoridad final.
- No se modificó el contrato de los endpoints ni los permisos.
