import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  size?: 'md' | 'lg';
  titleId?: string;
  closeLabel?: string;
}

const SIZE_WIDTH: Record<'md' | 'lg', string> = {
  md: '640px',
  lg: '820px',
};

/**
 * Modal compartido con cabecera, cierre accesible, bloqueo de scroll,
 * cierre con Escape y trampa de foco.
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  children,
  maxWidth,
  size = 'md',
  titleId,
  closeLabel = 'Cerrar ventana',
}) => {
  const generatedId = useId().replace(/:/g, '');
  const resolvedTitleId = titleId ?? `modal-title-${generatedId}`;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const preferred = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]');
      (preferred ?? closeRef.current)?.focus();
    }, 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        style={{ maxWidth: maxWidth ?? SIZE_WIDTH[size] }}
      >
        <header className="modal-head">
          {icon && <span className="modal-head-icon" aria-hidden="true">{icon}</span>}
          <div className="modal-heading">
            <h3 id={resolvedTitleId} className="modal-title">{title}</h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="modal-close"
            onClick={() => onCloseRef.current()}
            aria-label={closeLabel}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
};
