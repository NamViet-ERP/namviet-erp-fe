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
            <span style={{ color: 'var(--md-error)', marginRight: '2px' }}>*</span>
          )}
          {label}
        </label>
      )}
      {children}
      {error && (
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '0.75rem',
            fontWeight: 400,
            color: 'var(--md-error)',
            marginTop: '4px',
            lineHeight: 1.4,
          }}
          className="animate-fade-in"
        >
          {error}
        </p>
      )}
    </div>
  );
}
