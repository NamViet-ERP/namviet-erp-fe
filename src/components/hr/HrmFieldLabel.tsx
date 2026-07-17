import type { ReactNode } from 'react';

interface HrmFieldLabelProps {
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export default function HrmFieldLabel({ children, required, className = '' }: HrmFieldLabelProps) {
  const cls = ['hrm-field__label', required ? 'hrm-field__label--required' : '', className]
    .filter(Boolean)
    .join(' ');

  return <label className={cls}>{children}</label>;
}
