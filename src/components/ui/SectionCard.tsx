import { forwardRef, type ForwardedRef, type ReactNode } from 'react';
import Panel, { type PanelProps } from './Panel';

export type SectionCardVariant = 'default' | 'detail';

export interface SectionCardProps extends PanelProps {
  id?: string;
  footer?: ReactNode;
  highlighted?: boolean;
  variant?: SectionCardVariant;
  description?: string;
}

/** Standard section card wrapping Panel with optional detail variant, footer, and highlighted state. */
const SectionCard = forwardRef<HTMLElement, SectionCardProps>(function SectionCard(
  {
    id,
    footer,
    highlighted = false,
    variant = 'default',
    description,
    subtitle,
    title,
    actions,
    noPadding = false,
    className = '',
    children,
    ...panelProps
  },
  ref,
) {
  const desc = description ?? subtitle;
  const sectionClasses = [
    'erp-section-card',
    highlighted ? 'erp-section-card--highlighted rounded-xl' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (variant === 'detail') {
    const detailClasses = [sectionClasses, 'hrm-detail-section', className]
      .filter(Boolean)
      .join(' ');

    return (
      <section ref={ref} id={id} className={detailClasses}>
        {title || desc || actions ? (
          <div className="hrm-detail-section__head">
            {actions ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {title ? <h3 className="hrm-detail-section__title">{title}</h3> : null}
                  {desc ? <p className="hrm-detail-section__desc">{desc}</p> : null}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
              </div>
            ) : (
              <>
                {title ? <h3 className="hrm-detail-section__title">{title}</h3> : null}
                {desc ? <p className="hrm-detail-section__desc">{desc}</p> : null}
              </>
            )}
          </div>
        ) : null}
        {noPadding ? children : <div className="hrm-detail-section__body">{children}</div>}
        {footer ? <div className="erp-section-card__footer">{footer}</div> : null}
      </section>
    );
  }

  if (id || ref) {
    return (
      <div ref={ref as ForwardedRef<HTMLDivElement>} id={id} className={sectionClasses}>
        <Panel
          {...panelProps}
          title={title}
          subtitle={desc}
          actions={actions}
          noPadding={noPadding}
          className={className}
        >
          {children}
          {footer ? <div className="erp-section-card__footer">{footer}</div> : null}
        </Panel>
      </div>
    );
  }

  return (
    <Panel
      {...panelProps}
      title={title}
      subtitle={desc}
      actions={actions}
      noPadding={noPadding}
      className={[sectionClasses, className].filter(Boolean).join(' ')}
    >
      {children}
      {footer ? <div className="erp-section-card__footer">{footer}</div> : null}
    </Panel>
  );
});

export default SectionCard;
