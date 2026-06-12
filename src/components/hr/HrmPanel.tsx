import type { ReactNode } from 'react';

interface HrmPanelProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

/** Elevated card surface for HRM lists, filters, and tables. */
export default function HrmPanel({ children, className = '', noPadding = false }: HrmPanelProps) {
  return (
    <div className={`hrm-panel ${noPadding ? 'hrm-panel-flush' : ''} ${className}`}>
      {children}
    </div>
  );
}
