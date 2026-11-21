import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error no controlado en la interfaz:', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.assign('/dashboard');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          className="glass-panel"
          style={{ maxWidth: '520px', width: '100%', padding: '32px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }} aria-hidden="true">
            ⚠️
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '10px' }}>
            Ocurrió un error inesperado
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
            La aplicación encontró un problema al renderizar esta vista. Puede volver al panel principal e intentarlo de nuevo.
          </p>
          {this.state.message && (
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                marginBottom: '20px',
                wordBreak: 'break-word',
              }}
            >
              {this.state.message}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-contrast)',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Volver al panel principal
          </button>
        </div>
      </div>
    );
  }
}
