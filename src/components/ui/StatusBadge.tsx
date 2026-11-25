import type { LucideIcon } from 'lucide-react';
import type { StatusKey } from '../../types';
import Badge from './Badge';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral';

// eslint-disable-next-line react-refresh/only-export-components
export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  error: 'badge badge-error',
  info: 'badge badge-info',
  primary: 'badge badge-md-primary',
  neutral: 'badge badge-neutral',
};

export interface StatusBadgeProps {
  status?: StatusKey | string;
  tone?: StatusTone;
  label?: string;
  icon?: LucideIcon;
  className?: string;
}

/** Unified status pill supporting domain StatusKey lookup (via Badge) or explicit tone + label. */
export default function StatusBadge({
  status,
  tone,
  label,
  icon: Icon,
  className = '',
}: StatusBadgeProps) {
  if (!tone && status !== undefined) {
    return <Badge status={status} label={label} className={className} />;
  }

  const resolvedTone: StatusTone = tone ?? 'neutral';
  const displayLabel = label ?? status ?? '';
  const cls = [STATUS_TONE_CLASS[resolvedTone], className].filter(Boolean).join(' ');

  return (
    <span className={cls}>
      {Icon ? <Icon size={11} aria-hidden /> : null}
      {displayLabel}
    </span>
  );
}
