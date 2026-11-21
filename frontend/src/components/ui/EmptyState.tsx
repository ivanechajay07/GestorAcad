import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '10px',
        padding: '36px 20px',
        color: 'var(--text-muted)',
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-muted)',
        }}
      >
        {icon ?? <Inbox size={24} />}
      </span>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</div>
      {description && <div style={{ fontSize: 'var(--text-base)', maxWidth: '380px', lineHeight: 1.5 }}>{description}</div>}
      {action}
    </div>
  );
};
