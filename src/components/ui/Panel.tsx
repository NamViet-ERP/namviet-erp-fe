import type { ReactNode } from 'react';

export interface PanelProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Standard container surface for ERP lists, filters, settings, and tables.
 * Provides unified border, background, and padding across all modules.
 */
export default function Panel({
  children,
  className = '',
  noPadding = false,
  title,
  subtitle,
  actions,
}: PanelProps) {
  return (
    <div className={`panel hrm-panel ${noPadding ? 'panel-flush hrm-panel-flush' : ''} ${className}`}>
      {(title || subtitle || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {subtitle && <p className="text-sm text-[var(--md-on-surface-variant)]">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
