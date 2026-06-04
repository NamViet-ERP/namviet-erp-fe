import { PackageSearch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: LucideIcon;
}

export default function EmptyState({ message = 'Không tìm thấy dữ liệu nào!', icon: Icon = PackageSearch }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'var(--md-secondary-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={36} style={{ color: 'var(--md-on-secondary-container)' }} />
      </div>
      <p
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: '1rem',
          fontWeight: 500,
          color: 'var(--md-on-surface-variant)',
          textAlign: 'center',
          maxWidth: '320px',
        }}
      >
        {message}
      </p>
    </div>
  );
}
