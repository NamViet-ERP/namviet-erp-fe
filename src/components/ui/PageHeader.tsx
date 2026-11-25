import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

export interface BackButtonProps {
  onBack: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ onBack, label = 'Quay lại', className = '' }: BackButtonProps) {
  const cls = ['page-header__back', className].filter(Boolean).join(' ');
  return (
    <button type="button" onClick={onBack} className={cls}>
      <ArrowLeft size={16} aria-hidden />
      <span>{label}</span>
    </button>
  );
}

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: 'default' | 'detail';
  onBack?: () => void;
  backLabel?: string;
  hideBackButton?: boolean;
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  variant = 'default',
  onBack,
  backLabel = 'Quay lại',
  hideBackButton = false,
}: PageHeaderProps) {
  const isDetail = variant === 'detail' || Boolean(onBack);

  if (isDetail) {
    return (
      <header className="page-header page-header--detail">
        {onBack && !hideBackButton ? <BackButton onBack={onBack} label={backLabel} /> : null}
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
