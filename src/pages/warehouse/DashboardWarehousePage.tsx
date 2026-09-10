import { Package, DollarSign, Warehouse, TrendingUp, ArrowUpRight, Activity, AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { XAxisTickContentProps } from 'recharts';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { CardAccent } from '../../types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LabelList,
} from 'recharts';

import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import { dashboardChartTooltipProps } from '../../components/warehouse/dashboardChartTooltipProps';
import { DashboardBarChartPortalTooltip } from '../../components/warehouse/DashboardChartTooltip';
import { WMS_ERROR } from '../../lib/wms/messages';
import { formatCurrencyShort } from '../../utils/formatCurrency';
import { fmtStockQty } from '../../lib/wms/stockQtyFormat';
import { useWarehouseDashboard } from '../../hooks/useWarehouseDashboard';
import { useLowStockAlerts } from '../../hooks/useLowStockAlerts';
import { useCanViewWmsPrices } from '../../lib/wms/priceVisibility';
import type {
  CategoryDataPoint,
  DashboardActivityItem,
  WarehouseDashboardData,
  TrendDataPoint,
} from '../../lib/wms/warehouseDashboardData';
import { emptyWarehouseDashboardData } from '../../lib/wms/warehouseDashboardData';

const ACTIVITY_PREVIEW_COUNT = 5;
const CHART_AXIS_STROKE = 'var(--md-outline-variant)';
const CHART_IMPORT = 'var(--md-success)';
const CHART_EXPORT = 'var(--nv-amber)';
const CHART_AXIS_TICK = {
  fill: 'var(--md-on-surface-variant)',
  fontSize: 11,
  fontFamily: 'var(--font-sans)',
} as const;

const WAREHOUSE_BAR_Y_AXIS = {
  title: 'Số lượng tồn',
  unit: 'ĐVT theo từng mã vật tư',
} as const;

const WAREHOUSE_BAR_X_AXIS = {
  title: 'Kho dự án',
  unit: 'Đơn vị: STT (số thứ tự)',
} as const;

/** Round Y-axis to clean steps; always includes 0. */
function buildStockBarYScale(values: number[]): { domainMax: number; ticks: number[] } {
  const dataMax = Math.max(...values, 0);
  if (dataMax === 0) {
    return { domainMax: 4, ticks: [0, 1, 2, 3, 4] };
  }

  const targetTicks = 4;
  const roughStep = (dataMax * 1.06) / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceUnit = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceUnit * magnitude;
  const domainMax = step * targetTicks;
  const ticks = Array.from({ length: targetTicks + 1 }, (_, i) => i * step);

  return { domainMax, ticks };
}

function warehouseBarChartHeight(): number {
  return 180;
}

function WarehouseBarXTick({ x = 0, y = 0, index = 0 }: XAxisTickContentProps) {
  return (
    <text
      x={Number(x)}
      y={Number(y)}
      dy={14}
      fill={CHART_AXIS_TICK.fill}
      fontSize={CHART_AXIS_TICK.fontSize}
      fontFamily={CHART_AXIS_TICK.fontFamily}
      textAnchor="middle"
      fontWeight={600}
    >
      {index + 1}
    </text>
  );
}

function WarehouseBarLegend({ data }: { data: CategoryDataPoint[] }) {
  return (
    <div className="warehouse-bar-legend-wrap">
      <p className="warehouse-bar-legend__heading">
        {WAREHOUSE_BAR_X_AXIS.title} - {WAREHOUSE_BAR_X_AXIS.unit}. Tên đầy đủ:
      </p>
      <ul className="warehouse-bar-legend" aria-label="Danh sách kho dự án">
        {data.map((item, index) => (
          <li key={item.name} className="warehouse-bar-legend__row">
            <span className="warehouse-bar-legend__index" aria-hidden>{index + 1}</span>
            <span className="warehouse-bar-legend__dot" style={{ background: item.color }} aria-hidden />
            <span className="warehouse-bar-legend__name">{item.name}</span>
            <span className="warehouse-bar-legend__value">{fmtStockQty(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChartLegendInline({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="chart-legend-inline" aria-hidden>
      {items.map(item => (
        <span key={item.label} className="chart-legend-inline__item">
          <span className="chart-legend-inline__dot" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function SectionHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="section-heading">
      <h2 className="section-heading__title">{children}</h2>
      {sub && <p className="section-heading__sub">{sub}</p>}
    </div>
  );
}

function BentoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bento-card${className ? ` ${className}` : ''}`}>{children}</div>;
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center flex-1 min-h-[180px]">
      <EmptyState message={message} />
    </div>
  );
}

const OPS_STAT_META: Record<string, { accent: CardAccent; icon: LucideIcon }> = {
  'Chờ duyệt': { accent: 'danger', icon: Activity },
  'Nhập hôm nay': { accent: 'success', icon: TrendingUp },
  'Xuất hôm nay': { accent: 'warning', icon: ArrowUpRight },
};

const RADIAN = Math.PI / 180;

interface PieSliceLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function renderPiePercentLabel(props: PieSliceLabelProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (percent < 0.08) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--md-inverse-on-surface)"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
      fontFamily="var(--font-sans)"
      pointerEvents="none"
      style={{ pointerEvents: 'none' }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export default function DashboardWarehousePage() {
  const { data, isLoading, isError, refetch, isRefetching } = useWarehouseDashboard();

  if (isLoading) {
    return <PageLoader />;
  }

  const hasLoadError = isError || !data;
  const displayData = data ?? emptyWarehouseDashboardData();

  return (
    <DashboardWarehouseContent
      data={displayData}
      hasLoadError={hasLoadError}
      onRetry={() => void refetch()}
      isRetrying={isRefetching}
    />
  );
}

interface DashboardWarehouseContentProps {
  data: WarehouseDashboardData;
  hasLoadError?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

function DashboardWarehouseContent({
  data,
  hasLoadError = false,
  onRetry,
  isRetrying = false,
}: DashboardWarehouseContentProps) {
  const [activityExpanded, setActivityExpanded] = useState(false);
  const canViewPrices = useCanViewWmsPrices();
  const { data: lowStockAlerts = [] } = useLowStockAlerts(undefined, 8);
  const activityItems = activityExpanded
    ? data.recentActivity
    : data.recentActivity.slice(0, ACTIVITY_PREVIEW_COUNT);
  const hasMoreActivity = data.recentActivity.length > ACTIVITY_PREVIEW_COUNT;

  return (
    <div className="page-stack warehouse-dash">
      <PageHeader
          eyebrow="Tổng quan"
          title="Tổng quan kho hàng"
          actions={
            <p className="page-header__updated">
              <Activity size={13} aria-hidden />
              Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          }
        />

      {hasLoadError && (
        <div className="alert-banner alert-banner--error dashboard-load-alert" role="alert">
          <AlertTriangle size={18} className="alert-banner__icon" aria-hidden />
          <div className="dashboard-load-alert__body">
            <p className="dashboard-load-alert__message">{WMS_ERROR.loadDefault}</p>
            <p className="dashboard-load-alert__hint">Các mục bên dưới hiển thị khung trống cho đến khi tải lại thành công.</p>
          </div>
          {onRetry && (
            <button
              type="button"
              className="btn btn-outlined btn-sm dashboard-load-alert__retry"
              onClick={onRetry}
              disabled={isRetrying}
            >
              <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} aria-hidden />
              {isRetrying ? 'Đang tải…' : 'Thử lại'}
            </button>
          )}
        </div>
      )}

      {lowStockAlerts.length > 0 && (
        <div className="alert-banner alert-banner--warning" role="alert">
          <AlertTriangle size={18} className="alert-banner__icon" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="alert-banner__title">
              {lowStockAlerts.length} cảnh báo tồn dưới ngưỡng tối thiểu
            </p>
            <ul className="alert-banner__list">
              {lowStockAlerts.slice(0, 5).map(a => (
                <li key={`${a.projectCode}-${a.materialCode}`}>
                  <EntityCodeLink
                    code={a.projectCode}
                    to={`/warehouse/projects/${encodeURIComponent(a.projectCode)}`}
                  />
                  {' - '}
                  <EntityCodeLink
                    code={a.materialCode}
                    to="/warehouse/materials"
                    state={{ highlightCode: a.materialCode }}
                  />
                  {' '}
                  ({a.actualQty}/{a.minStockQty} {a.unit})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="dashboard-kpi-grid warehouse-dash-kpis" role="list" aria-label="Việc cần xử lý">
        {data.miniStats.map(stat => {
          const meta = OPS_STAT_META[stat.label] ?? { accent: 'info' as const, icon: Activity };
          return (
            <Card
              key={stat.label}
              title={stat.label}
              value={hasLoadError ? '-' : stat.value}
              accent={meta.accent}
              icon={meta.icon}
            />
          );
        })}
      </div>

      <div className="dashboard-kpi-grid warehouse-dash-kpis" role="list" aria-label="Chỉ số kho">
        <Card
          title="Tồn tất cả kho"
          value={hasLoadError ? '-' : fmtStockQty(data.totalStock)}
          subtitle="Kho trung tâm cộng các kho dự án"
          accent="info"
          icon={Package}
        />
        {canViewPrices && (
          <Card
            title="Tổng giá trị"
            value={hasLoadError ? '-' : formatCurrencyShort(data.totalValue)}
            subtitle="ước tính từ giá bình quân"
            accent="warning"
            icon={DollarSign}
          />
        )}
        <Card
          title="Kho dự án hoạt động"
          value={hasLoadError ? '-' : data.activeProjects}
          subtitle="dự án chưa đóng"
          accent="neutral"
          icon={Warehouse}
        />
      </div>

      <div className="dashboard-grid-charts">
        <BentoCard className="bento-card--chart">
          <SectionHeading sub="6 tháng gần nhất - giá trị">Xu hướng Nhập / Xuất</SectionHeading>
          {canViewPrices ? (
            <TrendChart data={data.trendData} />
          ) : (
            <div className="chart-panel">
              <EmptyState message="Biểu đồ giá trị nhập/xuất yêu cầu quyền xem giá." />
            </div>
          )}
        </BentoCard>

        <BentoCard className="bento-card--chart">
          <SectionHeading sub="Số lượng tồn theo từng vật tư">Cơ cấu tồn kho</SectionHeading>
          <CategoryPieChart data={data.stockByCategory} />
        </BentoCard>
      </div>

      <div className="dashboard-grid-row dashboard-grid-row--split">
        <BentoCard className="bento-card--chart bento-card--chart-bar">
          <SectionHeading sub="Top kho dự án theo tồn thực tế">Phân bổ theo kho</SectionHeading>
          <WarehouseBarChart data={data.stockByWarehouse} />
        </BentoCard>

        <BentoCard>
          <SectionHeading sub="Phiếu gần đây">Nhật ký kho</SectionHeading>
          <div className={activityExpanded ? 'activity-feed-scroll' : undefined}>
            <ActivityFeed items={activityItems} />
          </div>
          {hasMoreActivity && (
            <button
              type="button"
              className="btn btn-outlined btn-sm w-full mt-4 flex items-center justify-center gap-1.5"
              onClick={() => setActivityExpanded(prev => !prev)}
            >
              {activityExpanded
                ? 'Thu gọn'
                : `Xem thêm (${data.recentActivity.length - ACTIVITY_PREVIEW_COUNT})`}
              <ChevronDown
                size={14}
                className={activityExpanded ? 'nv-dropdown__chevron--open' : ''}
              />
            </button>
          )}
        </BentoCard>
      </div>

    </div>
  );
}

function TrendChart({ data }: { data: TrendDataPoint[] }) {
  const hasData = data.some(point => point.imports > 0 || point.exports > 0);
  if (!hasData) {
    return <ChartEmpty message="Chưa có giá trị nhập/xuất trong 6 tháng gần đây." />;
  }

  const totalImports = data.reduce((sum, point) => sum + point.imports, 0);
  const totalExports = data.reduce((sum, point) => sum + point.exports, 0);
  const peak = Math.max(...data.flatMap(point => [point.imports, point.exports]), 1);
  const yMax = Math.ceil(peak * 1.15);

  return (
    <div className="chart-panel">
      <div className="trend-summary">
        <span className="trend-summary__pill">
          <span className="trend-summary__dot" style={{ background: CHART_IMPORT }} />
          Nhập: <strong>{formatCurrencyShort(totalImports)}</strong>
        </span>
        <span className="trend-summary__pill">
          <span className="trend-summary__dot" style={{ background: CHART_EXPORT }} />
          Xuất: <strong>{formatCurrencyShort(totalExports)}</strong>
        </span>
      </div>
      <div className="chart-panel__body">
        <div className="chart-surface">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: -4, bottom: 4 }}>
              <defs>
                <linearGradient id="gradImport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_IMPORT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_IMPORT} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradExport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_EXPORT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_EXPORT} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--md-outline-variant)" vertical={false} opacity={0.25} />
              <XAxis
                dataKey="month"
                stroke="transparent"
                tick={CHART_AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="transparent"
                tick={{ ...CHART_AXIS_TICK, fontSize: 10 }}
                tickFormatter={(v) => formatCurrencyShort(Number(v))}
                width={48}
                domain={[0, yMax]}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...dashboardChartTooltipProps}
                shared
                cursor={{ stroke: 'var(--md-outline-variant)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="imports"
                name="Nhập kho"
                stroke={CHART_IMPORT}
                strokeWidth={2}
                fill="url(#gradImport)"
                dot={{ r: 3, strokeWidth: 0, fill: CHART_IMPORT }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--md-surface-container)', fill: CHART_IMPORT }}
              />
              <Area
                type="monotone"
                dataKey="exports"
                name="Xuất kho"
                stroke={CHART_EXPORT}
                strokeWidth={2}
                fill="url(#gradExport)"
                dot={{ r: 3, strokeWidth: 0, fill: CHART_EXPORT }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--md-surface-container)', fill: CHART_EXPORT }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ChartLegendInline
        items={[
          { color: CHART_IMPORT, label: 'Nhập kho' },
          { color: CHART_EXPORT, label: 'Xuất kho' },
        ]}
      />
    </div>
  );
}

function CategoryBreakdownList({ data }: { data: CategoryDataPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return null;

  return (
    <div className="chart-breakdown__list" aria-label="Chi tiết cơ cấu tồn kho">
      {data.map(item => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <div key={item.name} className="chart-breakdown__row">
            <div className="chart-breakdown__row-top">
              <span className="chart-breakdown__dot" style={{ background: item.color }} />
              <span className="chart-breakdown__name" title={item.name}>{item.name}</span>
              <span className="chart-breakdown__pct">
                {pct}% · {fmtStockQty(item.value)}
              </span>
            </div>
            <div className="chart-breakdown__track">
              <div
                className="chart-breakdown__fill"
                style={{ width: `${pct}%`, background: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryPieChart({ data }: { data: CategoryDataPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (data.length === 0 || total <= 0) {
    return <ChartEmpty message="Chưa có số lượng tồn kho." />;
  }

  return (
    <div className="chart-breakdown">
      <div className="chart-breakdown__donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props) => renderPiePercentLabel(props as PieSliceLabelProps)}
              outerRadius="86%"
              innerRadius="54%"
              paddingAngle={2}
              dataKey="value"
              animationDuration={500}
              strokeWidth={2}
              stroke="var(--md-surface-container)"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...dashboardChartTooltipProps} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-breakdown__center" aria-hidden>
          <span className="chart-breakdown__center-value">{fmtStockQty(total)}</span>
          <span className="chart-breakdown__center-label">Tồn</span>
        </div>
      </div>
      <CategoryBreakdownList data={data} />
    </div>
  );
}

function WarehouseBarChart({ data }: { data: CategoryDataPoint[] }) {
  const [chartRoot, setChartRoot] = useState<HTMLDivElement | null>(null);

  if (data.length === 0) {
    return <ChartEmpty message="Chưa có tồn kho theo kho dự án." />;
  }

  const values = data.map(item => item.value);
  const yScale = buildStockBarYScale(values);
  const chartHeight = warehouseBarChartHeight();

  return (
    <div className="chart-panel chart-panel--warehouse-bar">
      <div
        className="chart-panel__body chart-panel__body--compact chart-panel__body--bar"
        style={{ minHeight: chartHeight }}
      >
        <div className="warehouse-bar-chart-frame">
          <div className="chart-axis-y-caption" aria-hidden>
            <span className="chart-axis-y-caption__title">{WAREHOUSE_BAR_Y_AXIS.title}</span>
            <span className="chart-axis-y-caption__unit">{WAREHOUSE_BAR_Y_AXIS.unit}</span>
          </div>
          <div className="warehouse-bar-chart-frame__plot">
            <div ref={setChartRoot} className="chart-surface chart-surface--bar chart-surface--framed">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 16, left: 4, bottom: 8 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke={CHART_AXIS_STROKE}
                    vertical={false}
                    opacity={0.45}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={CHART_AXIS_STROKE}
                    tick={WarehouseBarXTick}
                    tickLine={{ stroke: CHART_AXIS_STROKE }}
                    axisLine={{ stroke: CHART_AXIS_STROKE }}
                    height={28}
                    interval={0}
                  />
                  <YAxis
                    stroke={CHART_AXIS_STROKE}
                    tick={CHART_AXIS_TICK}
                    tickLine={{ stroke: CHART_AXIS_STROKE }}
                    axisLine={{ stroke: CHART_AXIS_STROKE }}
                    allowDecimals={false}
                    width={56}
                    domain={[0, yScale.domainMax]}
                    ticks={yScale.ticks}
                    tickFormatter={(v: number) => fmtStockQty(v)}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    cursor={{ fill: 'var(--tint-primary-weak)', opacity: 0.35 }}
                    content={(props) => (
                      <DashboardBarChartPortalTooltip
                        {...props}
                        chartRoot={chartRoot}
                      />
                    )}
                  />
                  <Bar dataKey="value" name={WAREHOUSE_BAR_Y_AXIS.title} radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {data.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      offset={8}
                      formatter={value => fmtStockQty(Number(value ?? 0))}
                      className="chart-bar-label"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="chart-axis-x-caption">
              <span className="chart-axis-x-caption__title">{WAREHOUSE_BAR_X_AXIS.title}</span>
              <span className="chart-axis-x-caption__unit">{WAREHOUSE_BAR_X_AXIS.unit}</span>
            </p>
          </div>
        </div>
      </div>
      <WarehouseBarLegend data={data} />
    </div>
  );
}

function ActivityFeed({ items }: { items: DashboardActivityItem[] }) {
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
