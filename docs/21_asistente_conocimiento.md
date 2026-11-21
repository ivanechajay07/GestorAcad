# Asistente académico con base de conocimiento — Fase 9.1

**Estado:** funcional con persistencia en backend, búsqueda local y capa GPT opcional (RAG-lite).  
**Rutas:** `/assistant` y widget flotante global.  
**Backend:** `/api/v1/knowledge/**`  
**Migración:** `database/15_asistente_conocimiento.sql`

## 1. Alcance

| Componente | Estado |
| :--- | :---: |
| Fuentes documentales persistentes | ✅ |
| Búsqueda local en servidor | ✅ |
| Fuentes visibles por respuesta | ✅ |
| Carga de archivos `.txt` | ✅ |
| Eliminación lógica de fuentes | ✅ |
| Widget flotante global | ✅ |
| GPT opcional con RAG-lite y fallback | ✅ Fase 10.1 |
| Embeddings / RAG semántico | 🕓 Fase 10.2 |

## 2. Modelo de datos

`tb_conocimiento_documentos`:

- `nombre` único,
- `categoria`,
- `contenido` en `MEDIUMTEXT`,
- borrado lógico y campos de auditoría.

Fuentes iniciales:

1. Guía del Gestor Académico.
2. Estructura académica.
3. Evaluación, notas y actas.
4. Portales de estudiante y docente.
5. Seguridad y roles.

## 3. Permisos

| Permiso | Universidad | Docente | Estudiante |
| :--- | :---: | :---: | :---: |
| `CONOCIMIENTO_VIEW` | ✅ | ✅ | ✅ |
| `CONOCIMIENTO_CREATE` | ✅ | — | — |
| `CONOCIMIENTO_DELETE` | ✅ | — | — |

## 4. API

| Método | Ruta | Permiso |
| :--- | :--- | :--- |
| GET | `/api/v1/knowledge/sources` | `CONOCIMIENTO_VIEW` |
| POST | `/api/v1/knowledge/sources` | `CONOCIMIENTO_CREATE` |
| DELETE | `/api/v1/knowledge/sources/{id}` | `CONOCIMIENTO_DELETE` |
| GET | `/api/v1/knowledge/status` | `CONOCIMIENTO_VIEW` |
| POST | `/api/v1/knowledge/ask` | `CONOCIMIENTO_VIEW` |
| POST | `/api/v1/knowledge/chat` | `CONOCIMIENTO_VIEW` |

`/ask` siempre usa búsqueda local. `/chat` usa GPT con contexto local si está configurado y cae
automáticamente a la búsqueda local cuando falta la clave o el proveedor falla.

## 5. Búsqueda local

- Normaliza mayúsculas y tildes.
- Descarta palabras vacías.
- Puntúa coincidencias en nombre, categoría y contenido.
- Devuelve hasta tres fuentes con fragmento y puntaje.
- La respuesta es **extractiva** en modo local: cita fragmentos de las fuentes, no genera texto con IA.
- Saludos y solicitudes de orientación («hola», «buenos días», «quisiera consultar») se responden
  localmente con una bienvenida y los temas disponibles, sin llamar a GPT ni devolver “No encuentro”.
- En modo RAG, GPT redacta la respuesta usando solo esos fragmentos y devuelve las mismas fuentes.
- Si no hay coincidencias, devuelve un mensaje claro y no llama a GPT ni inventa una respuesta.

## 6. Frontend

### Página `/assistant`

- Composer central y conversación.
- Sugerencias por rol.
- Base de conocimiento visible con categoría, tamaño y eliminación para administradores.
- Carga de `.txt` con categoría seleccionable.
- Aviso dinámico: modo local o GPT + fuentes.

### Widget flotante

- Disponible en todas las páginas autenticadas.
- Botón flotante animado: flotación suave, anillo de pulso y microinteracción.
- Abre un panel compacto con sugerencias, conversación, fuentes y composer.
- Conversación multi-turno: cada envío incluye el historial reciente de la sesión.
- Al terminar una respuesta, el foco vuelve al campo de consulta.
- Los saludos se responden con una bienvenida local y no muestran etiqueta de modo.
- Enlace a la página completa.
- Se oculta en `/assistant` y cuando el sidebar móvil está abierto.
- Cierre con `Escape` y botón dedicado.

## 7. Codificación

Los documentos iniciales se corrigieron con `database/15_fix_conocimiento_utf8.sql` para restablecer tildes y `ñ`. La migración principal está en UTF-8.

## 8. Verificación

- 192 pruebas backend aprobadas (incluye 8 del servicio GPT y 5 de búsqueda local).
- 90 pruebas frontend aprobadas.
- Build y lint correctos.
- API verificada: 5 fuentes, respuesta con 3 fuentes, carga y eliminación temporal.
- Estudiante autenticado puede consultar la base.
- Fallback verificado: con `ASSISTANT_MODE=gpt` y un proveedor inaccesible, `/status` anuncia RAG y
  `/chat` responde en modo local.
- Chat multi-turno verificado en el navegador: el segundo mensaje incluye el historial y el foco
  vuelve al campo de consulta.
- Sin errores de consola en la interfaz.

## 9. Limitaciones

- GPT es opcional y requiere `OPENAI_API_KEY`; sin clave el sistema permanece en modo local.
- No hay embeddings ni búsqueda semántica; la recuperación es léxica (RAG-lite).
- El historial se envía en cada consulta, pero no se persiste en backend ni entre recargas.
- En modo local el historial no se usa para la búsqueda: cada pregunta se puntúa por separado.
- No hay streaming, cuotas de consumo ni panel de costos.
- Solo se cargan `.txt`; PDF/Word requieren procesamiento en servidor.
- No hay paginación de documentos ni versionado.
- La búsqueda léxica es adecuada para una base pequeña; para volúmenes grandes se recomienda índice FULLTEXT o motor de recuperación.
