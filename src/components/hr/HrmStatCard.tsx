import type { LucideIcon } from 'lucide-react';

export type HrmStatTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface HrmStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: HrmStatTone;
}

export default function HrmStatCard({ label, value, hint, icon: Icon, tone = 'primary' }: HrmStatCardProps) {
  return (
    <div className={`hrm-stat-card hrm-stat-card--${tone}`}>
      <div className="hrm-stat-card__head">
        <p className="hrm-stat-card__label">{label}</p>
        {Icon ? (
          <div className="hrm-stat-card__icon" aria-hidden>
            <Icon size={16} strokeWidth={1.75} />
          </div>
        ) : null}
      </div>
      <p className="hrm-stat-card__value">{value}</p>
      {hint ? <p className="hrm-stat-card__hint">{hint}</p> : null}
    </div>
  );
}
