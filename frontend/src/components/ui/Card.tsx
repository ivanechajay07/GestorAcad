import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  footer?: React.ReactNode;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  extra,
  footer,
  interactive = false,
  className = '',
  style,
}) => {
  return (
    <div
      className={`glass-panel ${interactive ? 'glass-panel-interactive' : ''} ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        padding: 'clamp(14px, 1.8vw, 20px)',
        ...style,
      }}
    >
      {(title || extra) && (
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '14px',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '10px',
          }}
        >
          <div>
            {title && (
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}

      <div className="card-body" style={{ flex: 1, minHeight: 0 }}>{children}</div>

      {footer && (
        <div
          className="card-footer"
          style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
