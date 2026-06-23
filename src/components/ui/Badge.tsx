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
      <span className={`badge badge-md-neutral ${className}`}>
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
