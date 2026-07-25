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
  const fieldClass = ['form-field', error ? 'form-field--error' : '', className].filter(Boolean).join(' ');

  return (
    <div className={fieldClass}>
      {label && (
        <label className="form-label">
          {label}
          {required ? (
            <span className="form-label__required" aria-hidden>
              {' '}
              *
            </span>
          ) : null}
        </label>
      )}
      {children}
      <p
        className={`form-field__error${error ? '' : ' form-field__error--reserved'}`}
        role={error ? 'alert' : undefined}
        aria-live="polite"
      >
        {error || '\u00a0'}
      </p>
    </div>
  );
}
