import { useId, useMemo, useState } from 'react';
import { Banknote, Building2, ClipboardList, Users, Wallet, WalletCards } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import KpiCard from '../../components/ui/KpiCard';
import MetricsStrip from '../../components/ui/MetricsStrip';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import SelectField from '../../components/ui/SelectField';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useSuppliersDashboard } from '../../hooks/useSupplierDirectory';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import SuppliersDashboardCharts, { DashBoard } from './dashboard/SuppliersDashboardCharts';

const DEFAULT_PERIOD = 'this_year';

const PERIOD_OPTIONS: { id: string; label: string }[] = [
  { id: 'all', label: 'Từ trước đến nay' },
  { id: 'day', label: 'Hôm nay' },
  { id: 'week', label: 'Tuần này' },
  { id: 'this_month', label: 'Tháng này' },
  { id: 'this_year', label: 'Năm nay' },
];

export default function SuppliersDashboardPage() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [supplierFilter, setSupplierFilter] = useState('');
  const supplierSelectId = useId();

  const { data: suppliers } = useSuppliers({ all: true });
  const { data, isLoading, isError } = useSuppliersDashboard({
    period,
    supplierId: supplierFilter ? Number(supplierFilter) : undefined,
  });

  const supplierOptions = useMemo(
    () => (suppliers?.items ?? []).map(s => ({ value: String(s.id), label: s.supplierName })),
    [suppliers?.items],
  );
  const hasFilters = period !== DEFAULT_PERIOD || Boolean(supplierFilter);
  const showLoading = isLoading || !data;

  const resetFilters = () => {
    setPeriod(DEFAULT_PERIOD);
    setSupplierFilter('');
  };

  return (
    <PageShell variant="dashboard" className="sup-dash">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Dashboard"
        subtitle="Tổng quan nhà cung cấp. Công nợ trên dashboard lấy từ DNTT, không lấy tổng giá trị PO."
      />

      <SectionCard noPadding className="ops-projects-board">
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
            <div className="ops-projects__filter-field">
              <label htmlFor={supplierSelectId}>Nhà cung cấp</label>
              <SelectField
                id={supplierSelectId}
                aria-label="Nhà cung cấp"
                selectClassName="form-input form-input-md"
                value={supplierFilter}
                onChange={setSupplierFilter}
                placeholder="Tất cả"
                options={supplierOptions}
              />
            </div>
            {hasFilters ? (
              <Button type="button" variant="text" size="sm" onClick={resetFilters} title="Đặt lại bộ lọc">
                Xóa lọc
              </Button>
            ) : null}
          </div>
        </div>
      </SectionCard>

      {isError ? (
        <DashBoard title="Tổng quan nhà cung cấp" desc="Không tải được dữ liệu.">
          <EmptyState message="Không tải được dữ liệu tổng quan nhà cung cấp." />
        </DashBoard>
      ) : (
        <>
          <MetricsStrip columns={3} className="ops-projects-kpis" ariaLabel="Chỉ số nhà cung cấp">
            <KpiCard
              label="Nhà cung cấp"
              value={data?.supplierCount ?? 0}
              tone="info"
              icon={Building2}
              to="/suppliers/list"
              loading={showLoading}
            />
            <KpiCard
              label="Liên hệ"
              value={data?.contactCount ?? 0}
              tone="success"
              icon={Users}
              to="/suppliers/contacts"
              loading={showLoading}
            />
            <KpiCard
              label="Đơn hàng trong kỳ"
              value={data ? data.orderCount.toLocaleString('vi-VN') : 0}
              tone="warning"
              icon={ClipboardList}
              to="/purchasing/orders"
              loading={showLoading}
            />
          </MetricsStrip>

          <MetricsStrip columns={3} className="ops-projects-kpis" ariaLabel="Công nợ DNTT">
            <KpiCard
              label="Đã đề nghị TT"
              value={data ? formatCurrencyFull(data.debtTotal) : ''}
              tone="primary"
              icon={WalletCards}
              to="/suppliers/debt"
              loading={showLoading}
            />
            <KpiCard
              label="Đã thanh toán"
              value={data ? formatCurrencyFull(data.paymentTotal) : ''}
              tone="info"
              icon={Wallet}
              to="/suppliers/debt"
              loading={showLoading}
            />
            <KpiCard
              label="Còn phải trả"
              value={data ? formatCurrencyFull(data.remaining) : ''}
              tone={data && data.remaining > 0 ? 'danger' : 'success'}
              icon={Banknote}
              to="/suppliers/debt"
              loading={showLoading}
            />
          </MetricsStrip>

          <SuppliersDashboardCharts
            debtBySupplier={data?.debtBySupplier ?? []}
            trend={data?.trend ?? []}
            loading={showLoading}
          />
        </>
      )}
    </PageShell>
  );
}
