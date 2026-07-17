import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';

interface ModuleUiPlaceholderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  emptyMessage: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

/** Shared UI-only page chrome for modules without BE yet. */
export default function ModuleUiPlaceholder({
  eyebrow,
  title,
  subtitle,
  emptyMessage,
  icon,
  actions,
}: ModuleUiPlaceholderProps) {
  return (
    <div className="page-shell">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions} />
      <EmptyState message={emptyMessage} icon={icon} />
    </div>
  );
}
