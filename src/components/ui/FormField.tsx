import type { ReactNode } from 'react';

/**
 * MD3 Form Field wrapper
 * Props: label, required, error, children, className
 */

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({ label, required, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="form-label">
          {required && (
            <span className="form-label__required" aria-hidden>*</span>
          )}
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="form-field__error animate-fade-in" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
