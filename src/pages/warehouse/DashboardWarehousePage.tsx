import { Package, DollarSign, Warehouse, TrendingUp, ArrowUpRight, Activity } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';

import { USE_MOCK } from '../../lib/mock';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { WMS_EMPTY } from '../../lib/wms/messages';
import PageHeader from '../../components/ui/PageHeader';
import { warehouses } from '../../data/warehouses';
import { formatCurrency, formatCurrencyShort } from '../../utils/formatCurrency';
import { showToast } from '../../components/ui/Toast';

const totalStock = warehouses.reduce((sum, w) => sum + w.totalStock, 0);
const totalValue = warehouses.reduce((sum, w) => sum + w.totalValue, 0);
const totalWarehouses = warehouses.filter(w => w.status === 'active').length;

/* ── Mock activity trend data (6 months) ── */
interface TrendDataPoint {
  month: string;
  imports: number;
  exports: number;
  value: number;
}

const trendData: TrendDataPoint[] = [
  { month: 'T1', imports: 320, exports: 280, value: 4200 },
  { month: 'T2', imports: 410, exports: 340, value: 5100 },
  { month: 'T3', imports: 280, exports: 390, value: 3800 },
  { month: 'T4', imports: 520, exports: 420, value: 6200 },
  { month: 'T5', imports: 460, exports: 380, value: 5800 },
  { month: 'T6', imports: 590, exports: 510, value: 7100 },
];

interface CategoryDataPoint {
  name: string;
  value: number;
  color: string;
}

const stockByCategory: CategoryDataPoint[] = [
  { name: 'Máy nén trục vít', value: 420, color: 'var(--chart-3)' },
  { name: 'Máy nén piston',   value: 280, color: 'var(--chart-2)' },
  { name: 'Bình chứa khí',   value: 195, color: 'var(--chart-4)' },
  { name: 'Máy sấy khí',     value: 110, color: 'var(--chart-5)' },
  { name: 'Lọc khí',         value: 340, color: 'var(--chart-6)' },
  { name: 'Phụ kiện',        value: 560, color: 'var(--chart-1)' },
];

const chartSeries = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-6)'];

const stockByWarehouse: CategoryDataPoint[] = warehouses
  .filter(w => w.group === 'Kho chính' || w.group === 'Kho phụ')
  .map((w, i) => ({
    name: w.branch,
    value: w.totalStock,
    color: chartSeries[i % chartSeries.length] as string,
  }));

/* ── Recent activity ── */
interface ActivityItem {
  type: string;
  label: string;
  value: string;
  time: string;
  accent: string;
}

const recentActivity: ActivityItem[] = [
  { type: 'import',   label: 'Nhập kho #NK-2026089', value: '+240 vật tư', time: '8 phút trước',   accent: 'var(--status-success)' },
  { type: 'export',   label: 'Xuất kho #XK-2026043', value: '-85 vật tư',  time: '32 phút trước',  accent: 'var(--status-error)' },
  { type: 'import',   label: 'Nhập kho #NK-2026088', value: '+120 vật tư', time: '1 giờ trước',    accent: 'var(--status-success)' },
  { type: 'transfer', label: 'Chuyển kho #CK-001',   value: '60 vật tư',  time: '2 giờ trước',    accent: 'var(--status-warning)' },
  { type: 'stocktake',label: 'Kiểm kê Kho HN-01',    value: '1.905 mã VT', time: '5 giờ trước',    accent: 'var(--chart-5)' },
];

/* ── MD3 Custom Tooltip ── */
interface CustomTooltipInternalProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; fill?: string }>;
  label?: string;
}
const CustomTooltip = ({ active, payload, label }: CustomTooltipInternalProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="chart-tooltip__label">{label}</p>}
      {(payload as Array<{ name?: string; value?: number; color?: string; fill?: string }>).map((p, i) => (
        <div key={i} className="chart-tooltip__row">
          <span
            className="chart-tooltip__dot"
            style={{ '--chart-dot-color': p.color || p.fill } as CSSProperties}
          />
          <span className="chart-tooltip__name">{p.name}:</span>
          <span className="chart-tooltip__value">
            {typeof p.value === 'number' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── MD3 Pie label ── */
interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const RADIAN = Math.PI / 180;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props as PieLabelProps;
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="var(--md-inverse-on-surface)" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700} fontFamily="Roboto, sans-serif">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ── Section heading — MD3 Roboto style ── */
interface SectionHeadingProps {
  children: React.ReactNode;
  sub?: string;
}

function SectionHeading({ children, sub }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <h2 className="section-heading__title">{children}</h2>
      {sub && <p className="section-heading__sub">{sub}</p>}
    </div>
  );
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
}

function BentoCard({ children, className = '' }: BentoCardProps) {
  return <div className={`bento-card${className ? ` ${className}` : ''}`}>{children}</div>;
}

/* ── Mini stat item type ── */
interface MiniStat {
  label: string;
  value: string;
  color: string;
  icon: LucideIcon;
}

export default function DashboardWarehousePage() {
  if (!USE_MOCK) {
    return (
      <div className="page-stack">
        <PageHeader title="Tổng quan kho" subtitle="Theo dõi hoạt động và tình hình kho hàng" />
        <EmptyState message={WMS_EMPTY.dashboardPending} />
      </div>
    );
  }
  return <DashboardWarehousePageMock />;
}

function DashboardWarehousePageMock() {
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

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 relative z-10 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        <Card
          title="Tổng tồn kho"
          value={formatCurrency(totalStock)}
          subtitle="vật tư trong tất cả kho"
          accent="amber"
          icon={Package}
          trend={12.4}
          trendLabel="so tháng trước"
        />
        <Card
          title="Tổng giá trị"
          value={formatCurrencyShort(totalValue)}
          subtitle="giá trị hàng tồn kho"
          accent="blue"
          icon={DollarSign}
          trend={8.1}
          trendLabel="so tháng trước"
        />
        <Card
          title="Kho đang hoạt động"
          value={totalWarehouses}
          subtitle="kho đang hoạt động"
          accent="teal"
          icon={Warehouse}
          trend={0}
          trendLabel="không thay đổi"
        />
      </div>

      {/* ── Main charts row ── */}
      <div className="dashboard-grid-row dashboard-grid-row--split">
        <div className="dashboard-grid-charts lg:col-span-2">

          {/* Area chart */}
          <BentoCard>
            <SectionHeading sub="6 tháng gần nhất">Xu hướng Nhập / Xuất</SectionHeading>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradImport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--status-success)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--status-success)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradExport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--md-secondary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--md-secondary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--md-outline-variant)" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" stroke="transparent" tick={{ fill: 'var(--md-on-surface-variant)', fontSize: 11, fontFamily: 'Roboto, sans-serif' }} />
                <YAxis stroke="transparent" tick={{ fill: 'var(--md-on-surface-variant)', fontSize: 11, fontFamily: 'Roboto, sans-serif' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="imports" name="Nhập kho"
                  stroke="var(--status-success)" strokeWidth={2} fill="url(#gradImport)" dot={false} activeDot={{ r: 5, fill: 'var(--status-success)', stroke: 'var(--md-surface)', strokeWidth: 1.5 }} />
                <Area type="monotone" dataKey="exports" name="Xuất kho"
                  stroke="var(--md-secondary)" strokeWidth={2} fill="url(#gradExport)" dot={false} activeDot={{ r: 5, fill: 'var(--md-secondary)', stroke: 'var(--md-surface)', strokeWidth: 1.5 }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={v => <span className="chart-legend-text">{v}</span>} />
              </AreaChart>
            </ResponsiveContainer>
          </BentoCard>

          {/* Pie chart */}
          <BentoCard>
            <SectionHeading sub="Theo loại hàng">Cơ cấu tồn kho</SectionHeading>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={stockByCategory}
                  cx="50%" cy="45%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80} innerRadius={32}
                  dataKey="value"
                  animationDuration={700}
                  strokeWidth={2}
                  stroke="var(--md-surface-container)"
                >
                  {stockByCategory.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom" iconType="circle" iconSize={8}
                  formatter={v => <span className="chart-legend-text">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </BentoCard>
        </div>
      </div>

      {/* ── Bottom row: bar chart + recent activity ── */}
      <div className="dashboard-grid-row dashboard-grid-row--split">

        {/* Bar chart */}
        <BentoCard>
          <SectionHeading sub="Top kho theo tồn kho thực tế">Phân bổ theo kho</SectionHeading>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stockByWarehouse} margin={{ top: 5, right: 5, left: -20, bottom: 20 }} barCategoryGap="38%">
              <CartesianGrid strokeDasharray="4 4" stroke="var(--md-outline-variant)" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" stroke="transparent"
                tick={{ fill: 'var(--md-on-surface-variant)', fontSize: 10, fontFamily: 'Roboto, sans-serif' }}
                angle={-15} textAnchor="end" interval={0} />
              <YAxis stroke="transparent" tick={{ fill: 'var(--md-on-surface-variant)', fontSize: 11, fontFamily: 'Roboto, sans-serif' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--tint-primary-weak)' }} />
              <Bar dataKey="value" name="Tồn kho" radius={[4, 4, 0, 0]}>
                {stockByWarehouse.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BentoCard>

        {/* Recent activity feed */}
        <BentoCard>
          <SectionHeading sub="Hoạt động gần nhất">Nhật ký kho</SectionHeading>
          <div>
            {recentActivity.map((item, i) => (
              <div key={i} className="activity-feed__item">
                <div className="activity-feed__rail">
                  <div
                    className="activity-feed__dot"
                    style={{ '--activity-accent': item.accent } as CSSProperties}
                  />
                  {i < recentActivity.length - 1 && <div className="activity-feed__line" />}
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

          <button
            type="button"
            className="btn btn-outlined btn-sm w-full mt-4 flex items-center justify-center gap-1.5"
            onClick={() => showToast('info', 'Hoạt động nhật ký đầy đủ đang được tải...', 'Nhật ký')}
          >
            Xem toàn bộ <ArrowUpRight size={14} />
          </button>
        </BentoCard>
      </div>

      {/* ── Mini stat bar (bottom) ── */}
      <div className="mini-stat-grid">
        {([
          { label: 'Nhập hôm nay', value: '47 phiếu',   color: 'var(--status-success)', icon: TrendingUp },
          { label: 'Xuất hôm nay', value: '31 phiếu',   color: 'var(--status-warning)', icon: ArrowUpRight },
          { label: 'Chờ duyệt',    value: '12 phiếu',   color: 'var(--status-error)',   icon: Activity },
          { label: 'Mã vật tư sắp hết', value: '8 mặt hàng', color: 'var(--chart-5)', icon: Package },
        ] as MiniStat[]).map(s => (
          <div key={s.label} className="mini-stat-item">
            <div
              className="mini-stat-item__icon"
              style={{ '--stat-color': s.color } as CSSProperties}
            >
              <s.icon size={16} />
            </div>
            <div>
              <p className="mini-stat-item__value">{s.value}</p>
              <p className="mini-stat-item__label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
