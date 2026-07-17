import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Building2, ClipboardList, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import { createSuppliersModuleSeed, formatVnd } from '../../data/suppliersMock';

const seed = createSuppliersModuleSeed();

export default function SuppliersDashboardPage() {
  const { dashboard: d } = seed;
  const [period, setPeriod] = useState('this_year');
  const [supplierFilter, setSupplierFilter] = useState('');

  const debtChart = useMemo(() => {
    if (!supplierFilter) return d.debtBySupplier;
    return d.debtBySupplier.filter(x => x.name === supplierFilter);
  }, [d.debtBySupplier, supplierFilter]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Dashboard"
        subtitle="Tổng quan nhà cung cấp — công nợ & thanh toán."
      />

      <div className="hrm-stat-grid">
        <HrmStatCard label="Nhà cung cấp" value={d.supplierCount} icon={Building2} tone="primary" />
        <HrmStatCard label="Liên hệ" value={d.contactCount} icon={Users} tone="neutral" />
        <HrmStatCard label="Đơn hàng trong tháng" value={d.ordersThisMonth.toLocaleString('vi-VN')} icon={ClipboardList} tone="success" />
      </div>

      <div className="suppliers-finance-grid">
        <div className="suppliers-finance-card suppliers-finance-card--debt">
          <p className="suppliers-finance-card__label">Công nợ</p>
          <p className="suppliers-finance-card__value">{formatVnd(d.debtTotal)}</p>
        </div>
        <div className="suppliers-finance-card suppliers-finance-card--pay">
          <p className="suppliers-finance-card__label">Thanh toán</p>
          <p className="suppliers-finance-card__value">{formatVnd(d.paymentTotal)}</p>
        </div>
        <div className="suppliers-finance-card suppliers-finance-card--remain">
          <p className="suppliers-finance-card__label">Còn lại</p>
          <p className="suppliers-finance-card__value">{formatVnd(d.remaining)}</p>
        </div>
      </div>

      <div className="suppliers-dash-filters">
        <label className="suppliers-dash-filters__field">
          <span>Lọc theo ngày</span>
          <select className="form-input form-input-md" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="all">Từ trước đến nay</option>
            <option value="day">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="this_month">Tháng này</option>
            <option value="this_year">Năm nay</option>
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
            {d.debtBySupplier.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="suppliers-chart-grid">
        <HrmPanel>
          <h2 className="purchasing-section-title">Biểu đồ công nợ theo nhà cung cấp</h2>
          <div className="suppliers-chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={debtChart} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(Number(v) / 1e9)} tỷ`} />
                <Tooltip formatter={(v) => formatVnd(Number(v ?? 0))} />
                <Bar dataKey="debt" name="Công nợ" fill="var(--md-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </HrmPanel>

        <HrmPanel>
          <h2 className="purchasing-section-title">Báo cáo doanh thu</h2>
          <div className="suppliers-chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={d.trend} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(Number(v) / 1e9)} tỷ`} />
                <Tooltip formatter={(v) => formatVnd(Number(v ?? 0))} />
                <Legend />
                <Line type="monotone" dataKey="debt" name="Công nợ" stroke="var(--md-primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="payment" name="Thanh toán" stroke="var(--md-secondary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </HrmPanel>
      </div>
    </div>
  );
}
