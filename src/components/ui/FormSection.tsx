import type { ReactNode } from 'react';

export interface FormSectionHeaderProps {
  title: string;
  step?: number;
  className?: string;
}

/** Step-numbered section header for structured ERP forms. */
export function FormSectionHeader({ title, step, className = '' }: FormSectionHeaderProps) {
  return (
    <div className={['hrm-form-section-header', className].filter(Boolean).join(' ')}>
      {step !== undefined && <span className="hrm-form-section-header__step">{step}</span>}
      <h3 className="hrm-form-section-header__title">{title}</h3>
    </div>
  );
}

export interface FormSectionProps {
  step?: number;
  title: string;
  description?: string;
  columns?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}

/** Structured form section with optional step badge and responsive 1/2/3-column grid. */
export default function FormSection({
  step,
  title,
  description,
  columns = 2,
  className = '',
  children,
}: FormSectionProps) {
  return (
    <section className={['erp-form-section', className].filter(Boolean).join(' ')}>
      <FormSectionHeader step={step} title={title} />
      {description ? <p className="erp-form-section__desc">{description}</p> : null}
      <div className={`erp-form-section__grid erp-form-section__grid--cols-${columns}`}>
        {children}
      </div>
    </section>
  );
}
