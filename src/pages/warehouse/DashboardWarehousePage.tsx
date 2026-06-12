import { Package, DollarSign, Warehouse, TrendingUp, ArrowUpRight, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from 'recharts';

import Card from '../../components/ui/Card';
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
  { type: 'import',   label: 'Nhập kho #NK-2026089', value: '+240 sản phẩm', time: '8 phút trước',   accent: 'var(--status-success)' },
  { type: 'export',   label: 'Xuất kho #XK-2026043', value: '-85 sản phẩm',  time: '32 phút trước',  accent: 'var(--status-error)' },
  { type: 'import',   label: 'Nhập kho #NK-2026088', value: '+120 sản phẩm', time: '1 giờ trước',    accent: 'var(--status-success)' },
  { type: 'transfer', label: 'Chuyển kho #CK-001',   value: '60 sản phẩm',  time: '2 giờ trước',    accent: 'var(--status-warning)' },
  { type: 'stocktake',label: 'Kiểm kê Kho HN-01',    value: '1,905 SKU',    time: '5 giờ trước',    accent: 'var(--chart-5)' },
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
    <div
      style={{
        padding: '12px 16px',
        background: 'var(--md-surface-container-high)',
        border: '1px solid var(--md-outline-variant)',
        borderRadius: '12px',
        boxShadow: 'var(--md-shadow-2)',
        fontFamily: "'Roboto', sans-serif",
        fontSize: '13px',
        color: 'var(--md-on-surface)',
      }}
    >
      {label && (
        <p style={{ fontWeight: 500, fontSize: '11px', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          {label}
        </p>
      )}
      {(payload as Array<{ name?: string; value?: number; color?: string; fill?: string }>).map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: i > 0 ? '4px' : 0 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ color: 'var(--md-on-surface-variant)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: 'var(--md-on-surface)' }}>
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
    <div style={{ marginBottom: '16px' }}>
      <h2
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: '18px',
          fontWeight: 500,
          color: 'var(--md-on-surface)',
        }}
      >
        {children}
      </h2>
      {sub && (
        <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '12px', color: 'var(--md-on-surface-variant)', marginTop: '2px' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Bento card — MD3 style ── */
interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function BentoCard({ children, className = '', style = {} }: BentoCardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--md-surface-container)',
        borderRadius: '24px',
        boxShadow: 'var(--md-shadow-1)',
        padding: '24px',
        position: 'relative',
        transition: 'all 300ms var(--md-easing)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Mini stat item type ── */
interface MiniStat {
  label: string;
  value: string;
  color: string;
  icon: LucideIcon;
}

export default function DashboardWarehousePage() {
  return (
    <div className="relative animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── Ambient Blur Shapes ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--md-primary) 6%, transparent)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '-5%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--md-secondary) 6%, transparent)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div>
          <p
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--md-primary)',
              marginBottom: '4px',
            }}
          >
            TỔNG QUAN
          </p>
          <h1
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--md-on-surface)',
              letterSpacing: '-0.01em',
            }}
          >
            Dashboard Kho hàng
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Roboto', sans-serif", fontSize: '12px', color: 'var(--md-on-surface-variant)' }}>
          <Activity size={13} style={{ color: 'var(--md-primary)' }} />
          Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', position: 'relative', zIndex: 1 }}>
        <Card
          title="Tổng Tồn Kho"
          value={formatCurrency(totalStock)}
          subtitle="sản phẩm trong tất cả kho"
          accent="amber"
          icon={Package}
          trend={12.4}
          trendLabel="so tháng trước"
        />
        <Card
          title="Tổng Giá Trị"
          value={formatCurrencyShort(totalValue)}
          subtitle="giá trị hàng tồn kho"
          accent="blue"
          icon={DollarSign}
          trend={8.1}
          trendLabel="so tháng trước"
        />
        <Card
          title="Tổng Kho Hoạt Động"
          value={totalWarehouses}
          subtitle="kho đang hoạt động"
          accent="teal"
          icon={Warehouse}
          trend={0}
          trendLabel="không thay đổi"
        />
      </div>

      {/* ── Main charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', position: 'relative', zIndex: 1 }} className="lg:grid-cols-[3fr_2fr]">
        
        {/* Area chart + Pie in a row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="md:grid-cols-2 lg:col-span-2">

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
                  formatter={v => <span style={{ fontFamily: 'Roboto, sans-serif', color: 'var(--md-on-surface-variant)', fontSize: 12 }}>{v}</span>} />
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
                  formatter={v => <span style={{ fontFamily: 'Roboto, sans-serif', color: 'var(--md-on-surface-variant)', fontSize: 11 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </BentoCard>
        </div>
      </div>

      {/* ── Bottom row: bar chart + recent activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', position: 'relative', zIndex: 1 }} className="lg:grid-cols-[3fr_2fr]">

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
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  borderBottom: i < recentActivity.length - 1 ? '1px solid var(--md-outline-variant)' : 'none',
                }}
              >
                {/* Dot + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch', flexShrink: 0 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.accent, marginTop: '4px', flexShrink: 0 }} />
                  {i < recentActivity.length - 1 && (
                    <div style={{ width: '1px', flex: 1, marginTop: '8px', background: 'var(--md-outline-variant)', opacity: 0.5 }} />
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '13px', fontWeight: 500, color: 'var(--md-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '12px', fontWeight: 700, color: item.accent }}>{item.value}</span>
                    <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '11px', color: 'var(--md-on-surface-variant)' }}>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            style={{
              marginTop: '16px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              height: '40px',
              fontFamily: "'Roboto', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid var(--md-outline)',
              borderRadius: '9999px',
              background: 'transparent',
              color: 'var(--md-primary)',
              cursor: 'pointer',
              transition: 'all 200ms var(--md-easing)',
            }}
            className="hover:bg-[var(--tint-primary-hover)] active:bg-[var(--tint-primary-active)]"
            onClick={() => showToast('info', 'Hoạt động nhật ký đầy đủ đang được tải...', 'Nhật ký')}
          >
            Xem toàn bộ <ArrowUpRight size={14} />
          </button>
        </BentoCard>
      </div>

      {/* ── Mini stat bar (bottom) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', position: 'relative', zIndex: 1 }}>
        {([
          { label: 'Nhập hôm nay', value: '47 phiếu',   color: 'var(--status-success)', icon: TrendingUp },
          { label: 'Xuất hôm nay', value: '31 phiếu',   color: 'var(--status-warning)', icon: ArrowUpRight },
          { label: 'Chờ duyệt',    value: '12 phiếu',   color: 'var(--status-error)',   icon: Activity },
          { label: 'SKU sắp hết',  value: '8 mặt hàng', color: 'var(--chart-5)',        icon: Package },
        ] as MiniStat[]).map(s => (
          <div
            key={s.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--md-surface-container)',
              borderRadius: '16px',
              padding: '12px 16px',
              boxShadow: 'var(--md-shadow-1)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                borderRadius: '8px',
                background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
              }}
            >
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--md-on-surface)', lineHeight: 1.2 }}>
                {s.value}
              </p>
              <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '11px', color: 'var(--md-on-surface-variant)', marginTop: '2px' }}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
