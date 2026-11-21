import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { knowledgeService } from '../services/knowledgeService';
import type { AssistantSourceDto } from '../services/knowledgeService';
import { useAssistantStatus } from '../hooks/useAssistantStatus';

type WidgetMessage = {
  role: 'user' | 'assistant';
  text: string;
  mode?: string;
  greeting?: boolean;
  sources?: AssistantSourceDto[];
};

const SUGGESTIONS = [
  '¿Cómo se registra una matrícula?',
  '¿Cómo consulto mis cursos matriculados?',
  '¿Cómo se calcula el promedio de un acta?',
  '¿Qué es un periodo académico?',
  '¿Cómo consulto mi portal de estudiante?',
];

interface AssistantWidgetProps {
  suppressed?: boolean;
}

/**
 * Asistente flotante disponible en todas las páginas autenticadas.
 * Usa la misma base de conocimiento local del módulo /assistant.
 */
export const AssistantWidget: React.FC<AssistantWidgetProps> = ({ suppressed = false }) => {
  const location = useLocation();
  const assistantStatus = useAssistantStatus();
  const gptEnabled = assistantStatus?.gptEnabled === true;
  const modeLabel = gptEnabled ? 'GPT + fuentes' : 'Búsqueda local';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window === 'undefined' ? 800 : window.innerHeight
  );
  const [keyboardInset, setKeyboardInset] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const closeWidget = () => {
    setOpen(false);
    window.setTimeout(() => fabRef.current?.focus(), 0);
  };

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeWidget();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const visualViewport = window.visualViewport;

    const updateViewport = () => {
      const height = visualViewport?.height ?? window.innerHeight;
      const inset = visualViewport
        ? Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
        : 0;
      setViewportHeight(height);
      setKeyboardInset(inset);
    };

    updateViewport();
    visualViewport?.addEventListener('resize', updateViewport);
    visualViewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    return () => {
      visualViewport?.removeEventListener('resize', updateViewport);
      visualViewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const field = inputRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, 96)}px`;
  }, [draft, open]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    body.scrollTo({ top: body.scrollHeight, behavior });
  }, [messages, busy, open]);

  if (location.pathname === '/assistant') return null;

  const panelStyle: React.CSSProperties = {
    bottom: `calc(80px + ${keyboardInset}px)`,
    maxHeight: `${Math.max(220, Math.min(620, viewportHeight - 130))}px`,
  };

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
          mode: response.data.mode,
          greeting: response.data.greeting === true,
          sources: response.data.sources,
        },
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          role: 'assistant',
          text: 'No se pudo consultar la base de conocimiento. Inténtalo nuevamente.',
        },
      ]);
    } finally {
      setBusy(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={`assistant-widget-root${suppressed ? ' is-hidden' : ''}`}>
      {open && (
        <section
          id="assistant-widget-panel"
          className="assistant-widget"
          role="dialog"
          aria-label="Asistente académico"
          aria-modal="false"
          style={panelStyle}
        >
          <header className="assistant-widget__head">
            <span className="assistant-widget__icon" aria-hidden="true"><Sparkles size={17} /></span>
            <div>
              <strong>Asistente académico</strong>
              <small>{gptEnabled ? 'GPT + fuentes · con citas' : 'Búsqueda local · sin GPT'}</small>
            </div>
            <div className="assistant-widget__head-actions">
              {messages.length > 0 && (
                <button
                  type="button"
                  className="assistant-widget__icon-btn"
                  onClick={() => {
                    setMessages([]);
                    inputRef.current?.focus();
                  }}
                  aria-label="Limpiar conversación"
                  title="Limpiar conversación"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <Link
                to="/assistant"
                className="assistant-widget__icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Abrir asistente en página completa"
                title="Abrir página completa"
              >
                <ArrowUpRight size={15} />
              </Link>
              <button
                type="button"
                className="assistant-widget__icon-btn"
                onClick={closeWidget}
                aria-label="Cerrar asistente"
              >
                <X size={15} />
              </button>
            </div>
          </header>

          <div className="assistant-widget__body" ref={bodyRef} aria-live="polite">
            {messages.length === 0 ? (
              <div className="assistant-widget__empty">
                <span className="assistant-widget__empty-icon" aria-hidden="true"><MessageCircle size={20} /></span>
                <strong>¿En qué puedo ayudarte?</strong>
                <p>Pregúntame sobre matrícula, cursos, actas, periodos o portales.</p>
                <div className="assistant-widget__suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => void ask(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <article
                    key={`${index}-${message.text.slice(0, 12)}`}
                    className={`assistant-widget__message assistant-widget__message--${message.role}`}
                  >
                    <p>{message.text}</p>
                    {message.role === 'assistant' && message.mode && !message.greeting && (
                      <span className={`assistant-widget__mode-tag${message.mode === 'RAG' || message.mode === 'GPT' ? ' is-rag' : ''}`}>
                        {message.mode === 'RAG'
                          ? 'GPT + fuentes'
                          : message.mode === 'GPT'
                            ? 'GPT · conversación'
                            : 'Búsqueda local'}
                      </span>
                    )}
                    {message.sources && message.sources.length > 0 && (
                      <div className="assistant-widget__sources">
                        {message.sources.map((source) => (
                          <span key={`${source.id}-${source.name}`} title={source.snippet}>
                            <BookOpen size={11} aria-hidden="true" /> {source.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
                {busy && (
                  <div className="assistant-widget__typing" role="status">
                    <span /><span /><span /> Buscando en las fuentes
                  </div>
                )}
              </>
            )}
          </div>

          <form
            className="assistant-widget__composer"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(draft);
            }}
          >
            <label htmlFor="assistant-widget-input" className="sr-only">Consulta académica</label>
            <textarea
              id="assistant-widget-input"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void ask(draft);
                }
              }}
              placeholder="Ej. ¿Cómo se registra una matrícula?"
              aria-describedby="assistant-widget-hint"
            />
            <span id="assistant-widget-hint" className="sr-only">
              Enter envía la consulta. Shift+Enter agrega una nueva línea.
            </span>
            <button type="submit" disabled={!draft.trim() || busy} aria-label="Enviar consulta">
              <Send size={16} />
            </button>
          </form>
        </section>
      )}

      <button
        ref={fabRef}
        type="button"
        className={`assistant-fab${open ? ' is-open' : ''}`}
        onClick={() => {
          if (open) {
            closeWidget();
          } else {
            setOpen(true);
          }
        }}
        aria-label={open ? 'Cerrar asistente académico' : 'Abrir asistente académico'}
        aria-expanded={open}
        aria-controls="assistant-widget-panel"
      >
        <span className="assistant-fab__content">
          <span className="assistant-fab__icon-wrap" aria-hidden="true">
            <span className="assistant-fab__icon">
              {open ? <X size={19} /> : <Sparkles size={19} />}
            </span>
          </span>
          <span className="assistant-fab__text">
            <span className="assistant-fab__label">{open ? 'Cerrar asistente' : 'Asistente'}</span>
            <span className="assistant-fab__mode">
              <i aria-hidden="true" /> {modeLabel}
            </span>
          </span>
        </span>
      </button>
    </div>
  );
};
