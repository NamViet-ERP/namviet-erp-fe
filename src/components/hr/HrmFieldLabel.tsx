import type { ReactNode } from 'react';

interface HrmFieldLabelProps {
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export function hrmFieldClass(hasError?: boolean, base = 'hrm-field-input') {
  return `${base}${hasError ? ' hrm-field-input--error' : ''}`;
}

export default function HrmFieldLabel({ children, required, className = '' }: HrmFieldLabelProps) {
  const cls = ['hrm-field__label', required ? 'hrm-field__label--required' : '', className]
    .filter(Boolean)
    .join(' ');

  return <label className={cls}>{children}</label>;
}
