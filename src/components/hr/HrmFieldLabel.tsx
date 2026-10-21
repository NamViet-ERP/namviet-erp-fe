import type { ReactNode } from 'react';

interface HrmFieldLabelProps {
  children: ReactNode;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

export default function HrmFieldLabel({ children, required, className = '', htmlFor }: HrmFieldLabelProps) {
  const cls = ['hrm-field__label', required ? 'hrm-field__label--required' : '', className]
    .filter(Boolean)
    .join(' ');

  return <label className={cls} htmlFor={htmlFor}>{children}</label>;
}
