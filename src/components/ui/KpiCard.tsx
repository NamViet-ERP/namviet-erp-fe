import type { LucideIcon } from 'lucide-react';
import type { CardAccent } from '../../types';
import Card, { type KpiStat } from './Card';

export type KpiCardTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_TO_ACCENT: Record<KpiCardTone, CardAccent> = {
  primary: 'blue',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
};

export interface KpiCardProps {
  label: string;
  value?: string | number;
  hint?: string;
  tone?: KpiCardTone;
  icon?: LucideIcon;
  stats?: KpiStat[];
  trend?: number;
  trendLabel?: string;
  to?: string;
  onClick?: () => void;
  selected?: boolean;
  loading?: boolean;
  className?: string;
}

/** Canonical KPI card delegating to Card, with built-in skeleton loading state. */
export default function KpiCard({
  label,
  value,
  hint,
  tone = 'primary',
  icon,
  stats,
  trend,
  trendLabel,
  to,
  onClick,
  selected = false,
  loading = false,
  className = '',
}: KpiCardProps) {
  const accent = TONE_TO_ACCENT[tone];

  if (loading) {
    const loadingCls = [
      'card-md',
      'kpi-card',
      `kpi-card--accent-${accent}`,
      'erp-kpi-card--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <article className={loadingCls} role="listitem" aria-busy="true" aria-label={label}>
        <div className="erp-kpi-card__skeleton-body">
          <div className="skeleton erp-kpi-card__skeleton-label" />
          <div className="skeleton erp-kpi-card__skeleton-value" />
        </div>
      </article>
    );
  }

  return (
    <Card
      title={label}
      value={value}
      subtitle={hint}
      stats={stats}
      to={to}
      accent={accent}
      icon={icon}
      trend={trend}
      trendLabel={trendLabel}
      className={className}
      onClick={onClick}
      selected={selected}
    />
  );
}
