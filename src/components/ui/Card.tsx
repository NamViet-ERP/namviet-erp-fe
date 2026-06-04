import type { LucideIcon } from 'lucide-react';
import type { CardAccent } from '../../types';

/* ─────────────────────────────────────────────────────────
   Material Design 3 — KPI Card Component
   Surface Container bg · 24px radius · Tonal elevation
   ───────────────────────────────────────────────────────── */

interface AccentStyle {
  containerBg: string;
  iconColor: string;
  blurColor: string;
  valueSuffix: string;
}

const accentMap: Record<CardAccent, AccentStyle> = {
  amber: {
    containerBg:  'var(--md-tertiary-container)',
    iconColor:    'var(--md-on-tertiary-container)',
    blurColor:    'rgba(125, 82, 96, 0.12)',
    valueSuffix:  '⬆',
  },
  blue: {
    containerBg:  'var(--md-primary-container)',
    iconColor:    'var(--md-on-primary-container)',
    blurColor:    'rgba(103, 80, 164, 0.12)',
    valueSuffix:  '',
  },
  teal: {
    containerBg:  'var(--md-secondary-container)',
    iconColor:    'var(--md-on-secondary-container)',
    blurColor:    'rgba(98, 91, 113, 0.12)',
    valueSuffix:  '',
  },
  purple: {
    containerBg:  'var(--md-primary-container)',
    iconColor:    'var(--md-on-primary-container)',
    blurColor:    'rgba(103, 80, 164, 0.12)',
    valueSuffix:  '',
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

  const trendBg    = trend !== undefined && trend > 0 ? 'var(--md-success-container)'
                   : trend !== undefined && trend < 0 ? 'var(--md-error-container)'
                   : 'var(--md-surface-variant)';
  const trendColor = trend !== undefined && trend > 0 ? 'var(--md-success)'
                   : trend !== undefined && trend < 0 ? 'var(--md-error)'
                   : 'var(--md-on-surface-variant)';
  const trendIcon  = trend !== undefined && trend > 0 ? '↑' : trend !== undefined && trend < 0 ? '↓' : '—';

  return (
    <div
      className={`card-md card-md-interactive cursor-default select-none ${className}`}
      style={{ overflow: 'visible' }}
    >
      {/* Ambient blur shape — behind card */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: c.blurColor,
          filter: 'blur(32px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header: label + icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: 'var(--md-on-surface-variant)',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </p>
          {Icon && (
            <div
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                background: c.containerBg,
                color: c.iconColor,
                flexShrink: 0,
              }}
            >
              <Icon size={20} />
            </div>
          )}
        </div>

        {/* Value */}
        <p
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--md-on-surface)',
            letterSpacing: '-0.01em',
            marginBottom: subtitle ? '4px' : '12px',
          }}
        >
          {value}
        </p>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 400,
              color: 'var(--md-on-surface-variant)',
              marginBottom: '12px',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Trend badge */}
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '9999px',
                background: trendBg,
                color: trendColor,
                fontFamily: "'Roboto', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}
            >
              {trendIcon} {trend !== 0 ? `${Math.abs(trend)}%` : '0%'}
            </span>
            {trendLabel && (
              <span
                style={{
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: '0.75rem',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
