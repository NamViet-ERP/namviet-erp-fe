import { useId, useMemo, useState } from 'react';
import {
  Calculator,
  ClipboardList,
  History,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import HrmSelect from '../../components/hr/HrmSelect';
import EmptyState from '../../components/ui/EmptyState';
import Card, { type KpiStat } from '../../components/ui/Card';
import type { CardAccent } from '../../types';
import PageLoader from '../../components/ui/PageLoader';
import PurDateRangePicker, { type DateRangeValue } from '../../components/purchasing/PurDateRangePicker';
import { useActivityRealtime } from '../../hooks/useActivityRealtime';
import {
  usePurchasingActivityActors,
  usePurchasingActivityFeed,
  usePurchasingDashboardSummary,
  usePurchasingDashboardVouchers,
} from '../../hooks/usePurchasingDashboard';
import type { PurchasingActivityItemApiDto } from '../../types/api/purchasingDashboardApi';

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

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
        {!isLast && <div className="pur-dash-feed__line" />}
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

type DashTile = {
  show: boolean;
  title: string;
  to: string;
  accent: CardAccent;
  icon: LucideIcon;
  stats: KpiStat[];
};

const EMPTY_VOUCHER = { show: false, stats: [] as KpiStat[] };

function tileTotal(stats: KpiStat[]): number | undefined {
  let sum = 0;
  for (const row of stats) {
    if (typeof row.value !== 'number') return undefined;
    sum += row.value;
  }
  return stats.length > 0 ? sum : undefined;
}

export default function PurchasingDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null);
  const [staffId, setStaffId] = useState('');
  const staffSelectId = useId();

  const queryParams = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return {
        period: 'custom' as const,
        staffId: staffId || undefined,
        from: new Date(`${dateRange.from}T00:00:00`).toISOString(),
        to: new Date(`${dateRange.to}T23:59:59`).toISOString(),
      };
    }
    return {
      period: 'all' as const,
      staffId: staffId || undefined,
      from: undefined as string | undefined,
      to: undefined as string | undefined,
    };
  }, [dateRange, staffId]);

  const { connected: live } = useActivityRealtime('purchasing');
  const liveOpts = { live };

  const summaryQ = usePurchasingDashboardSummary(queryParams, liveOpts);
  const vouchers = usePurchasingDashboardVouchers(dateRange?.from, dateRange?.to);
  const activityQ = usePurchasingActivityFeed(queryParams, liveOpts);
  const actorsQ = usePurchasingActivityActors(
    {
      period: queryParams.period,
      from: queryParams.from,
      to: queryParams.to,
    },
    liveOpts,
  );
  const staffOptions = useMemo(
    () => (actorsQ.data ?? []).map(a => ({ value: a.userId, label: a.name })),
    [actorsQ.data],
  );

  const activityItems = useMemo(
    () => activityQ.data?.pages.flatMap(p => p.items) ?? [],
    [activityQ.data],
  );

  const tiles: DashTile[] = [
    {
      show: (vouchers.plans ?? EMPTY_VOUCHER).show,
      title: 'Kế hoạch mua hàng',
      to: '/purchasing/plans',
      accent: 'warning',
      icon: ClipboardList,
      stats: (vouchers.plans ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.adhoc ?? EMPTY_VOUCHER).show,
      title: 'Mua hàng phát sinh',
      to: '/purchasing/adhoc',
      accent: 'purple',
      icon: ShoppingBag,
      stats: (vouchers.adhoc ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.orders ?? EMPTY_VOUCHER).show,
      title: 'Đơn hàng',
      to: '/purchasing/orders',
      accent: 'success',
      icon: ShoppingCart,
      stats: (vouchers.orders ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.estimates ?? EMPTY_VOUCHER).show,
      title: 'Mua hàng dự toán',
      to: '/purchasing/estimate-procurement',
      accent: 'info',
      icon: Calculator,
      stats: (vouchers.estimates ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.contracts ?? EMPTY_VOUCHER).show,
      title: 'Hợp đồng',
      to: '/purchasing/contracts',
      accent: 'stone',
      icon: ScrollText,
      stats: (vouchers.contracts ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.paymentPlans ?? EMPTY_VOUCHER).show,
      title: 'Kế hoạch thanh toán',
      to: '/purchasing/payment-plans',
      accent: 'neutral',
      icon: WalletCards,
      stats: (vouchers.paymentPlans ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.payments ?? EMPTY_VOUCHER).show,
      title: 'Đề nghị thanh toán',
      to: '/purchasing/payments',
      accent: 'danger',
      icon: Wallet,
      stats: (vouchers.payments ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.warranties ?? EMPTY_VOUCHER).show,
      title: 'Bảo hành / Khiếu nại',
      to: '/purchasing/warranties',
      accent: 'primary',
      icon: ShieldCheck,
      stats: (vouchers.warranties ?? EMPTY_VOUCHER).stats,
    },
  ].filter(t => t.show);

  const updatedAt = summaryQ.data?.generatedAt;
  const loading = summaryQ.isLoading;

  if (loading && !summaryQ.data) return <PageLoader />;

  return (
    <div className="pur-erp pur-dash">
      <header className="pur-erp__head pur-dash__head">
        <div className="pur-erp__head-text">
          <h1 className="pur-erp__title">Dashboard mua hàng</h1>
          <p className="pur-erp__subtitle">
            Số phiếu theo từng nghiệp vụ - ẩn mục chưa có dữ liệu
          </p>
        </div>
        {updatedAt ? (
          <p className="page-header__updated">Cập nhật lúc {formatUpdatedAt(updatedAt)}</p>
        ) : null}
      </header>

      <div className="pur-dash__layout">
        <div className="pur-dash__main">
          {tiles.length === 0 ? (
            <EmptyState message="Chưa có phiếu mua hàng trong kỳ đã chọn." />
          ) : (
            <div className="dashboard-kpi-grid" role="list" aria-label="Số phiếu mua hàng">
              {tiles.map(tile => (
                <Card
                  key={tile.to}
                  title={tile.title}
                  value={tileTotal(tile.stats)}
                  to={tile.to}
                  accent={tile.accent}
                  icon={tile.icon}
                  stats={tile.stats}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="pur-dash-feed">
          <div className="pur-dash-feed__banner">Lịch sử hoạt động</div>

          <div className="pur-dash-feed__filters">
            <div className="pur-dash__filter pur-dash__filter--full">
              <span>Theo thời gian</span>
              <PurDateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Chọn khoảng ngày"
              />
            </div>
            <label className="pur-dash__filter pur-dash__filter--full" htmlFor={staffSelectId}>
              <span>Theo nhân viên</span>
              <HrmSelect
                id={staffSelectId}
                value={staffId}
                onChange={setStaffId}
                options={staffOptions}
                placeholder="Tất cả"
                aria-label="Theo nhân viên"
              />
            </label>
            {actorsQ.isSuccess && (actorsQ.data?.length ?? 0) === 0 && (
              <p className="pur-dash-feed__hint" role="note">
                Chưa có tài khoản đăng nhập hoạt động.
              </p>
            )}
          </div>

          <div className="pur-dash-feed__list">
            {activityQ.isLoading && activityItems.length === 0 ? (
              <p className="pur-dash-feed__empty">Đang tải…</p>
            ) : activityItems.length === 0 ? (
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
              activityItems.map((item, i) => (
                <ActivityFeedItem
                  key={item.id}
                  item={item}
                  isLast={i === activityItems.length - 1 && !activityQ.hasNextPage}
                />
              ))
            )}
          </div>

          {activityQ.hasNextPage && (
            <div className="pur-dash-feed__more">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={activityQ.isFetchingNextPage}
                onClick={() => activityQ.fetchNextPage()}
              >
                {activityQ.isFetchingNextPage ? 'Đang tải…' : 'Tải thêm'}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
