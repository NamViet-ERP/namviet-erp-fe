import type { ReactNode } from 'react';

interface HrmPanelProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  title?: string;
  subtitle?: string;
}

/** Elevated card surface for HRM lists, filters, and tables. */
export default function HrmPanel({
  children,
  className = '',
  noPadding = false,
  title,
  subtitle,
}: HrmPanelProps) {
  return (
    <div className={`hrm-panel ${noPadding ? 'hrm-panel-flush' : ''} ${className}`}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {subtitle && <p className="text-sm text-[var(--md-on-surface-variant)]">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
