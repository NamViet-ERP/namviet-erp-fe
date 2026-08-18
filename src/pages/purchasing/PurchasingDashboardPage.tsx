import { useId, useMemo, useState } from 'react';
import { History } from 'lucide-react';
import HrmSelect from '../../components/hr/HrmSelect';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import PurDateRangePicker, { type DateRangeValue } from '../../components/purchasing/PurDateRangePicker';
import { useActivityRealtime } from '../../hooks/useActivityRealtime';
import {
  usePurchasingActivityActors,
  usePurchasingActivityFeed,
  usePurchasingDashboardChart,
  usePurchasingDashboardSummary,
} from '../../hooks/usePurchasingDashboard';
import { formatCurrency } from '../../utils/formatCurrency';
import type {
  PurchasingActivityItemApiDto,
  PurchasingKpiMetricApiDto,
} from '../../types/api/purchasingDashboardApi';

const CHART_BLUE = '#428bca';

/** Legacy chart axis: 100,000,000 style (en-US commas). */
function formatChartAxis(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

function formatKpiLine(metric: PurchasingKpiMetricApiDto): string {
  if (metric.amount > 0) {
    return `${metric.count} Đơn (${formatCurrency(metric.amount)})`;
  }
  return `${metric.count} Đơn`;
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

function PurchasingKpiCard({
  title,
  metric,
  tone,
}: {
  title: string;
  metric: PurchasingKpiMetricApiDto;
  tone: 'plan' | 'order' | 'import';
}) {
  return (
    <div className={`pur-dash-kpi pur-dash-kpi--${tone}`}>
      <h3 className="pur-dash-kpi__title">{title}</h3>
      <p className="pur-dash-kpi__value">{formatKpiLine(metric)}</p>
    </div>
  );
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
  const chartQ = usePurchasingDashboardChart(queryParams, liveOpts);
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

  const chartData = useMemo(
    () =>
      (chartQ.data?.bars ?? []).map(b => ({
        name: b.label.toLocaleUpperCase('vi-VN'),
        amount: b.amount,
      })),
    [chartQ.data],
  );

  const updatedAt = summaryQ.data?.generatedAt ?? chartQ.data?.generatedAt;
  const loading = summaryQ.isLoading || chartQ.isLoading;

  if (loading && !summaryQ.data) return <PageLoader />;

  return (
    <div className="pur-erp pur-dash">
      <header className="pur-erp__head pur-dash__head">
        <div className="pur-erp__head-text">
          <h1 className="pur-erp__title">Dashboard mua hàng</h1>
          <p className="pur-erp__subtitle">
            Tổng quan KHMH · Đơn hàng · Nhập hàng và lịch sử hoạt động
          </p>
        </div>
      </header>

      <div className="pur-dash__layout">
        <div className="pur-dash__main">
          <div className="pur-dash-kpi-row">
            <PurchasingKpiCard
              title="KHMH"
              metric={summaryQ.data?.plans ?? { count: 0, amount: 0 }}
              tone="plan"
            />
            <PurchasingKpiCard
              title="Đơn hàng"
              metric={summaryQ.data?.orders ?? { count: 0, amount: 0 }}
              tone="order"
            />
            <PurchasingKpiCard
              title="Nhập hàng"
              metric={summaryQ.data?.imports ?? { count: 0, amount: 0 }}
              tone="import"
            />
          </div>

          <section className="pur-dash-chart">
            <h2 className="pur-dash-chart__title">
              Biểu đồ mua theo hoạch định sản xuất và dự trữ kho
            </h2>
            {chartData.every(d => d.amount === 0) ? (
              <EmptyState message="Chưa có đơn hàng trong kỳ đã chọn." />
            ) : (
              <>
                <div className="pur-dash-chart__legend" aria-hidden>
                  <span className="pur-dash-chart__legend-swatch" />
                  <span>Tổng tiền</span>
                </div>
                <div className="pur-dash-chart__canvas">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
                      barCategoryGap="28%"
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8ebf0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#555', fontWeight: 600 }}
                        axisLine={{ stroke: '#d8dde6' }}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#888' }}
                        tickFormatter={v => formatChartAxis(Number(v))}
                        width={96}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgb(66 139 202 / 0.08)' }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const raw = Number(payload[0]?.value ?? 0);
                          return (
                            <div className="pur-dash-chart__tip">
                              <p className="pur-dash-chart__tip-label">{label}</p>
                              <p className="pur-dash-chart__tip-row">
                                <span className="pur-dash-chart__tip-swatch" />
                                <span>{formatChartAxis(raw)}</span>
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        name="Tổng tiền"
                        fill={CHART_BLUE}
                        maxBarSize={220}
                        radius={[0, 0, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
            {updatedAt && (
              <div className="pur-dash-chart__footer">
                Updated {formatUpdatedAt(updatedAt)}
              </div>
            )}
          </section>
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
