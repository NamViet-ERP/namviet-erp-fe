import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export interface PageBreadcrumbItem {
  label: string;
  to?: string;
}

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
  breadcrumbs?: ReadonlyArray<PageBreadcrumbItem>;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: 'default' | 'detail';
  onBack?: () => void;
  backLabel?: string;
  hideBackButton?: boolean;
}

function PageBreadcrumbs({ items }: { items?: ReadonlyArray<PageBreadcrumbItem> }) {
  if (!items || items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="page-header__breadcrumbs">
      <ol className="page-header__breadcrumb-list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="page-header__breadcrumb-item">
              {idx > 0 && (
                <ChevronRight size={13} className="page-header__breadcrumb-sep" aria-hidden />
              )}
              {!isLast && item.to ? (
                <Link to={item.to} className="page-header__breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="page-header__breadcrumb-current"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function PageHeader({
  breadcrumbs,
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
            <PageBreadcrumbs items={breadcrumbs} />
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
        <PageBreadcrumbs items={breadcrumbs} />
        {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
