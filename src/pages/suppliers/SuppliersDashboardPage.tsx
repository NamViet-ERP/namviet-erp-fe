import { useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Building2, ClipboardList, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
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
        subtitle="Tổng quan nhà cung cấp — công nợ & thanh toán."
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
          <div className="hrm-stat-grid">
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
          <div className="hrm-stat-grid">
            <HrmStatCard label="Nhà cung cấp" value={data.supplierCount} icon={Building2} tone="primary" />
            <HrmStatCard label="Liên hệ" value={data.contactCount} icon={Users} tone="neutral" />
            <HrmStatCard
              label="Đơn hàng trong kỳ"
              value={data.orderCount.toLocaleString('vi-VN')}
              icon={ClipboardList}
              tone="success"
            />
          </div>

          <div className="suppliers-finance-grid">
            <div className="suppliers-finance-card suppliers-finance-card--debt">
              <p className="suppliers-finance-card__label">Công nợ</p>
              <p className="suppliers-finance-card__value tabular-nums">{formatCurrencyFull(data.debtTotal)}</p>
            </div>
            <div className="suppliers-finance-card suppliers-finance-card--pay">
              <p className="suppliers-finance-card__label">Thanh toán</p>
              <p className="suppliers-finance-card__value tabular-nums">{formatCurrencyFull(data.paymentTotal)}</p>
            </div>
            <div className="suppliers-finance-card suppliers-finance-card--remain">
              <p className="suppliers-finance-card__label">Còn lại</p>
              <p className="suppliers-finance-card__value tabular-nums">{formatCurrencyFull(data.remaining)}</p>
            </div>
          </div>

          <div className="suppliers-chart-grid">
            <HrmPanel>
              <h2 className="purchasing-section-title">Biểu đồ công nợ theo nhà cung cấp</h2>
              <div className="suppliers-chart-box">
                {data.debtBySupplier.length === 0 ? (
                  <EmptyState message="Chưa có công nợ nào trong kỳ đã chọn." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.debtBySupplier} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="supplierName"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrencyShort(Number(v))} />
                      <Tooltip formatter={v => formatCurrencyFull(Number(v ?? 0))} />
                      <Legend />
                      <Bar dataKey="debt" name="Công nợ" fill="var(--md-primary)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="remaining" name="Còn lại" fill="var(--md-secondary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </HrmPanel>

            <HrmPanel>
              <h2 className="purchasing-section-title">Công nợ & thanh toán theo tháng</h2>
              <div className="suppliers-chart-box">
                {data.trend.length === 0 ? (
                  <EmptyState message="Chưa có dữ liệu theo tháng trong kỳ đã chọn." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data.trend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrencyShort(Number(v))} />
                      <Tooltip formatter={v => formatCurrencyFull(Number(v ?? 0))} />
                      <Legend />
                      <Line type="monotone" dataKey="debt" name="Công nợ" stroke="var(--md-primary)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="payment" name="Thanh toán" stroke="var(--md-secondary)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </HrmPanel>
          </div>
        </>
      )}
    </div>
  );
}
