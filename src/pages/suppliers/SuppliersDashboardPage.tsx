import { useState, type ReactNode } from 'react';
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

const DEFAULT_PERIOD = 'this_year';

const PERIOD_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'Từ trước đến nay' },
  { id: 'day', label: 'Hôm nay' },
  { id: 'week', label: 'Tuần này' },
  { id: 'this_month', label: 'Tháng này' },
  { id: 'this_year', label: 'Năm nay' },
];

const CHART_DNTT = 'var(--nv-amber)';
const CHART_REMAIN = 'var(--md-error)';
const CHART_PAY = 'var(--nv-action)';
const CHART_GRID = 'var(--table-border)';
const CHART_TICK = {
  fill: 'var(--md-on-surface-variant)',
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
} as const;

function shortAxisLabel(value: unknown) {
  const text = String(value ?? '').trim();
  if (text.length <= 20) return text;
  return `${text.slice(0, 19)}...`;
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

function DashBoard({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <HrmPanel noPadding className="ops-projects-board">
      <div className="ops-projects-board__head">
        <h2 className="ops-projects-board__title">{title}</h2>
        <p className="ops-projects-board__desc">{desc}</p>
      </div>
      <div className="ops-projects-board__body">
        {children}
      </div>
    </HrmPanel>
  );
}

export default function SuppliersDashboardPage() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [supplierFilter, setSupplierFilter] = useState('');

  const { data: suppliers } = useSuppliers({ all: true });
  const { data, isLoading, isError } = useSuppliersDashboard({
    period,
    supplierId: supplierFilter ? Number(supplierFilter) : undefined,
  });

  const hasFilters = period !== DEFAULT_PERIOD || Boolean(supplierFilter);

  const resetFilters = () => {
    setPeriod(DEFAULT_PERIOD);
    setSupplierFilter('');
  };

  return (
    <div className="page-shell sup-dash">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Dashboard"
        subtitle="Tổng quan nhà cung cấp. Công nợ trên dashboard lấy từ DNTT, không lấy tổng giá trị PO."
      />

      <HrmPanel noPadding className="ops-projects-board">
        <div className="ops-projects-board__head">
          <h2 className="ops-projects-board__title">Kỳ báo cáo</h2>
          <p className="ops-projects-board__desc">Lọc số liệu DNTT và đơn hàng theo kỳ, theo nhà cung cấp.</p>
        </div>
        <div className="hrm-list-toolbar">
          <div className="ops-projects__toolbar">
            <div className="ops-projects__filter-field sup-dash__period">
              <span>Lọc theo ngày</span>
              <div className="ops-projects-tabs" role="tablist" aria-label="Lọc theo ngày">
                {PERIOD_OPTIONS.map(item => {
                  const active = period === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`ops-projects-tabs__btn${active ? ' is-active' : ''}`}
                      onClick={() => setPeriod(item.id)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="ops-projects__filter-field">
              Nhà cung cấp
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
            {hasFilters ? (
              <button type="button" className="btn btn-text" onClick={resetFilters} title="Đặt lại bộ lọc">
                Xóa lọc
              </button>
            ) : null}
          </div>
        </div>
      </HrmPanel>

      {isError ? (
        <DashBoard title="Tổng quan nhà cung cấp" desc="Không tải được dữ liệu.">
          <EmptyState message="Không tải được dữ liệu tổng quan nhà cung cấp." />
        </DashBoard>
      ) : isLoading || !data ? (
        <>
          <div className="dashboard-kpi-grid dashboard-kpi-grid--3 ops-projects-kpis">
            <Skeleton variant="rect" height={96} />
            <Skeleton variant="rect" height={96} />
            <Skeleton variant="rect" height={96} />
          </div>
          <div className="dashboard-kpi-grid dashboard-kpi-grid--3 ops-projects-kpis">
            <Skeleton variant="rect" height={96} />
            <Skeleton variant="rect" height={96} />
            <Skeleton variant="rect" height={96} />
          </div>
          <div className="suppliers-chart-grid">
            <DashBoard title="Biểu đồ DNTT theo nhà cung cấp" desc="Đang tải.">
              <Skeleton variant="rect" height={260} />
            </DashBoard>
            <DashBoard title="DNTT và thanh toán theo tháng" desc="Đang tải.">
              <Skeleton variant="rect" height={260} />
            </DashBoard>
          </div>
        </>
      ) : (
        <>
          <div className="dashboard-kpi-grid dashboard-kpi-grid--3 ops-projects-kpis" role="list" aria-label="Chỉ số nhà cung cấp">
            <Card
              title="Nhà cung cấp"
              value={data.supplierCount}
              accent="info"
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

          <div className="dashboard-kpi-grid dashboard-kpi-grid--3 ops-projects-kpis" role="list" aria-label="Công nợ DNTT">
            <Card
              title="Đã đề nghị TT"
              value={formatCurrencyFull(data.debtTotal)}
              accent="amber"
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
            <DashBoard
              title="Biểu đồ DNTT theo nhà cung cấp"
              desc="Đề nghị thanh toán và số còn phải trả theo từng NCC trong kỳ."
            >
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
                        <XAxis
                          dataKey="supplierName"
                          tick={CHART_TICK}
                          interval={0}
                          angle={-32}
                          textAnchor="end"
                          height={72}
                          tickFormatter={shortAxisLabel}
                        />
                        <YAxis
                          tick={CHART_TICK}
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
            </DashBoard>

            <DashBoard
              title="DNTT và thanh toán theo tháng"
              desc="Đề nghị và số đã thanh toán theo từng tháng trong kỳ."
            >
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
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                        <XAxis dataKey="month" tick={CHART_TICK} />
                        <YAxis
                          tick={CHART_TICK}
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
            </DashBoard>
          </div>
        </>
      )}
    </div>
  );
}
