import type { LucideIcon } from 'lucide-react';

interface HrmStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'neutral';
}

export default function HrmStatCard({ label, value, hint, icon: Icon, tone = 'primary' }: HrmStatCardProps) {
  return (
    <div className={`hrm-stat-card hrm-stat-card--${tone}`}>
      <div className="hrm-stat-card__icon">
        <Icon size={18} />
      </div>
      <div className="hrm-stat-card__body">
        <p className="hrm-stat-card__label">{label}</p>
        <p className="hrm-stat-card__value">{value}</p>
        {hint && <p className="hrm-stat-card__hint">{hint}</p>}
      </div>
    </div>
  );
}
