import type { LucideIcon } from 'lucide-react';
import type { CardAccent } from '../../types';

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: CardAccent;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export default function Card({
  title,
  value,
  subtitle,
  accent = 'blue',
  icon: Icon,
  trend,
  trendLabel,
  className = '',
}: CardProps) {
  const trendClass =
    trend !== undefined && trend > 0 ? 'badge-md-success'
      : trend !== undefined && trend < 0 ? 'badge-md-error'
        : 'badge-md-neutral';
  const trendIcon = trend !== undefined && trend > 0 ? '↑' : trend !== undefined && trend < 0 ? '↓' : '-';

  return (
    <article
      className={`card-md kpi-card kpi-card--accent-${accent} ${className}`.trim()}
      role="listitem"
      aria-label={`${title}: ${value}`}
    >
      {Icon ? (
        <div className="kpi-card__icon" aria-hidden>
          <Icon size={18} strokeWidth={2} />
        </div>
      ) : null}
      <div className="kpi-card__body">
        <p className="kpi-card__label">{title}</p>
        <p className="kpi-card__value">{value}</p>
        {subtitle ? <p className="kpi-card__subtitle">{subtitle}</p> : null}
        {trend !== undefined && (
          <div className="kpi-card__trend-row">
            <span className={`kpi-card__trend badge ${trendClass}`}>
              {trendIcon} {trend !== 0 ? `${Math.abs(trend)}%` : '0%'}
            </span>
            {trendLabel && <span className="kpi-card__trend-label">{trendLabel}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
