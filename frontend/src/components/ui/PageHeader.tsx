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
  iconVariant?: 'default' | 'avatar';
  accent?: string;
  eyebrow?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  stats?: PageHeaderStat[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconVariant = 'default',
  accent = 'var(--primary)',
  eyebrow,
  badges,
  actions,
  breadcrumbs,
  stats,
}) => {
  const hasContext = Boolean(eyebrow || breadcrumbs?.length || badges);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    event.currentTarget.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    event.currentTarget.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <header
      className="page-header page-header--hero animate-fade-in"
      style={{ '--hero-accent': accent } as React.CSSProperties}
      onPointerMove={handlePointerMove}
    >
      <span className="page-header__ambient" aria-hidden="true">
        <span className="page-header__orb page-header__orb--a" />
        <span className="page-header__orb page-header__orb--b" />
        <span className="page-header__grid" />
        {icon && iconVariant !== 'avatar' && <span className="page-header__watermark">{icon}</span>}
      </span>

      <div className="page-header__content">
        {hasContext && (
          <div className="page-header__top">
            <div className="page-header__context">
              {eyebrow ? (
                <span className="page-header__eyebrow">{eyebrow}</span>
              ) : (
                breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />
              )}
            </div>
            {badges && <div className="page-header__badges">{badges}</div>}
          </div>
        )}

        <div className="page-header__main">
          <div className="page-header__lead">
            {icon && (
              <span
                className={`page-header__icon${iconVariant === 'avatar' ? ' page-header__icon--avatar' : ''}`}
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
      </div>
    </header>
  );
};
