import type React from 'react';
import { PackageSearch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export default function EmptyState({
  message = 'Không có dữ liệu.',
  icon: Icon = PackageSearch,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon-wrap" aria-hidden>
        <Icon size={22} className="empty-state__icon" />
      </div>
      <p className="empty-state__message">{message}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
