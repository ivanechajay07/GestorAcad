import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import type { BreadcrumbItem } from './Breadcrumbs';

export interface PageHeaderStat {
  label: string;
  value: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  stats?: PageHeaderStat[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  accent = 'var(--primary)',
  badges,
  actions,
  breadcrumbs,
  stats,
}) => {
  return (
    <header className="page-header animate-fade-in">
      {(breadcrumbs?.length || badges) && (
        <div className="page-header__top">
          {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
          {badges && <div className="page-header__badges">{badges}</div>}
        </div>
      )}

      <div className="page-header__main">
        <div className="page-header__lead">
          {icon && (
            <span
              className="page-header__icon"
              style={{ background: `color-mix(in srgb, ${accent} 88%, #0b1020)` }}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div className="page-header__copy">
            <h1 className="page-header__title">{title}</h1>
            {subtitle && <p className="page-header__sub">{subtitle}</p>}
          </div>
        </div>

        {actions && <div className="page-header__actions">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="page-header__stats">
          {stats.map((stat) => (
            <div key={stat.label} className="page-header__stat">
              <span className="v">{stat.value}</span>
              <span className="l">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
