import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  light?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, light = false }) => {
  const baseColor = light ? 'rgba(255, 255, 255, 0.82)' : 'var(--text-muted)';
  const currentColor = light ? '#ffffff' : 'var(--text-secondary)';

  return (
    <nav
      aria-label="Ruta de navegación"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: 'var(--text-xs)',
        color: baseColor,
        flexWrap: 'wrap',
      }}
    >
      <Link
        to="/dashboard"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: baseColor, textDecoration: 'none' }}
      >
        <Home size={13} />
        Inicio
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          <ChevronRight size={13} style={{ opacity: 0.6 }} />
          {item.to && index < items.length - 1 ? (
            <Link to={item.to} style={{ color: baseColor, textDecoration: 'none' }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: currentColor, fontWeight: 600 }}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
