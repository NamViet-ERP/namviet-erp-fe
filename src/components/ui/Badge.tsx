import type { StatusKey } from '../../types';
import { statusConfig } from '../../constants/statusConfig';

interface BadgeProps {
  status: StatusKey | string;
  className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const config = statusConfig[status as StatusKey];

  if (!config) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '9999px',
          background: 'var(--md-surface-variant)',
          color: 'var(--md-on-surface-variant)',
          fontFamily: "'Roboto', sans-serif",
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}
      >
        {status}
      </span>
    );
  }

  const Icon = config.icon;

  return (
    <span className={`badge ${config.className} ${className}`}>
      {Icon && <Icon size={11} />}
      {config.label}
    </span>
  );
}
