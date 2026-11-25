import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: 'default' | 'detail';
  onBack?: () => void;
  backLabel?: string;
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  variant = 'default',
  onBack,
  backLabel = 'Quay lại',
}: PageHeaderProps) {
  const isDetail = variant === 'detail' || Boolean(onBack);

  if (isDetail) {
    return (
      <header className="page-header page-header--detail">
        {onBack ? (
          <button type="button" onClick={onBack} className="page-header__back">
            <ArrowLeft size={16} aria-hidden />
            <span>{backLabel}</span>
          </button>
        ) : null}
        <div className="page-header__detail-row">
          <div className="page-header__content">
            {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
            <h1 className="page-header__title">{title}</h1>
            {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-header__actions">{actions}</div>}
        </div>
      </header>
    );
  }

  return (
    <header className="page-header">
      <div className="page-header__content">
        {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
