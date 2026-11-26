import React from 'react';

interface PageSkeletonProps {
  /** Reservado para variantes específicas de módulos con estructuras muy distintas. */
  variant?: 'default';
}

/**
 * Esqueleto de carga para el cambio de módulo.
 * Mantiene la estructura visual de una página para evitar saltos bruscos y
 * anuncia el estado a lectores de pantalla.
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant = 'default' }) => (
  <div
    className={`page-skeleton page-skeleton--${variant}`}
    role="status"
    aria-live="polite"
    aria-label="Cargando módulo"
    aria-busy="true"
  >
    <div className="page-skeleton__header">
      <div className="page-skeleton__heading">
        <span className="skeleton-block skeleton-block--eyebrow" />
        <span className="skeleton-block skeleton-block--title" />
        <span className="skeleton-block skeleton-block--subtitle" />
      </div>
      <span className="skeleton-block skeleton-block--action" />
    </div>

    <div className="page-skeleton__toolbar">
      <span className="skeleton-block skeleton-block--search" />
      <span className="skeleton-block skeleton-block--button" />
      <span className="skeleton-block skeleton-block--button" />
    </div>

    <div className="page-skeleton__cards">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="page-skeleton__card" key={index}>
          <span className="skeleton-block skeleton-block--line-sm" />
          <span className="skeleton-block skeleton-block--value" />
          <span className="skeleton-block skeleton-block--line" />
        </div>
      ))}
    </div>

    <div className="page-skeleton__panel">
      <div className="page-skeleton__panel-head">
        <span className="skeleton-block skeleton-block--title-sm" />
        <span className="skeleton-block skeleton-block--button" />
      </div>
      {Array.from({ length: 6 }, (_, index) => (
        <div className="page-skeleton__row" key={index}>
          <span className="skeleton-block skeleton-block--line" />
          <span className="skeleton-block skeleton-block--line-sm" />
          <span className="skeleton-block skeleton-block--line-sm" />
          <span className="skeleton-block skeleton-block--pill" />
        </div>
      ))}
    </div>

    <span className="sr-only">Cargando módulo…</span>
  </div>
);
