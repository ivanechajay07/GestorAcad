import type React from 'react';

/** Estilo base compartido por controles de formulario. */
export const formControlStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '40px',
  padding: '9px 11px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-strong)',
  color: 'var(--text-main)',
  fontFamily: 'inherit',
  fontSize: '0.84rem',
  lineHeight: 1.4,
};

/** Etiqueta consistente para formularios. */
export const formLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
  lineHeight: 1.35,
};
