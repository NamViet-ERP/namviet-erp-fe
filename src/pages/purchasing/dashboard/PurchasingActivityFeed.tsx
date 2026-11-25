import { History } from 'lucide-react';
import HrmSelect from '../../../components/hr/HrmSelect';
import PurDateRangePicker, { type DateRangeValue } from '../../../components/purchasing/PurDateRangePicker';
import Button from '../../../components/ui/Button';
import type { PurchasingActivityItemApiDto } from '../../../types/api/purchasingDashboardApi';

function formatRelativeVi(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return 'Vừa xong';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} tiếng trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleString('vi-VN');
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ActivityFeedItem({
  item,
  isLast,
}: {
  item: PurchasingActivityItemApiDto;
  isLast: boolean;
}) {
  return (
    <article className="pur-dash-feed__item">
      <div className="pur-dash-feed__rail" aria-hidden>
        <div className="pur-dash-feed__avatar">{initials(item.actorName)}</div>
        {!isLast ? <div className="pur-dash-feed__line" /> : null}
      </div>
      <div className="pur-dash-feed__body">
        <div className="pur-dash-feed__meta">
          <strong className="pur-dash-feed__name">{item.actorName}</strong>
          <span className="pur-dash-feed__time">{formatRelativeVi(item.occurredAt)}</span>
          <span className="pur-dash-feed__badge">{item.categoryLabel}</span>
        </div>
        <p className="pur-dash-feed__msg">{item.message}</p>
      </div>
    </article>
  );
}

interface PurchasingActivityFeedProps {
  dateRange: DateRangeValue | null;
  onDateRangeChange: (next: DateRangeValue | null) => void;
  staffSelectId: string;
  staffId: string;
  onStaffIdChange: (next: string) => void;
  staffOptions: Array<{ value: string; label: string }>;
  noActiveActors: boolean;
  items: PurchasingActivityItemApiDto[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export default function PurchasingActivityFeed({
  dateRange,
  onDateRangeChange,
  staffSelectId,
  staffId,
  onStaffIdChange,
  staffOptions,
  noActiveActors,
  items,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: PurchasingActivityFeedProps) {
  return (
    <aside className="pur-dash-feed">
      <div className="pur-dash-feed__banner">Lịch sử hoạt động</div>

      <div className="pur-dash-feed__filters">
        <div className="pur-dash__filter pur-dash__filter--full">
          <span>Theo thời gian</span>
          <PurDateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            placeholder="Chọn khoảng ngày"
          />
        </div>
        <label className="pur-dash__filter pur-dash__filter--full" htmlFor={staffSelectId}>
          <span>Theo nhân viên</span>
          <HrmSelect
            id={staffSelectId}
            value={staffId}
            onChange={onStaffIdChange}
            options={staffOptions}
            placeholder="Tất cả"
            aria-label="Theo nhân viên"
          />
        </label>
        {noActiveActors ? (
          <p className="pur-dash-feed__hint" role="note">
            Chưa có tài khoản đăng nhập hoạt động.
          </p>
        ) : null}
      </div>

      <div className="pur-dash-feed__list">
        {isLoading && items.length === 0 ? (
          <p className="pur-dash-feed__empty">Đang tải…</p>
        ) : items.length === 0 ? (
          <div className="pur-dash-feed__empty-box">
            <div className="pur-dash-feed__empty-icon" aria-hidden>
              <History size={20} strokeWidth={1.75} />
            </div>
            <p className="pur-dash-feed__empty-title">Chưa có hoạt động</p>
            <p className="pur-dash-feed__empty-desc">
              Thao tác KHMH / PO / NK sẽ hiện ở đây.
            </p>
          </div>
        ) : (
          items.map((item, i) => (
            <ActivityFeedItem
              key={item.id}
              item={item}
              isLast={i === items.length - 1 && !hasNextPage}
            />
          ))
        )}
      </div>

      {hasNextPage ? (
        <div className="pur-dash-feed__more">
          <Button
            type="button"
            variant="outlined"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
          >
            {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm'}
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
