import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { formControlStyle, formLabelStyle } from '../ui/formStyles';
import { getApiErrorMessage } from '../../utils/apiErrors';

export const academicInputStyle: React.CSSProperties = formControlStyle;

export const academicLabelStyle: React.CSSProperties = formLabelStyle;

export const academicErrMsg = (err: unknown, fallback: string): string => getApiErrorMessage(err, fallback);

export const academicFormatDate = (value?: string): string => {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const AcademicField: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  htmlFor?: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, children, hint, error, htmlFor, icon, className = '' }) => (
  <div className={`field ${className}`.trim()}>
    <label className="field-label" htmlFor={htmlFor}>
      {icon && <span className="field-label__icon" aria-hidden="true">{icon}</span>}
      {label}
    </label>
    {children}
    {error ? (
      <span className="field-error" role="alert">{error}</span>
    ) : hint ? (
      <span className="field-hint">{hint}</span>
    ) : null}
  </div>
);

export const AcademicFormError: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div className="form-error-banner" role="alert">
      <AlertCircle size={16} aria-hidden="true" />
      <span>{message}</span>
    </div>
  ) : null;

export const AcademicModal: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  maxWidth?: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, maxWidth = '640px', onClose, children }) => (
  <Modal
    title={title}
    subtitle={subtitle}
    icon={icon}
    maxWidth={maxWidth}
    onClose={onClose}
  >
    {children}
  </Modal>
);
