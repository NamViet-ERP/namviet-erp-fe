import { useState } from 'react';
import { Briefcase, FileText, FolderOpen, RefreshCw, UserCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import HrmPanel from '../../components/hr/HrmPanel';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { useRecruitmentDashboard } from '../../hooks/useRecruitmentDashboard';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';
import type { CardAccent } from '../../types';

const CHART_NAVY = 'var(--nv-navy)';
const CHART_ACTION = 'var(--nv-action)';
const CHART_SUCCESS = 'var(--md-success)';
const CHART_AMBER = 'var(--nv-amber)';
const CHART_ERROR = 'var(--md-error)';
const CHART_GRID = 'var(--md-outline-variant)';
const CHART_TICK = {
  fill: 'var(--md-on-surface-variant)',
  fontSize: 11,
  fontFamily: 'var(--font-sans)',
} as const;
const PIE_COLORS = [
  CHART_NAVY,
  CHART_ACTION,
  CHART_SUCCESS,
  CHART_AMBER,
  CHART_ERROR,
  'var(--md-info)',
];
const FUNNEL_FILL: Record<string, string> = {
  'Tổng CV': CHART_NAVY,
  'Đã PV': CHART_AMBER,
  'Đã tuyển': CHART_SUCCESS,
};

function monthTick(label: string) {
  const [mm] = label.split('/');
  const n = Number(mm);
  return Number.isNaN(n) ? label : String(n);
}

function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="chart-legend-inline" role="list">
      {items.map(item => (
        <span key={item.label} className="chart-legend-inline__item" role="listitem">
          <span className="chart-legend-inline__dot" style={{ background: item.color }} aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default function RecruitmentDashboardPage() {
  const { kpi, trend, byPosition, costBySource, sync, isRefreshing } = useRecruitmentDashboard(6);
  const [syncing, setSyncing] = useState(false);
  const loading = kpi.isLoading || trend.isLoading;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await sync();
      showToast('success', 'Đã đồng bộ dữ liệu dashboard');
    } catch {
      showToast('error', 'Không thể đồng bộ dữ liệu');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <PageLoader />;

  const k = kpi.data;
  const trendData = (trend.data ?? []).map(row => ({
    ...row,
    monthNum: monthTick(row.month),
  }));
  const positionData = byPosition.data ?? [];
  const costData = costBySource.data ?? [];

  const funnelData = k
    ? [
        { name: 'Tổng CV', value: k.totalCandidates },
        { name: 'Đã PV', value: k.interviewedCount },
        { name: 'Đã tuyển', value: k.acceptedCount },
      ]
    : [];

  const kpiItems: { label: string; value: number; accent: CardAccent; icon: typeof FileText }[] = k
    ? [
        { label: 'Tổng CV', value: k.totalCandidates, accent: 'info', icon: FileText },
        { label: 'Tổng vị trí đợt này', value: k.totalHeadcount, accent: 'neutral', icon: Briefcase },
        { label: 'Vị trí đang mở', value: k.openPlanCount, accent: 'warning', icon: FolderOpen },
        { label: 'Đã tuyển', value: k.acceptedCount, accent: 'success', icon: UserCheck },
      ]
    : [];

  return (
    <div className="hrm-page recruitment-dash space-y-4">
      <PageHeader
        title="Dashboard tổng quan"
        subtitle="Tổng quan pipeline tuyển dụng, tiến độ kế hoạch và chi phí theo nguồn."
        actions={(
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSync}
            disabled={syncing || isRefreshing}
          >
            <RefreshCw size={16} className={syncing || isRefreshing ? 'animate-spin' : ''} aria-hidden />
            Đồng bộ
          </button>
        )}
      />

      {kpi.isError ? (
        <EmptyState message={getApiErrorMessage(kpi.error, 'Không tải được dữ liệu dashboard')} />
      ) : kpiItems.length > 0 ? (
        <div className="dashboard-kpi-grid recruitment-dash-kpi-grid" role="list" aria-label="Chỉ số tuyển dụng">
          {kpiItems.map(item => (
            <Card
              key={item.label}
              title={item.label}
              value={item.value}
              accent={item.accent}
              icon={item.icon}
            />
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <HrmPanel className="recruitment-dash-chart">
          <h2 className="recruitment-dash-chart__title">Tuyển dụng theo Tháng</h2>
          <ChartLegend items={[
            { color: CHART_ACTION, label: 'Tổng CV' },
            { color: CHART_SUCCESS, label: 'Đã tuyển' },
          ]} />
          {trend.isError ? (
            <EmptyState message="Không tải được biểu đồ." />
          ) : trendData.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu." />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barGap={4} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis dataKey="monthNum" tick={CHART_TICK} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={CHART_TICK} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="applications" name="Tổng CV" fill={CHART_ACTION} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="hires" name="Đã tuyển" fill={CHART_SUCCESS} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </HrmPanel>

        <HrmPanel className="recruitment-dash-chart">
          <h2 className="recruitment-dash-chart__title">Tỷ trọng Vị trí ứng tuyển</h2>
          {positionData.length === 0 ? (
            <EmptyState message="Chưa có dữ liệu." />
          ) : (
            <>
              <div className="recruitment-dash-donut-legend">
                {positionData.map((row, i) => (
                  <span key={row.position} className="chart-legend-inline__item">
                    <span
                      className="chart-legend-inline__dot"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      aria-hidden
                    />
                    {row.position}
                  </span>
                ))}
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={positionData}
                      dataKey="count"
                      nameKey="position"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {positionData.map((_, i) => (
                        <Cell key={positionData[i].position} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </HrmPanel>

        <HrmPanel className="recruitment-dash-chart">
          <h2 className="recruitment-dash-chart__title">Phễu chuyển đổi ứng viên</h2>
          {!k ? null : funnelData.every(row => row.value === 0) ? (
            <EmptyState message="Chưa có dữ liệu." />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                  <XAxis dataKey="name" tick={CHART_TICK} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={CHART_TICK} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Số lượng" radius={[6, 6, 0, 0]} maxBarSize={72}>
                    {funnelData.map(row => (
                      <Cell key={row.name} fill={FUNNEL_FILL[row.name] ?? CHART_ACTION} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </HrmPanel>

        <HrmPanel className="recruitment-dash-chart">
          <h2 className="recruitment-dash-chart__title">Chi phí theo Nguồn (VNĐ)</h2>
          {costBySource.isError ? (
            <EmptyState message="Chưa có dữ liệu chi phí hoặc chưa được phép xem." />
          ) : costData.length === 0 ? (
            <EmptyState message="Chưa có chi phí - nhập tại Quản lý chi phí." />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} layout="vertical" margin={{ left: 4, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={CHART_TICK}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => formatCurrency(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="source"
                    width={88}
                    tick={CHART_TICK}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={value => [`${formatCurrency(Number(value ?? 0))} đ`, 'Chi phí']} />
                  <Bar dataKey="totalAmount" name="Chi phí" fill={CHART_AMBER} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </HrmPanel>
      </div>
    </div>
  );
}
