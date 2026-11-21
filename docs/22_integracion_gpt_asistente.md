# Integración de GPT al asistente académico

**Estado actual:** el asistente funciona por defecto en **modo local** (búsqueda léxica sobre
`tb_conocimiento_documentos`). La integración **GPT opcional con RAG-lite** ya está implementada:
recupera contexto de la base local, lo envía a OpenAI y devuelve la respuesta con las fuentes.
Si GPT no está configurado o falla, responde automáticamente con la búsqueda local.

La clave de OpenAI vive **solo en el backend**. El frontend nunca la recibe ni la usa.

## 1. Cómo funciona

```text
Frontend (widget o página /assistant)
        │  POST /api/v1/knowledge/chat  { question, history }
        ▼
ControladorConocimiento
        ▼
ServicioAsistenteGptImpl
        │  1. ServicioConocimiento.ask(question)  → fuentes locales (top 3)
        │  2. Recupera y limpia el historial reciente (máx. 8 mensajes)
        │  3. Construye CONTEXTO + CONVERSACIÓN
        │  4. POST /chat/completions a OpenAI (si está habilitado)
        ▼
Respuesta: answer + mode (LOCAL | RAG | GPT) + greeting + sources[]
```

- **Modo local:** no se llama a ningún proveedor externo. Se devuelve el texto extractivo de las
  fuentes y hasta tres documentos citados.
- **Modo RAG:** se envían los fragmentos recuperados y el historial. El modelo debe responder solo
  con ese contexto y citar las fuentes entre corchetes.
- **Modo GPT:** cuando hay historial pero la pregunta actual no recupera fuentes, GPT puede responder
  seguimientos usando la conversación, sin inventar datos institucionales.
- **Saludos:** se responden localmente con una bienvenida y los temas disponibles; no se envían a GPT.
- **Fallback:** si no hay clave, no hay fuentes ni historial, o el proveedor devuelve error, se
  responde con la búsqueda local sin inventar información.
- Si no hay coincidencias locales y no hay historial, no se llama a GPT: se devuelve “No encuentro”.

## 2. Configuración

Variables en `.env` (ver `.env.example`) o en el gestor de secretos:

```env
# local = búsqueda local | gpt (o rag) = GPT con contexto local y fallback
ASSISTANT_MODE=local

# Solo backend. Nunca en React ni en variables VITE_*.
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
ASSISTANT_MAX_TOKENS=800
ASSISTANT_TEMPERATURE=0.2

# Tiempos de espera del cliente HTTP saliente
HTTP_CLIENT_CONNECT_TIMEOUT=5s
HTTP_CLIENT_READ_TIMEOUT=30s
```

Para activar GPT:

1. Configurar `ASSISTANT_MODE=gpt`.
2. Definir `OPENAI_API_KEY` con una clave válida.
3. Reconstruir y reiniciar el backend:

```bash
docker compose build backend
docker compose up -d --no-deps backend
```

No es necesario reconstruir el frontend: el modo se consulta en tiempo de ejecución mediante
`GET /api/v1/knowledge/status`.

### Verificar el estado

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8094/api/v1/knowledge/status
```

Respuesta en modo local:

```json
{ "mode": "LOCAL", "provider": "local", "gptEnabled": false, "model": null }
```

Respuesta en modo RAG:

```json
{ "mode": "RAG", "provider": "openai", "gptEnabled": true, "model": "gpt-4o-mini" }
```

## 3. Endpoints

| Método | Ruta | Función |
| :--- | :--- | :--- |
| GET | `/api/v1/knowledge/status` | Modo activo, proveedor y modelo |
| POST | `/api/v1/knowledge/chat` | Chat con GPT + fuentes o fallback local |
| POST | `/api/v1/knowledge/ask` | Búsqueda local estricta, sin proveedor externo |
| GET | `/api/v1/knowledge/sources` | Fuentes activas |
| POST | `/api/v1/knowledge/sources` | Registrar fuente `.txt` |
| DELETE | `/api/v1/knowledge/sources/{id}` | Desactivar fuente |

Todos requieren autenticación y el permiso `CONOCIMIENTO_VIEW` (salvo creación/eliminación, que
usan `CONOCIMIENTO_CREATE` y `CONOCIMIENTO_DELETE`).

`/chat` acepta la pregunta actual y el historial reciente:

```json
{
  "question": "¿y los prerrequisitos?",
  "history": [
    { "role": "user", "content": "¿Cómo se registra una matrícula?" },
    { "role": "assistant", "content": "La matrícula valida cupo, créditos y prerrequisitos." }
  ]
}
```

El backend descarta roles distintos de `user`/`assistant`, limita el historial a los últimos 8
mensajes y recorta cada mensaje a 1500 caracteres.

`/chat` devuelve:

```json
{
  "answer": "Texto de respuesta",
  "mode": "RAG",
  "greeting": false,
  "sources": [
    {
      "id": 1,
      "name": "Estructura académica",
      "category": "ACADEMICO",
      "snippet": "Fragmento utilizado...",
      "score": 12
    }
  ]
}
```

`mode` puede ser `LOCAL`, `RAG` o `GPT`. `greeting: true` indica una bienvenida local sin fuentes.

## 4. Comportamiento en la interfaz

- El botón flotante y la página `/assistant` consultan `/status`.
- Si `gptEnabled` es `true`, muestran **GPT + fuentes**; si no, **Búsqueda local**.
- Cada respuesta muestra su etiqueta de modo y las fuentes utilizadas.
- Las respuestas de GPT sin fuentes se etiquetan como **GPT · conversación**.
- Los saludos no muestran etiqueta de modo: son bienvenidas locales.
- Si el endpoint de estado falla, la interfaz mantiene **Búsqueda local** como valor seguro.
- El chat usa `/chat`; el resto de la base de conocimiento sigue funcionando igual.
- El chat es multi-turno: cada envío incluye los últimos 10 mensajes de la interfaz.
- Al terminar una respuesta, el foco vuelve al campo de consulta para seguir conversando.
- El historial de la conversación se conserva durante la sesión del navegador, no entre recargas.

## 5. Archivos implicados

Backend:

- `backend/src/main/java/com/gestoracad/service/ServicioAsistenteGpt.java`
- `backend/src/main/java/com/gestoracad/service/impl/ServicioAsistenteGptImpl.java`
- `backend/src/main/java/com/gestoracad/service/impl/ServicioConocimientoImpl.java`
- `backend/src/main/java/com/gestoracad/controller/ControladorConocimiento.java`
- `backend/src/main/java/com/gestoracad/dto/DtoConsultaAsistente.java`
- `backend/src/main/java/com/gestoracad/dto/DtoMensajeAsistente.java`
- `backend/src/main/java/com/gestoracad/dto/DtoEstadoAsistente.java`
- `backend/src/main/java/com/gestoracad/dto/DtoRespuestaAsistente.java`
- `backend/src/main/resources/application.yml`
- `backend/src/test/java/com/gestoracad/service/ServicioAsistenteGptTest.java`
- `backend/src/test/java/com/gestoracad/service/ServicioConocimientoTest.java`

Frontend:

- `frontend/src/services/knowledgeService.ts`
- `frontend/src/hooks/useAssistantStatus.ts`
- `frontend/src/components/AssistantWidget.tsx`
- `frontend/src/pages/AssistantPage.tsx`
- `frontend/src/index.css`

Infraestructura:

- `docker-compose.yml`
- `.env.example`

## 6. Pruebas

- 8 pruebas unitarias del servicio GPT con `MockRestServiceServer`:
  - modo local sin llamada externa;
  - falta de clave;
  - ausencia de contexto;
  - respuesta RAG con fuentes;
  - error 500 del proveedor con fallback;
  - estado RAG/local;
  - envío del historial para seguimientos;
  - saludo sin llamada a GPT.
- 5 pruebas de la búsqueda local, incluidas bienvenida y preguntas académicas.
- Suite completa del backend: **192 pruebas correctas**.
- Frontend: `npm run build` y `npm run lint` correctos.

No se realizó una llamada real a OpenAI porque el entorno no dispone de una clave con crédito. El
contrato HTTP, el historial y el fallback están cubiertos con mocks.

## 7. Seguridad

- La clave API nunca se expone al navegador.
- El prompt de sistema prohíbe inventar datos y seguir instrucciones del usuario que contradigan
  las reglas.
- Solo se envían los fragmentos recuperados, no la base documental completa.
- Timeouts de conexión y lectura para evitar bloqueos.
- Fallback local ante error, cuota agotada o respuesta vacía.
- Pendiente para producción: límite de consultas por usuario/IP, cuota diaria de tokens,
  auditoría de consultas, anonimización de datos personales y pruebas E2E.

## 8. Limitaciones actuales

- **RAG-lite**: la recuperación sigue siendo léxica; no hay embeddings ni índice vectorial.
- No hay fragmentación semántica ni recuperación híbrida.
- El historial se envía en cada consulta, pero no se persiste en backend ni entre recargas.
- En modo local el historial no se usa para la búsqueda: cada pregunta se puntúa por separado.
- No hay streaming de la respuesta.
- No hay panel de consumo/costos ni límites de cuota.
- La calidad depende de las fuentes cargadas en `tb_conocimiento_documentos`.

## 9. Siguientes fases

### 10.2 — RAG completo
- Fragmentación de documentos.
- Embeddings (`text-embedding-3-small` u otro).
- Índice vectorial (pgvector, Qdrant, etc.).
- Recuperación semántica e híbrida.

### 10.3 — Conversación
- Historial persistente (`tb_asistente_conversaciones`, `tb_asistente_mensajes`).
- Streaming SSE.
- Feedback del usuario.
- Métricas de calidad y costo.
