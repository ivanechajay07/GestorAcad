import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Select } from '../components/ui/Select';
import {
  BookOpen,
  Bot,
  FileText,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useAssistantStatus } from '../hooks/useAssistantStatus';
import { knowledgeService } from '../services/knowledgeService';
import type { AssistantSourceDto, KnowledgeSourceDto } from '../services/knowledgeService';

type Message = {
  role: 'user' | 'assistant';
  text: string;
  sources?: AssistantSourceDto[];
  mode?: string;
  greeting?: boolean;
};

const roleInfo: Record<string, { label: string; intro: string; questions: string[] }> = {
  UNIVERSIDAD: {
    label: 'Universidad',
    intro: 'Consulta procesos institucionales y orienta a tu comunidad académica.',
    questions: [
      '¿Qué información debe tener la base de conocimiento?',
      '¿Cómo se organiza la estructura académica?',
      '¿Qué roles contempla el portal?',
    ],
  },
  DOCENTE: {
    label: 'Docente',
    intro: 'Encuentra orientación para tu labor docente y consulta las fuentes institucionales.',
    questions: [
      '¿Dónde consulto mis cursos asignados?',
      '¿Cómo se calcula el promedio de un acta?',
      '¿Qué pasa cuando cierro un acta?',
    ],
  },
  ESTUDIANTE: {
    label: 'Estudiante',
    intro: 'Resuelve dudas académicas con la base de conocimiento del portal.',
    questions: [
      '¿Cómo consulto mi avance académico?',
      '¿Qué es un periodo académico?',
      '¿Cómo se registra una matrícula?',
    ],
  },
};

const CATEGORIES = ['GENERAL', 'ACADEMICO', 'EVALUACION', 'PORTALES', 'SEGURIDAD'];

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General',
  ACADEMICO: 'Académico',
  EVALUACION: 'Evaluación',
  PORTALES: 'Portales',
  SEGURIDAD: 'Seguridad',
};

const formatCharacters = (value: number): string =>
  new Intl.NumberFormat('es-PE').format(value);

/**
 * Asistente académico con recuperación local en el servidor.
 * No utiliza un proveedor GPT: busca en la base documental persistente.
 */
export const AssistantPage: React.FC = () => {
  const { role, user, hasPermission } = useAuth();
  const { confirm } = useConfirm();
  const assistantStatus = useAssistantStatus();
  const gptEnabled = assistantStatus?.gptEnabled === true;
  const modeLabel = gptEnabled ? 'GPT + fuentes' : 'Búsqueda local';
  const info = roleInfo[role ?? ''] ?? { ...roleInfo.UNIVERSIDAD, label: 'Comunidad académica' };
  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'comunidad';
  const canCreate = hasPermission('CONOCIMIENTO_CREATE');
  const canDelete = hasPermission('CONOCIMIENTO_DELETE');

  const [sources, setSources] = useState<KnowledgeSourceDto[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('GENERAL');
  const [uploadNote, setUploadNote] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const loadSources = useCallback(async () => {
    setSourcesLoading(true);
    try {
      const response = await knowledgeService.listSources();
      setSources(response.data);
    } catch {
      setUploadNote({ tone: 'warn', text: 'No se pudieron cargar las fuentes de conocimiento.' });
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    thread.scrollTo({ top: thread.scrollHeight, behavior });
  }, [messages, busy]);

  const ask = async (question: string) => {
    const prompt = question.trim();
    if (!prompt || busy) return;

    const history = messages
      .filter((message) => message.text.trim())
      .slice(-10)
      .map((message) => ({ role: message.role, content: message.text }));

    setMessages((items) => [...items, { role: 'user', text: prompt }]);
    setDraft('');
    setBusy(true);

    try {
      const response = await knowledgeService.chat(prompt, history);
      setMessages((items) => [
        ...items,
        {
          role: 'assistant',
          text: response.data.answer,
          sources: response.data.sources,
          mode: response.data.mode,
          greeting: response.data.greeting === true,
        },
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          role: 'assistant',
          text: 'No se pudo consultar la base de conocimiento. Verifica la conexión e inténtalo nuevamente.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const addFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith('.txt')) {
      setUploadNote({ tone: 'warn', text: 'Por ahora se admiten archivos .txt en la base de conocimiento.' });
      return;
    }

    const text = await file.text();
    if (!text.trim()) {
      setUploadNote({ tone: 'warn', text: 'El archivo está vacío; no se agregó a las fuentes.' });
      return;
    }

    try {
      const response = await knowledgeService.createSource({
        name: file.name,
        category: uploadCategory,
        content: text.slice(0, 100000),
      });
      setUploadNote({
        tone: 'ok',
        text: `«${response.data.name}» se agregó a la base de conocimiento.`,
      });
      await loadSources();
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setUploadNote({ tone: 'warn', text: message ?? 'No se pudo guardar el documento.' });
    }
  };

  const removeSource = async (source: KnowledgeSourceDto) => {
    const ok = await confirm({
      title: 'Desactivar fuente',
      message: `¿Desactivar «${source.name}» de la base de conocimiento? Dejará de usarse en las respuestas.`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await knowledgeService.deleteSource(source.id);
      setUploadNote({ tone: 'ok', text: `«${source.name}» fue desactivada.` });
      await loadSources();
    } catch {
      setUploadNote({ tone: 'warn', text: 'No se pudo desactivar la fuente.' });
    }
  };

  const composer = (variant: 'hero' | 'dock') => (
    <form
      className={`assistant-composer${variant === 'hero' ? ' assistant-composer--hero' : ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        void ask(draft);
      }}
    >
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void ask(draft);
          }
        }}
        placeholder="Escribe tu consulta académica..."
        aria-label="Escribe tu consulta académica"
        aria-describedby="assistant-composer-hint"
        rows={variant === 'hero' ? 3 : 2}
      />
      <div className="assistant-composer__footer">
        <span id="assistant-composer-hint">
          <Paperclip size={14} aria-hidden="true" /> Enter envía · Shift+Enter agrega una línea
        </span>
        <button
          type="submit"
          className="assistant-composer__send"
          disabled={!draft.trim() || busy}
          aria-label="Enviar consulta"
        >
          <Send size={17} />
        </button>
      </div>
    </form>
  );

  return (
    <div className="assistant-page">
      <PageHeader
        title="Asistente académico"
        subtitle="Consulta la base de conocimiento institucional y revisa las fuentes de cada respuesta."
        icon={<Sparkles size={22} />}
        accent="var(--primary)"
        breadcrumbs={[{ label: 'Portal Académico' }, { label: 'Asistente académico' }]}
        badges={<Badge variant="info" dot>{modeLabel}</Badge>}
      />

      <div className="assistant-notice" role="note">
        <Sparkles size={17} aria-hidden="true" />
        <span>
          {gptEnabled ? (
            <>
              <strong>Modo RAG.</strong> Las respuestas combinan GPT con las fuentes institucionales.
              Si el proveedor falla, se usa automáticamente la búsqueda local.
            </>
          ) : (
            <>
              <strong>Modo local.</strong> Las respuestas se buscan en la base de conocimiento del servidor.
              No se utiliza GPT ni se envían documentos a servicios externos.
            </>
          )}
        </span>
      </div>

      <div className="assistant-grid">
        <section className="assistant-chat" aria-label="Conversación con el asistente" aria-busy={busy}>
          {messages.length === 0 ? (
            <div className="assistant-welcome">
              <div className="assistant-orb" aria-hidden="true"><Bot size={26} /></div>
              <span className="assistant-eyebrow">CONSULTA ACADÉMICA · {info.label.toLocaleUpperCase()}</span>
              <h2>Hola, {firstName}. ¿Qué necesitas consultar?</h2>
              <p>
                {info.intro} Las respuestas provienen de las fuentes registradas en el portal.
              </p>
              <div className="assistant-launch">{composer('hero')}</div>
              <div className="assistant-prompts">
                {info.questions.map((question) => (
                  <button key={question} type="button" onClick={() => void ask(question)}>
                    {question}
                    <MessageCircle size={15} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="assistant-thread" ref={threadRef} aria-live="polite">
                {messages.map((message, index) => (
                  <article
                    className={`assistant-message assistant-message--${message.role}`}
                    key={`${index}-${message.text.slice(0, 12)}`}
                  >
                    <span className="assistant-avatar" aria-hidden="true">
                      {message.role === 'assistant' ? <Sparkles size={15} /> : <UserRound size={15} />}
                    </span>
                    <div>
                      <div className="assistant-message__name">
                        {message.role === 'assistant' ? 'Asistente académico' : 'Tú'}
                      </div>
                      <p>{message.text}</p>
                      {message.role === 'assistant' && message.mode && !message.greeting && (
                        <span className={`assistant-message__mode${message.mode === 'RAG' || message.mode === 'GPT' ? ' is-rag' : ''}`}>
                          {message.mode === 'RAG'
                            ? 'GPT + fuentes'
                            : message.mode === 'GPT'
                              ? 'GPT · conversación'
                              : 'Búsqueda local'}
                        </span>
                      )}
                      {message.sources && message.sources.length > 0 && (
                        <div className="assistant-message__sources">
                          {message.sources.map((source) => (
                            <span key={`${source.id}-${source.name}`} title={source.snippet}>
                              <BookOpen size={12} aria-hidden="true" /> {source.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
                {busy && (
                  <div className="assistant-typing" role="status">
                    <span /><span /><span /> Buscando en la base de conocimiento
                  </div>
                )}
              </div>
              {composer('dock')}
            </>
          )}
        </section>

        <aside className="assistant-sources" aria-label="Base de conocimiento">
          <div className="assistant-sources__heading">
            <div>
              <span className="assistant-eyebrow">CONTEXTO</span>
              <h3>Base de conocimiento</h3>
            </div>
            <span className="assistant-source-count" aria-label={`${sources.length} fuentes disponibles`}>
              {sources.length}
            </span>
          </div>

          <p className="assistant-sources__intro">
            Documentos activos que orientan las respuestas del asistente.
          </p>

          {sourcesLoading ? (
            <div className="assistant-source-list" aria-hidden="true">
              <span className="notif-skeleton" />
              <span className="notif-skeleton" />
            </div>
          ) : sources.length === 0 ? (
            <div className="assistant-source-empty">
              <FileText size={20} aria-hidden="true" />
              <strong>Sin fuentes activas</strong>
              <span>Un administrador puede agregar la primera guía institucional.</span>
            </div>
          ) : (
            <div className="assistant-source-list">
              {sources.map((source) => (
                <div className="assistant-source" key={source.id}>
                  <span aria-hidden="true"><FileText size={16} /></span>
                  <div className="assistant-source__body">
                    <strong>{source.name}</strong>
                    <small>{CATEGORY_LABELS[source.category] ?? source.category} · {formatCharacters(source.characters)} caracteres</small>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      className="assistant-source__delete"
                      onClick={() => void removeSource(source)}
                      aria-label={`Desactivar ${source.name}`}
                      title="Desactivar fuente"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {canCreate && (
            <>
              <div className="assistant-upload-row">
                <Select
                  className="assistant-upload-category"
                  value={uploadCategory}
                  onChange={(event) => setUploadCategory(event.target.value)}
                  aria-label="Categoría del documento"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
                <button className="assistant-upload" type="button" onClick={() => fileRef.current?.click()}>
                  <Upload size={16} aria-hidden="true" /> Agregar .txt
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,text/plain"
                hidden
                onChange={(event) => {
                  void addFile(event.target.files?.[0]);
                  event.currentTarget.value = '';
                }}
              />
            </>
          )}

          {uploadNote && (
            <p className={`assistant-upload-note assistant-upload-note--${uploadNote.tone}`} role="status">
              {uploadNote.text}
            </p>
          )}

          <div className="assistant-source-footnote">
            Los documentos se guardan en la base institucional. Las respuestas son extractos de esas fuentes,
            no texto generado por IA.
          </div>

          {messages.length > 0 && (
            <button className="assistant-clear" type="button" onClick={() => setMessages([])}>
              <Trash2 size={14} aria-hidden="true" /> Limpiar conversación
            </button>
          )}
        </aside>
      </div>
    </div>
  );
};
