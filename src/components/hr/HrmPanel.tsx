import type { ReactNode } from 'react';
import Panel from '../ui/Panel';

interface HrmPanelProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  title?: string;
  subtitle?: string;
}

/**
 * Legacy wrapper: forwards to unified Panel in src/components/ui/Panel.
 */
export default function HrmPanel(props: HrmPanelProps) {
  return <Panel {...props} />;
}
