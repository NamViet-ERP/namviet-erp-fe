import { Package, DollarSign, Warehouse, TrendingUp, ArrowUpRight, Activity } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LabelList,
} from 'recharts';

import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import { dashboardChartTooltipProps } from '../../components/warehouse/dashboardChartTooltipProps';
import { WMS_EMPTY, WMS_ERROR } from '../../lib/wms/messages';
import { formatCurrency, formatCurrencyShort } from '../../utils/formatCurrency';
import { fmtStockQty } from '../../lib/wms/stockQtyFormat';
import { showToast } from '../../components/ui/Toast';
import { useWarehouseDashboard } from '../../hooks/useWarehouseDashboard';
import type {
  CategoryDataPoint,
  DashboardActivityItem,
  WarehouseDashboardData,
  TrendDataPoint,
} from '../../lib/wms/warehouseDashboardData';

function truncateChartLabel(value: string, maxLen = 28): string {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen - 1)}…`;
}

/** Zoom Y-axis when values cluster (e.g. warehouse stock within a narrow band). */
function tightNumericDomain(values: number[], padRatio = 0.12): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const base = Math.max(0, min);
    return [Math.max(0, base - Math.max(1, base * 0.05)), base + Math.max(1, base * 0.05)];
  }
  const pad = Math.max((max - min) * padRatio, 1);
  return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
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

const OPS_STAT_ICONS: Record<string, LucideIcon> = {
  'Nhập hôm nay': TrendingUp,
  'Xuất hôm nay': ArrowUpRight,
  'Chờ duyệt': Activity,
  'Mã vật tư': Package,
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
      fontFamily="Roboto, sans-serif"
      pointerEvents="none"
      style={{ pointerEvents: 'none' }}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export default function DashboardWarehousePage() {
  const { data, isLoading, isError } = useWarehouseDashboard();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !data) {
    return (
      <div className="page-stack">
        <PageHeader title="Tổng quan kho" subtitle="Theo dõi hoạt động và tình hình kho hàng" />
        <EmptyState message={WMS_ERROR.loadDefault} />
      </div>
    );
  }

  return <DashboardWarehouseContent data={data} />;
}

function DashboardWarehouseContent({ data }: { data: WarehouseDashboardData }) {
  return (
    <div className="page-stack relative">
      <div className="dashboard-ambient dashboard-ambient--tl" aria-hidden />
      <div className="dashboard-ambient dashboard-ambient--br" aria-hidden />

      <div className="relative z-10">
        <PageHeader
          eyebrow="Tổng quan"
          title="Tổng quan kho hàng"
          actions={
            <p className="flex items-center gap-1.5 text-xs text-[var(--md-on-surface-variant)] shrink-0">
              <Activity size={13} className="text-[var(--md-secondary)]" aria-hidden />
              Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          }
        />
      </div>

      <div className="dashboard-kpi-grid">
        <Card
          title="Tổng tồn kho"
          value={formatCurrency(data.totalStock)}
          subtitle="vật tư trong tất cả kho dự án"
          accent="amber"
          icon={Package}
        />
        <Card
          title="Tổng giá trị"
          value={formatCurrencyShort(data.totalValue)}
          subtitle="ước tính từ giá bình quân"
          accent="blue"
          icon={DollarSign}
        />
        <Card
          title="Kho dự án hoạt động"
          value={data.activeProjects}
          subtitle="dự án chưa đóng"
          accent="teal"
          icon={Warehouse}
        />
      </div>

      <div className="dashboard-ops-grid" aria-label="Hoạt động hôm nay">
        {data.miniStats.map(stat => {
          const Icon = OPS_STAT_ICONS[stat.label] ?? Activity;
          return (
            <div key={stat.label} className="dashboard-ops-card">
              <div
                className="dashboard-ops-card__icon"
                style={{ '--ops-color': stat.color } as CSSProperties}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="dashboard-ops-card__value">{stat.value}</p>
                <p className="dashboard-ops-card__label">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid-charts">
        <BentoCard className="bento-card--chart">
          <SectionHeading sub="6 tháng gần nhất">Xu hướng Nhập / Xuất</SectionHeading>
          <TrendChart data={data.trendData} />
        </BentoCard>

        <BentoCard className="bento-card--chart">
          <SectionHeading sub="Theo mã vật tư">Cơ cấu tồn kho</SectionHeading>
          <CategoryPieChart data={data.stockByCategory} />
        </BentoCard>
      </div>

      <div className="dashboard-grid-row dashboard-grid-row--split">
        <BentoCard className="bento-card--chart">
          <SectionHeading sub="Top kho dự án theo tồn thực tế">Phân bổ theo kho</SectionHeading>
          <WarehouseBarChart data={data.stockByWarehouse} />
        </BentoCard>

        <BentoCard>
          <SectionHeading sub="Phiếu gần đây">Nhật ký kho</SectionHeading>
          <ActivityFeed items={data.recentActivity} />
          <button
            type="button"
            className="btn btn-outlined btn-sm w-full mt-4 flex items-center justify-center gap-1.5"
            onClick={() => showToast('info', 'Xem chi tiết tại các mục Nhập, Xuất, Chuyển kho.', 'Nhật ký')}
          >
            Xem toàn bộ <ArrowUpRight size={14} />
          </button>
        </BentoCard>
      </div>

    </div>
  );
}

function TrendChart({ data }: { data: TrendDataPoint[] }) {
  const hasData = data.some(point => point.imports > 0 || point.exports > 0);
  if (!hasData) {
    return <ChartEmpty message="Chưa có phiếu nhập/xuất trong 6 tháng gần đây." />;
  }

  const totalImports = data.reduce((sum, point) => sum + point.imports, 0);
  const totalExports = data.reduce((sum, point) => sum + point.exports, 0);
  const peak = Math.max(...data.flatMap(point => [point.imports, point.exports]), 1);
  const yMax = Math.ceil(peak * 1.15);

  return (
    <div className="chart-panel">
      <div className="trend-summary">
        <span className="trend-summary__pill">
          <span className="trend-summary__dot" style={{ background: 'var(--status-success)' }} />
          Nhập: <strong>{totalImports}</strong> phiếu
        </span>
        <span className="trend-summary__pill">
          <span className="trend-summary__dot" style={{ background: 'var(--md-secondary)' }} />
          Xuất: <strong>{totalExports}</strong> phiếu
        </span>
      </div>
      <div className="chart-panel__body">
        <div className="chart-surface">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: -4, bottom: 4 }}>
              <defs>
                <linearGradient id="gradImport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--status-success)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--status-success)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradExport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--md-secondary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--md-secondary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--md-outline-variant)" vertical={false} opacity={0.25} />
              <XAxis
                dataKey="month"
                stroke="transparent"
                tick={{ fill: 'var(--md-on-surface-variant)', fontSize: 11, fontFamily: 'Roboto, sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="transparent"
                tick={{ fill: 'var(--md-on-surface-variant)', fontSize: 10, fontFamily: 'Roboto, sans-serif' }}
                allowDecimals={false}
                width={36}
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
                stroke="var(--status-success)"
                strokeWidth={2}
                fill="url(#gradImport)"
                dot={{ r: 3, strokeWidth: 0, fill: 'var(--status-success)' }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--md-surface-container)', fill: 'var(--status-success)' }}
              />
              <Area
                type="monotone"
                dataKey="exports"
                name="Xuất kho"
                stroke="var(--md-secondary)"
                strokeWidth={2}
                fill="url(#gradExport)"
                dot={{ r: 3, strokeWidth: 0, fill: 'var(--md-secondary)' }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--md-surface-container)', fill: 'var(--md-secondary)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ChartLegendInline
        items={[
          { color: 'var(--status-success)', label: 'Nhập kho' },
          { color: 'var(--md-secondary)', label: 'Xuất kho' },
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
  if (data.length === 0) {
    return <ChartEmpty message={WMS_EMPTY.noStock} />;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

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
          <span className="chart-breakdown__center-label">Tổng tồn</span>
        </div>
      </div>
      <CategoryBreakdownList data={data} />
    </div>
  );
}

function WarehouseBarChart({ data }: { data: CategoryDataPoint[] }) {
  if (data.length === 0) {
    return <ChartEmpty message="Chưa có tồn kho theo kho dự án." />;
  }

  const values = data.map(item => item.value);
  const yDomain = tightNumericDomain(values);
  const domainSpan = yDomain[1] - yDomain[0];
  const useTightAxis = domainSpan > 0 && yDomain[0] > 0;

  return (
    <div className="chart-panel">
      <div className="chart-panel__body chart-panel__body--compact">
        <div className="chart-surface">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 22, right: 4, left: -4, bottom: 56 }}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="4 4" stroke="var(--md-outline-variant)" vertical={false} opacity={0.25} />
              <XAxis
                dataKey="name"
                stroke="transparent"
                tick={{ fill: 'var(--md-on-surface-variant)', fontSize: 10, fontFamily: 'Roboto, sans-serif' }}
                angle={-28}
                textAnchor="end"
                height={52}
                interval={0}
                tickFormatter={(value: string) => truncateChartLabel(value, 14)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="transparent"
                tick={{ fill: 'var(--md-on-surface-variant)', fontSize: 10, fontFamily: 'Roboto, sans-serif' }}
                allowDecimals={false}
                width={40}
                domain={yDomain}
                tickFormatter={(v: number) => fmtStockQty(v)}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...dashboardChartTooltipProps}
                cursor={{ fill: 'var(--tint-primary-weak)', opacity: 0.35 }}
              />
              <Bar dataKey="value" name="Tồn kho" radius={[5, 5, 0, 0]} maxBarSize={40}>
                {data.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: number) => fmtStockQty(value)}
                  className="chart-bar-label"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {useTightAxis && (
        <p className="chart-bar-axis-note">
          Trục Y zoom {fmtStockQty(yDomain[0])} – {fmtStockQty(yDomain[1])} để so sánh chênh lệch
        </p>
      )}
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
