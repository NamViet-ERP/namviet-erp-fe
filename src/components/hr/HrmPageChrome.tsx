import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface HrmPageChromeProps {
  onBack: () => void;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function HrmBackButton({ onBack, label = 'Quay lại' }: { onBack: () => void; label?: string }) {
  return (
    <button type="button" onClick={onBack} className="hrm-back-btn">
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}

export function HrmDetailHeader({ onBack, title, subtitle, actions }: HrmPageChromeProps) {
  return (
    <div className="hrm-detail-header">
      <HrmBackButton onBack={onBack} />
      <div className="hrm-detail-header__row">
        <div className="hrm-detail-header__main">
          <h1 className="hrm-detail-header__title">{title}</h1>
          {subtitle && <p className="hrm-detail-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="hrm-detail-header__actions">{actions}</div>}
      </div>
    </div>
  );
}
