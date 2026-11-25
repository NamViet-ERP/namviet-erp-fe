import { useId, useMemo, useState } from 'react';
import {
  Calculator,
  ClipboardList,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import type { DateRangeValue } from '../../components/purchasing/PurDateRangePicker';
import type { KpiStat } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import KpiCard, { type KpiCardTone } from '../../components/ui/KpiCard';
import MetricsStrip from '../../components/ui/MetricsStrip';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import PageShell from '../../components/ui/PageShell';
import { useActivityRealtime } from '../../hooks/useActivityRealtime';
import {
  usePurchasingActivityActors,
  usePurchasingActivityFeed,
  usePurchasingDashboardSummary,
  usePurchasingDashboardVouchers,
} from '../../hooks/usePurchasingDashboard';
import PurchasingActivityFeed from './dashboard/PurchasingActivityFeed';

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

type DashTile = {
  show: boolean;
  title: string;
  to: string;
  tone: KpiCardTone;
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

  const allTiles: DashTile[] = [
    {
      show: (vouchers.plans ?? EMPTY_VOUCHER).show,
      title: 'Kế hoạch mua hàng',
      to: '/purchasing/plans',
      tone: 'warning',
      icon: ClipboardList,
      stats: (vouchers.plans ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.adhoc ?? EMPTY_VOUCHER).show,
      title: 'Mua hàng phát sinh',
      to: '/purchasing/adhoc',
      tone: 'info',
      icon: ShoppingBag,
      stats: (vouchers.adhoc ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.orders ?? EMPTY_VOUCHER).show,
      title: 'Đơn hàng',
      to: '/purchasing/orders',
      tone: 'success',
      icon: ShoppingCart,
      stats: (vouchers.orders ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.estimates ?? EMPTY_VOUCHER).show,
      title: 'Mua hàng dự toán',
      to: '/purchasing/estimate-procurement',
      tone: 'info',
      icon: Calculator,
      stats: (vouchers.estimates ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.contracts ?? EMPTY_VOUCHER).show,
      title: 'Hợp đồng',
      to: '/purchasing/contracts',
      tone: 'neutral',
      icon: ScrollText,
      stats: (vouchers.contracts ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.paymentPlans ?? EMPTY_VOUCHER).show,
      title: 'Kế hoạch thanh toán',
      to: '/purchasing/payment-plans',
      tone: 'neutral',
      icon: WalletCards,
      stats: (vouchers.paymentPlans ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.payments ?? EMPTY_VOUCHER).show,
      title: 'Đề nghị thanh toán',
      to: '/purchasing/payments',
      tone: 'danger',
      icon: Wallet,
      stats: (vouchers.payments ?? EMPTY_VOUCHER).stats,
    },
    {
      show: (vouchers.warranties ?? EMPTY_VOUCHER).show,
      title: 'Bảo hành / Khiếu nại',
      to: '/purchasing/warranties',
      tone: 'primary',
      icon: ShieldCheck,
      stats: (vouchers.warranties ?? EMPTY_VOUCHER).stats,
    },
  ];
  const tiles = allTiles.filter(t => t.show);

  const updatedAt = summaryQ.data?.generatedAt;
  const loading = summaryQ.isLoading;

  if (loading && !summaryQ.data) return <PageLoader />;

  return (
    <PageShell variant="dashboard" className="pur-erp pur-dash">
      <PageHeader
        title="Dashboard mua hàng"
        subtitle="Số phiếu theo từng nghiệp vụ - ẩn mục chưa có dữ liệu"
        actions={updatedAt ? <p className="page-header__updated">Cập nhật lúc {formatUpdatedAt(updatedAt)}</p> : undefined}
      />

      <div className="pur-dash__layout">
        <div className="pur-dash__main">
          {tiles.length === 0 ? (
            <EmptyState message="Chưa có phiếu mua hàng trong kỳ đã chọn." />
          ) : (
            <MetricsStrip ariaLabel="Số phiếu mua hàng">
              {tiles.map(tile => (
                <KpiCard
                  key={tile.to}
                  label={tile.title}
                  value={tileTotal(tile.stats)}
                  to={tile.to}
                  tone={tile.tone}
                  icon={tile.icon}
                  stats={tile.stats}
                />
              ))}
            </MetricsStrip>
          )}
        </div>

        <PurchasingActivityFeed
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          staffSelectId={staffSelectId}
          staffId={staffId}
          onStaffIdChange={setStaffId}
          staffOptions={staffOptions}
          noActiveActors={actorsQ.isSuccess && (actorsQ.data?.length ?? 0) === 0}
          items={activityItems}
          isLoading={activityQ.isLoading}
          hasNextPage={Boolean(activityQ.hasNextPage)}
          isFetchingNextPage={activityQ.isFetchingNextPage}
          onLoadMore={() => { void activityQ.fetchNextPage(); }}
        />
      </div>
    </PageShell>
  );
}
