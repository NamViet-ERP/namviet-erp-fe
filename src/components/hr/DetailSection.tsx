import type { ReactNode } from 'react';

interface DetailSectionProps {
  title: string;
  children: ReactNode;
  description?: string;
}

export default function DetailSection({ title, children, description }: DetailSectionProps) {
  return (
    <section className="hrm-detail-section">
      <div className="hrm-detail-section__head">
        <h3 className="hrm-detail-section__title">{title}</h3>
        {description && <p className="hrm-detail-section__desc">{description}</p>}
      </div>
      <div className="hrm-detail-section__body">{children}</div>
    </section>
  );
}
