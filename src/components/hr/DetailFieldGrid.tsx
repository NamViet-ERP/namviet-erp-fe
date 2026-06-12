import type { ReactNode } from 'react';

type GridLayout = 'responsive' | 'two' | 'three';

const GRID_CLASS: Record<GridLayout, string> = {
  responsive: 'hrm-field-grid hrm-field-grid--responsive',
  two: 'hrm-field-grid hrm-field-grid--two',
  three: 'hrm-field-grid hrm-field-grid--three',
};

interface DetailFieldGridProps {
  children: ReactNode;
  layout?: GridLayout;
  className?: string;
}

export default function DetailFieldGrid({ children, layout = 'responsive', className = '' }: DetailFieldGridProps) {
  return <div className={`${GRID_CLASS[layout]} ${className}`.trim()}>{children}</div>;
}
