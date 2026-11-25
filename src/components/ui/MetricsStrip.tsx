import type { ReactNode } from 'react';

export type MetricsStripColumns = 'auto' | 2 | 3 | 4 | 5;
export type MetricsStripMobileColumns = 1 | 2;

export interface MetricsStripProps {
  columns?: MetricsStripColumns;
  mobileColumns?: MetricsStripMobileColumns;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}

/** Responsive KPI grid container with standardized desktop/tablet/mobile column breakpoints. */
export default function MetricsStrip({
  columns = 'auto',
  mobileColumns = 2,
  ariaLabel,
  className = '',
  children,
}: MetricsStripProps) {
  const colCls = columns !== 'auto' ? `erp-metrics-strip--cols-${columns}` : '';
  const mobileColCls = mobileColumns === 1 ? 'erp-metrics-strip--mobile-1' : '';
  const cls = ['dashboard-kpi-grid', 'erp-metrics-strip', colCls, mobileColCls, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} role="list" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
