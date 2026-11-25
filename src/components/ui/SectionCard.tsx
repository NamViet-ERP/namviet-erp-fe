import { forwardRef, type ReactNode } from 'react';
import Panel, { type PanelProps } from './Panel';

export interface SectionCardProps extends PanelProps {
  id?: string;
  footer?: ReactNode;
  highlighted?: boolean;
}

/** Standard section card wrapping Panel with optional footer and highlighted state. */
const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(function SectionCard(
  { id, footer, highlighted = false, className = '', children, ...panelProps },
  ref,
) {
  const sectionClasses = [
    'erp-section-card',
    highlighted ? 'erp-section-card--highlighted rounded-xl' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (id || ref) {
    return (
      <div ref={ref} id={id} className={sectionClasses}>
        <Panel {...panelProps} className={className}>
          {children}
          {footer ? <div className="erp-section-card__footer">{footer}</div> : null}
        </Panel>
      </div>
    );
  }

  return (
    <Panel {...panelProps} className={[sectionClasses, className].filter(Boolean).join(' ')}>
      {children}
      {footer ? <div className="erp-section-card__footer">{footer}</div> : null}
    </Panel>
  );
});

export default SectionCard;
