import type { CSSProperties } from 'react';
import EmptyState from '../../../components/ui/EmptyState';
import type { DashboardActivityItem } from '../../../lib/wms/warehouseDashboardData';

export function ActivityFeed({ items }: { items: DashboardActivityItem[] }) {
  if (items.length === 0) {
    return <EmptyState message="Chưa có hoạt động phiếu kho." />;
  }

  return (
    <div>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="activity-feed__item">
          <div className="activity-feed__rail">
            <div className="activity-feed__dot" style={{ '--activity-accent': item.accent } as CSSProperties} />
            {index < items.length - 1 && <div className="activity-feed__line" />}
          </div>
          <div className="activity-feed__body">
            <p className="activity-feed__label">{item.label}</p>
            <div className="activity-feed__meta">
              <span
                className="activity-feed__value activity-feed__value--accent"
                style={{ '--activity-accent': item.accent } as CSSProperties}
              >
                {item.value}
              </span>
              <span className="activity-feed__time">{item.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
