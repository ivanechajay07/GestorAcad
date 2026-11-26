import React from 'react';

interface SectionHeaderProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * Cabecera de sección compartida por todos los módulos.
 * Mantiene el mismo lenguaje visual: icono, etiqueta, título, descripción y acciones.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  id,
  eyebrow,
  title,
  description,
  icon,
  aside,
  compact = false,
  className = '',
}) => (
  <div className={`section-head${compact ? ' section-head--compact' : ''} ${className}`.trim()}>
    <div className="section-head__identity">
      {icon && (
        <span className="section-head__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="section-head__copy">
        {eyebrow && <span className="section-head__eyebrow">{eyebrow}</span>}
        <h2 id={id} className="section-head__title">{title}</h2>
        {description && <p className="section-head__desc">{description}</p>}
      </div>
    </div>
    {aside && <div className="section-head__aside">{aside}</div>}
  </div>
);
