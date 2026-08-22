import { useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Banknote, Building2, ClipboardList, Users, Wallet, WalletCards } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useSuppliersDashboard } from '../../hooks/useSupplierDirectory';
import { formatCurrencyFull, formatCurrencyShort } from '../../utils/formatCurrency';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Từ trước đến nay' },
  { value: 'day', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'this_year', label: 'Năm nay' },
];

const CHART_DNTT = 'var(--nv-amber)';
const CHART_REMAIN = 'var(--md-error)';
const CHART_PAY = 'var(--nv-action)';

function shortAxisLabel(value: unknown) {
  const text = String(value ?? '').trim();
  if (text.length <= 20) return text;
  return `${text.slice(0, 19)}…`;
}

function ChartKey({ items }: { items: { color: string; label: string }[] }) {
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

export default function SuppliersDashboardPage() {
  const [period, setPeriod] = useState('this_year');
  const [supplierFilter, setSupplierFilter] = useState('');

  const { data: suppliers } = useSuppliers({ all: true });
  const { data, isLoading, isError } = useSuppliersDashboard({
    period,
    supplierId: supplierFilter ? Number(supplierFilter) : undefined,
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Dashboard"
        subtitle="Tổng quan nhà cung cấp. Công nợ trên dashboard lấy từ DNTT, không lấy tổng giá trị PO."
      />

      <div className="suppliers-dash-filters">
        <label className="suppliers-dash-filters__field">
          <span>Lọc theo ngày</span>
          <select
            className="form-input form-input-md"
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            {PERIOD_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="suppliers-dash-filters__field">
          <span>Nhà cung cấp</span>
          <select
            className="form-input form-input-md"
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            {(suppliers?.items ?? []).map(s => (
              <option key={s.id} value={s.id}>{s.supplierName}</option>
            ))}
          </select>
        </label>
      </div>

      {isError ? (
        <HrmPanel>
          <EmptyState message="Không tải được dữ liệu tổng quan nhà cung cấp." />
        </HrmPanel>
      ) : isLoading || !data ? (
        <>
          <div className="dashboard-kpi-grid dashboard-kpi-grid--3">
            <Skeleton variant="rect" height={96} />
            <Skeleton variant="rect" height={96} />
            <Skeleton variant="rect" height={96} />
          </div>
          <div className="dashboard-kpi-grid dashboard-kpi-grid--3">
            <Skeleton variant="rect" height={96} />
            <Skeleton variant="rect" height={96} />
            <Skeleton variant="rect" height={96} />
          </div>
          <div className="suppliers-chart-grid">
            <Skeleton variant="rect" height={320} />
            <Skeleton variant="rect" height={320} />
          </div>
        </>
      ) : (
        <>
          <div className="dashboard-kpi-grid dashboard-kpi-grid--3" role="list" aria-label="Chỉ số nhà cung cấp">
            <Card
              title="Nhà cung cấp"
              value={data.supplierCount}
              accent="neutral"
              icon={Building2}
              to="/suppliers/list"
            />
            <Card
              title="Liên hệ"
              value={data.contactCount}
              accent="success"
              icon={Users}
              to="/suppliers/contacts"
            />
            <Card
              title="Đơn hàng trong kỳ"
              value={data.orderCount.toLocaleString('vi-VN')}
              accent="warning"
              icon={ClipboardList}
              to="/purchasing/orders"
            />
          </div>

          <div className="dashboard-kpi-grid dashboard-kpi-grid--3" role="list" aria-label="Công nợ DNTT">
            <Card
              title="Đã đề nghị TT"
              value={formatCurrencyFull(data.debtTotal)}
              accent="purple"
              icon={WalletCards}
              to="/suppliers/debt"
            />
            <Card
              title="Đã thanh toán"
              value={formatCurrencyFull(data.paymentTotal)}
              accent="info"
              icon={Wallet}
              to="/suppliers/debt"
            />
            <Card
              title="Còn phải trả"
              value={formatCurrencyFull(data.remaining)}
              accent={data.remaining > 0 ? 'danger' : 'success'}
              icon={Banknote}
              to="/suppliers/debt"
            />
          </div>

          <div className="suppliers-chart-grid">
            <HrmPanel>
              <h2 className="purchasing-section-title">Biểu đồ DNTT theo nhà cung cấp</h2>
              <div className="suppliers-chart-box">
                {data.debtBySupplier.length === 0 ? (
                  <EmptyState message="Chưa có đề nghị thanh toán nào trong kỳ đã chọn." />
                ) : (
                  <>
                    <ChartKey items={[
                      { color: CHART_DNTT, label: 'Đã đề nghị TT' },
                      { color: CHART_REMAIN, label: 'Còn phải trả' },
                    ]} />
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={data.debtBySupplier}
                        margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
                        barGap={4}
                        barCategoryGap="22%"
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="supplierName"
                          tick={{ fontSize: 12, fill: 'var(--md-on-surface-variant)' }}
                          interval={0}
                          angle={-32}
                          textAnchor="end"
                          height={72}
                          tickFormatter={shortAxisLabel}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: 'var(--md-on-surface-variant)' }}
                          tickFormatter={v => formatCurrencyShort(Number(v))}
                          width={52}
                        />
                        <Tooltip
                          formatter={(v, name) => [formatCurrencyFull(Number(v ?? 0)), String(name)]}
                          labelFormatter={label => String(label)}
                        />
                        <Bar dataKey="debt" name="Đã đề nghị TT" fill={CHART_DNTT} radius={[4, 4, 0, 0]} maxBarSize={36} />
                        <Bar dataKey="remaining" name="Còn phải trả" fill={CHART_REMAIN} radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </HrmPanel>

            <HrmPanel>
              <h2 className="purchasing-section-title">DNTT và thanh toán theo tháng</h2>
              <div className="suppliers-chart-box">
                {data.trend.length === 0 ? (
                  <EmptyState message="Chưa có dữ liệu theo tháng trong kỳ đã chọn." />
                ) : (
                  <>
                    <ChartKey items={[
                      { color: CHART_DNTT, label: 'Đã đề nghị TT' },
                      { color: CHART_PAY, label: 'Thanh toán' },
                    ]} />
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={data.trend} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--md-on-surface-variant)' }} />
                        <YAxis
                          tick={{ fontSize: 12, fill: 'var(--md-on-surface-variant)' }}
                          tickFormatter={v => formatCurrencyShort(Number(v))}
                          width={52}
                        />
                        <Tooltip formatter={(v, name) => [formatCurrencyFull(Number(v ?? 0)), String(name)]} />
                        <Line type="monotone" dataKey="debt" name="Đã đề nghị TT" stroke={CHART_DNTT} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="payment" name="Thanh toán" stroke={CHART_PAY} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </HrmPanel>
          </div>
        </>
      )}
    </div>
  );
}
