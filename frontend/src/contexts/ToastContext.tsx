import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  title?: string;
  duration?: number;
}

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  title?: string;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const VARIANT_CONFIG: Record<ToastVariant, { icon: React.ReactNode; label: string }> = {
  success: { icon: <CheckCircle2 size={17} />, label: 'Operación completada' },
  error: { icon: <AlertCircle size={17} />, label: 'No se pudo completar' },
  warning: { icon: <AlertTriangle size={17} />, label: 'Revisa la información' },
  info: { icon: <Info size={17} />, label: 'Información' },
};

const MAX_VISIBLE_TOASTS = 4;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', options: ToastOptions = {}) => {
      const id = ++counter.current;
      const toast: Toast = {
        id,
        message,
        variant,
        title: options.title,
        duration: options.duration ?? 4500,
      };

      setToasts((current) => {
        // Evita duplicar el mismo aviso si se dispara dos veces seguidas.
        const withoutDuplicate = current.filter(
          (item) => !(item.message === toast.message && item.variant === toast.variant)
        );
        return [...withoutDuplicate.slice(-(MAX_VISIBLE_TOASTS - 1)), toast];
      });

      if (toast.duration > 0) {
        window.setTimeout(() => dismiss(id), toast.duration);
      }
    },
    [dismiss]
  );

  const value = useMemo<ToastContextType>(
    () => ({
      showToast,
      dismiss,
      success: (message, options) => showToast(message, 'success', options),
      error: (message, options) => showToast(message, 'error', options),
      info: (message, options) => showToast(message, 'info', options),
      warning: (message, options) => showToast(message, 'warning', options),
    }),
    [showToast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const config = VARIANT_CONFIG[toast.variant];
          const role = toast.variant === 'error' || toast.variant === 'warning' ? 'alert' : 'status';
          return (
            <div
              key={toast.id}
              role={role}
              className={`toast toast--${toast.variant}`}
              style={{ '--toast-duration': `${toast.duration}ms` } as React.CSSProperties}
            >
              <span className="toast__icon" aria-hidden="true">{config.icon}</span>
              <div className="toast__body">
                <div className="toast__title">{toast.title ?? config.label}</div>
                <div className="toast__message">{toast.message}</div>
              </div>
              <button
                type="button"
                className="toast__close"
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar notificación"
              >
                <X size={15} aria-hidden="true" />
              </button>
              {toast.duration > 0 && <span className="toast__progress" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
};
