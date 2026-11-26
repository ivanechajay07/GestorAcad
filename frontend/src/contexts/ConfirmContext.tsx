import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ ...options, resolve });
    });
  }, []);

  const value = useMemo<ConfirmContextType>(() => ({ confirm }), [confirm]);
  const variant = state?.variant ?? 'primary';

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {state && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape') close(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--overlay)',
            backdropFilter: 'blur(4px)',
            padding: '20px',
          }}
          onClick={() => close(false)}
        >
          <div
            className="animate-fade-in"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 id="confirm-dialog-title" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '8px' }}>
              {state.title ?? 'Confirmar acción'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', marginBottom: '24px' }}>
              {state.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" autoFocus onClick={() => close(false)}>
                {state.cancelLabel ?? 'Cancelar'}
              </Button>
              <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={() => close(true)}>
                {state.confirmLabel ?? 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm debe ser utilizado dentro de un ConfirmProvider');
  }
  return context;
};
