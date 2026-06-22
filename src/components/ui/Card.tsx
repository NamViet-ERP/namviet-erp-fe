import type { LucideIcon } from 'lucide-react';
import type { CardAccent } from '../../types';

interface AccentStyle {
  containerBg: string;
  iconColor: string;
  blurColor: string;
  valueSuffix: string;
}

const accentMap: Record<CardAccent, AccentStyle> = {
  amber: {
    containerBg: 'var(--md-warning-container)',
    iconColor: 'var(--md-on-warning-container)',
    blurColor: 'color-mix(in srgb, var(--md-warning) 14%, transparent)',
    valueSuffix: '⬆',
  },
  blue: {
    containerBg: 'var(--md-primary-container)',
    iconColor: 'var(--md-on-primary-container)',
    blurColor: 'color-mix(in srgb, var(--md-primary) 14%, transparent)',
    valueSuffix: '',
  },
  teal: {
    containerBg: 'var(--md-secondary-container)',
    iconColor: 'var(--md-on-secondary-container)',
    blurColor: 'color-mix(in srgb, var(--md-secondary) 14%, transparent)',
    valueSuffix: '',
  },
  purple: {
    containerBg: 'var(--md-primary-container)',
    iconColor: 'var(--md-on-primary-container)',
    blurColor: 'color-mix(in srgb, var(--md-primary) 14%, transparent)',
    valueSuffix: '',
  },
};

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
  const c = accentMap[accent] || accentMap.blue;

  const trendClass =
    trend !== undefined && trend > 0 ? 'badge-md-success'
      : trend !== undefined && trend < 0 ? 'badge-md-error'
        : 'badge-md-neutral';
  const trendIcon = trend !== undefined && trend > 0 ? '↑' : trend !== undefined && trend < 0 ? '↓' : '—';

  return (
    <div className={`card-md card-md-interactive kpi-card kpi-card--accent-${accent} cursor-default select-none ${className}`}>
      <div className="kpi-card__ambient" aria-hidden />
      <div className="kpi-card__body">
        <div className="kpi-card__head">
          <p className="kpi-card__label">{title}</p>
          {Icon && (
            <div className="kpi-card__icon">
              <Icon size={20} />
            </div>
          )}
        </div>
        <p className={`kpi-card__value ${subtitle ? 'kpi-card__value--spaced' : 'kpi-card__value--tight'}`}>
          {value}{c.valueSuffix}
        </p>
        {subtitle && <p className="kpi-card__subtitle">{subtitle}</p>}
        {trend !== undefined && (
          <div className="kpi-card__trend-row">
            <span className={`kpi-card__trend badge ${trendClass}`}>
              {trendIcon} {trend !== 0 ? `${Math.abs(trend)}%` : '0%'}
            </span>
            {trendLabel && <span className="kpi-card__trend-label">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
