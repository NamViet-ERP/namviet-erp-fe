import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import { showToast } from '../../components/ui/Toast';
import { useRecruitmentDashboard } from '../../hooks/useRecruitmentDashboard';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatCurrency } from '../../utils/formatCurrency';

const CHART_BLUE = '#4285f4';
const CHART_GREEN = '#34a853';
const PIE_COLORS = ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#ab47bc', '#00acc1', '#8d6e63', '#5c6bc0', '#26a69a', '#ff7043'];

function monthTick(label: string) {
  const [mm] = label.split('/');
  const n = Number(mm);
  return Number.isNaN(n) ? label : String(n);
}

function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="recruitment-dash-legend">
      {items.map(item => (
        <span key={item.label} className="recruitment-dash-legend__item">
          <span className="recruitment-dash-legend__swatch" style={{ background: item.color }} aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function KpiCard({ label, value, tone = 'primary' }: { label: string; value: number; tone?: 'primary' | 'success' }) {
  return (
    <div className="recruitment-dash-kpi">
      <p className="recruitment-dash-kpi__label">{label}</p>
      <p className={`recruitment-dash-kpi__value recruitment-dash-kpi__value--${tone}`}>
        {value}
      </p>
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
      ) : k ? (
        <div className="recruitment-dash-kpi-grid">
          <KpiCard label="Tổng CV" value={k.totalCandidates} />
          <KpiCard label="Tổng vị trí đợt này" value={k.totalHeadcount} />
          <KpiCard label="Vị trí đang mở" value={k.openPlanCount} />
          <KpiCard label="Đã tuyển" value={k.acceptedCount} tone="success" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <HrmPanel className="recruitment-dash-chart">
          <h2 className="recruitment-dash-chart__title">Tuyển dụng theo Tháng</h2>
          <ChartLegend items={[
            { color: CHART_BLUE, label: 'Tổng CV' },
            { color: CHART_GREEN, label: 'Đã Tuyển' },
          ]} />
          {trend.isError ? (
            <p className="text-sm text-[var(--md-error)]">Không tải được biểu đồ.</p>
          ) : trendData.length === 0 ? (
            <p className="text-sm text-[var(--md-on-surface-variant)]">Chưa có dữ liệu.</p>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barGap={4} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                  <XAxis dataKey="monthNum" tick={{ fontSize: 12, fill: '#5f6368' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5f6368' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="applications" name="Tổng CV" fill={CHART_BLUE} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="hires" name="Đã Tuyển" fill={CHART_GREEN} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </HrmPanel>

        <HrmPanel className="recruitment-dash-chart">
          <h2 className="recruitment-dash-chart__title">Tỷ trọng Vị trí ứng tuyển</h2>
          {positionData.length === 0 ? (
            <p className="text-sm text-[var(--md-on-surface-variant)]">Chưa có dữ liệu.</p>
          ) : (
            <>
              <div className="recruitment-dash-donut-legend">
                {positionData.map((row, i) => (
                  <span key={row.position} className="recruitment-dash-legend__item">
                    <span
                      className="recruitment-dash-legend__swatch"
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
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
          {!k ? null : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5f6368' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#5f6368' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Số lượng" fill={CHART_BLUE} radius={[6, 6, 0, 0]} maxBarSize={72} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </HrmPanel>

        <HrmPanel className="recruitment-dash-chart">
          <h2 className="recruitment-dash-chart__title">Chi phí theo Nguồn (VNĐ)</h2>
          {costBySource.isError ? (
            <p className="text-sm text-[var(--md-on-surface-variant)]">Chưa có dữ liệu chi phí hoặc chưa được phép xem.</p>
          ) : costData.length === 0 ? (
            <p className="text-sm text-[var(--md-on-surface-variant)]">Chưa có chi phí — nhập tại Quản lý chi phí.</p>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} layout="vertical" margin={{ left: 4, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#5f6368' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => formatCurrency(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="source"
                    width={88}
                    tick={{ fontSize: 11, fill: '#3c4043' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={value => [`${formatCurrency(Number(value ?? 0))} đ`, 'Chi phí']} />
                  <Bar dataKey="totalAmount" name="Chi phí" fill={CHART_BLUE} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </HrmPanel>
      </div>
    </div>
  );
}
