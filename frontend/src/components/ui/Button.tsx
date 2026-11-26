import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Botón base del sistema.
 * Los estilos viven en CSS (`index.css`) mediante `data-variant` y `data-size`
 * para mantener una única escala de tamaños, radios y estados.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  style,
  ...props
}) => (
  <button
    className={`btn ${className}`.trim()}
    data-variant={variant}
    data-size={size}
    disabled={disabled || isLoading}
    aria-busy={isLoading || undefined}
    style={style}
    {...props}
  >
    {isLoading ? (
      <span className="btn__spinner" aria-hidden="true" />
    ) : (
      leftIcon
    )}
    {children}
    {!isLoading && rightIcon}
  </button>
);
