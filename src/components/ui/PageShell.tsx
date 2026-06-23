import type { ReactNode } from 'react';

type PageShellVariant = 'default' | 'hrm' | 'portal' | 'dense';

interface PageShellProps {
  children: ReactNode;
  variant?: PageShellVariant;
  className?: string;
}

const variantClass: Record<PageShellVariant, string> = {
  default: 'page-shell',
  hrm: 'page-shell page-shell--hrm',
  portal: 'page-shell page-shell--portal',
  dense: 'page-shell page-shell--dense',
};

/** Consistent page wrapper: spacing, typography rhythm, staggered section enter. */
export default function PageShell({ children, variant = 'default', className = '' }: PageShellProps) {
  return (
    <div className={`${variantClass[variant]}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
