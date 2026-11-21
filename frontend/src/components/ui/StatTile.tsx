import React from 'react';
import { Card } from './Card';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color?: string;
  hint?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, icon, color = 'var(--primary)', hint }) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 6, lineHeight: 1.1 }}>
          {value}
        </div>
        {hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 6 }}>{hint}</div>}
      </div>
      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          background: `color-mix(in srgb, ${color} 16%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        }}
      >
        {icon}
      </span>
    </div>
  </Card>
);
