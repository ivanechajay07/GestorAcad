import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'warn' | 'danger' | 'info' | 'primary' | 'role' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: 'var(--status-up-bg)', text: 'var(--status-up-text)', dot: 'var(--status-up)', border: 'color-mix(in srgb, var(--status-up) 32%, transparent)' };
      case 'warning':
      case 'warn':
        return { bg: 'var(--status-warn-bg)', text: 'var(--status-warn-text)', dot: 'var(--status-warn)', border: 'color-mix(in srgb, var(--status-warn) 32%, transparent)' };
      case 'danger':
        return { bg: 'var(--status-down-bg)', text: 'var(--status-down-text)', dot: 'var(--status-down)', border: 'color-mix(in srgb, var(--status-down) 32%, transparent)' };
      case 'info':
        return { bg: 'color-mix(in srgb, var(--accent-cyan) 14%, transparent)', text: 'var(--accent-cyan-text)', dot: 'var(--accent-cyan)', border: 'color-mix(in srgb, var(--accent-cyan) 32%, transparent)' };
      case 'role':
        return { bg: 'color-mix(in srgb, var(--primary) 12%, transparent)', text: 'var(--primary-hover)', dot: 'var(--primary)', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' };
      case 'outline':
        return { bg: 'transparent', text: 'var(--text-secondary)', dot: 'var(--text-secondary)', border: 'var(--border-light)' };
      case 'primary':
      default:
        return { bg: 'var(--primary-glow)', text: 'var(--primary-hover)', dot: 'var(--primary)', border: 'color-mix(in srgb, var(--primary) 32%, transparent)' };
    }
  };

  const colors = getColors();

  return (
    <span
      className="badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        fontSize: size === 'sm' ? '0.75rem' : '0.78rem',
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        borderRadius: '9999px',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        lineHeight: 1,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: colors.dot,
          }}
        />
      )}
      {children}
    </span>
  );
};
