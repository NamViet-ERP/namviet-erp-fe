import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { CardAccent } from '../../types';

export type KpiStatTone = 'default' | 'warn' | 'danger' | 'ok' | 'info' | 'neutral';

export type KpiStat = {
  label: string;
  value: number | string;
  tone?: KpiStatTone;
};

interface CardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  stats?: KpiStat[];
  to?: string;
  accent?: CardAccent;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

function cardAriaLabel(title: string, value: string | number | undefined, stats?: KpiStat[]) {
  if (stats && stats.length > 0) {
    return `${title}: ${stats.map(s => `${s.label} ${s.value}`).join(', ')}`;
  }
  return `${title}: ${value ?? ''}`;
}

export default function Card({
  title,
  value,
  subtitle,
  stats,
  to,
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
  const hasStats = Boolean(stats && stats.length > 0);
  const cls = [
    'card-md',
    'kpi-card',
    `kpi-card--accent-${accent}`,
    hasStats ? 'kpi-card--breakdown' : '',
    to ? 'kpi-card--link' : '',
    className,
  ].filter(Boolean).join(' ');
  const label = cardAriaLabel(title, value, stats);

  const inner = (
    <>
      {Icon ? (
        <div className="kpi-card__icon" aria-hidden>
          <Icon size={18} strokeWidth={2} />
        </div>
      ) : null}
      <div className="kpi-card__body">
        <div className="kpi-card__head">
          <p className="kpi-card__label">{title}</p>
          {hasStats && value !== undefined && value !== '' ? (
            <p className="kpi-card__total">{value}</p>
          ) : null}
        </div>
        {hasStats ? (
          <ul className="kpi-card__stats">
            {stats!.map(stat => {
              const tone = stat.tone && stat.tone !== 'default' ? ` kpi-card__stat--${stat.tone}` : '';
              return (
                <li key={stat.label} className={`kpi-card__stat${tone}`}>
                  <span className="kpi-card__stat-label">{stat.label}</span>
                  <span className="kpi-card__stat-value">{stat.value}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <>
            <p className="kpi-card__value">{value}</p>
            {subtitle ? <p className="kpi-card__subtitle">{subtitle}</p> : null}
          </>
        )}
        {trend !== undefined && (
          <div className="kpi-card__trend-row">
            <span className={`kpi-card__trend badge ${trendClass}`}>
              {trendIcon} {trend !== 0 ? `${Math.abs(trend)}%` : '0%'}
            </span>
            {trendLabel && <span className="kpi-card__trend-label">{trendLabel}</span>}
          </div>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} role="listitem" aria-label={label}>
        {inner}
      </Link>
    );
  }

  return (
    <article className={cls} role="listitem" aria-label={label}>
      {inner}
    </article>
  );
}
