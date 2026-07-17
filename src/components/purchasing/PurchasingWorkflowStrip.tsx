import { Link } from 'react-router-dom';
import { PURCHASING_STEPS } from '../../constants/purchasingWorkflow';

interface PurchasingWorkflowStripProps {
  activeId?: string;
}

/** Thanh bước trên Tổng quan — bấm vào là vào đúng màn. */
export default function PurchasingWorkflowStrip({ activeId }: PurchasingWorkflowStripProps) {
  return (
    <nav className="purchasing-flow" aria-label="Các bước mua hàng">
      <ol className="purchasing-flow__list">
        {PURCHASING_STEPS.map(step => {
          const active = step.id === activeId;
          return (
            <li key={step.id} className={`purchasing-flow__item${active ? ' is-active' : ''}`}>
              <Link to={step.path} className="purchasing-flow__card">
                <span className="purchasing-flow__num">{step.step}</span>
                <span className="purchasing-flow__text">
                  <span className="purchasing-flow__title">{step.title}</span>
                  <span className="purchasing-flow__what">{step.what}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
