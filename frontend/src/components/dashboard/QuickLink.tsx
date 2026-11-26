import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';

export interface QuickLinkProps {
  to: string;
  kicker: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent?: string;
  className?: string;
}

/** Acceso directo a un módulo operativo del sistema. */
export const QuickLink: React.FC<QuickLinkProps> = ({
  to,
  kicker,
  title,
  description,
  icon,
  accent = 'var(--primary)',
  className = '',
}) => (
  <Link to={to} className="link-clean">
    <Card
      interactive
      className={`card-fill dash-quick ${className}`.trim()}
      style={{ padding: 'clamp(11px, 1.5vw, 14px)' }}
    >
      <div className="dash-quick__head">
        <span
          className="dash-quick__icon"
          style={{ '--quick-accent': accent } as React.CSSProperties}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="dash-quick__text">
          <div className="dash-quick__kicker">{kicker}</div>
          <h4 className="dash-quick__title">{title}</h4>
        </div>
        <span className="dash-quick__arrow" aria-hidden="true">
          <ArrowUpRight size={16} />
        </span>
      </div>
      <p className="dash-quick__desc">{description}</p>
    </Card>
  </Link>
);
