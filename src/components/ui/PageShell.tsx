import type { ReactNode } from 'react';

export type PageShellVariant = 'list' | 'detail' | 'dashboard' | 'form' | 'settings';
export type PageShellWidth = 'full' | 'narrow';

export interface PageShellProps {
  variant?: PageShellVariant;
  width?: PageShellWidth;
  className?: string;
  children: ReactNode;
}

/** Canonical page root wrapper providing unified spacing and width rules. */
export default function PageShell({
  variant = 'list',
  width = 'full',
  className = '',
  children,
}: PageShellProps) {
  const cls = [
    'page-shell',
    'erp-page-shell',
    `erp-page-shell--${variant}`,
    width === 'narrow' ? 'erp-page-shell--narrow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={cls}>{children}</div>;
}
