import type { StatusKey } from '../../types';
import { statusConfig } from '../../constants/statusConfig';

interface BadgeProps {
  status: StatusKey | string;
  label?: string;
  className?: string;
}

export default function Badge({ status, label, className = '' }: BadgeProps) {
  const config = statusConfig[status as StatusKey];
  const displayLabel = label ?? config?.label ?? status;

  if (!config) {
    return (
      <span className={`badge badge-md-neutral ${className}`}>
        {displayLabel}
      </span>
    );
  }

  const Icon = config.icon;

  return (
    <span className={`badge ${config.className} ${className}`}>
      {Icon && <Icon size={11} />}
      {displayLabel}
    </span>
  );
}
