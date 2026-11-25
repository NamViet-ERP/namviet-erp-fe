import { RefreshCw } from 'lucide-react';
import ProjectAutocomplete from '../../../components/purchasing/ProjectAutocomplete';
import SelectField from '../../../components/ui/SelectField';
import type { WarehouseProjectApiDto } from '../../../types/wms';
import { formatCurrencyFull } from '../../../utils/formatCurrency';

const PLACEMENT_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'not_placed', label: 'Chưa đặt' },
  { value: 'placed', label: 'Đã đặt' },
];

const DELIVERY_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'none', label: 'Chưa giao' },
  { value: 'partial', label: '1 phần' },
  { value: 'complete', label: 'Đủ' },
];

const PAYMENT_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'partial', label: 'Thanh toán 1 phần' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'overdue', label: 'Quá hạn' },
];

const WARNING_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'true', label: 'Đang có cảnh báo' },
  { value: 'false', label: 'Không cảnh báo' },
];

interface PurchaseOrdersFilterBarProps {
  supplierName: string;
  onSupplierNameChange: (v: string) => void;
  planCode: string;
  onPlanCodeChange: (v: string) => void;
  projectCode: string;
  onProjectCodeChange: (v: string) => void;
  projects: WarehouseProjectApiDto[];
  selectedProject?: WarehouseProjectApiDto;
  projectBudgetRemaining: number;
  orderPlacementStatus: string;
  onOrderPlacementStatusChange: (v: string) => void;
  deliveryStatus: string;
  onDeliveryStatusChange: (v: string) => void;
  paymentStatus: string;
  onPaymentStatusChange: (v: string) => void;
  paymentWarning: string;
  onPaymentWarningChange: (v: string) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
}

export default function PurchaseOrdersFilterBar({
  supplierName,
  onSupplierNameChange,
  planCode,
  onPlanCodeChange,
  projectCode,
  onProjectCodeChange,
  projects,
  selectedProject,
  projectBudgetRemaining,
  orderPlacementStatus,
  onOrderPlacementStatusChange,
  deliveryStatus,
  onDeliveryStatusChange,
  paymentStatus,
  onPaymentStatusChange,
  paymentWarning,
  onPaymentWarningChange,
  hasActiveFilters,
  onReset,
}: PurchaseOrdersFilterBarProps) {
  return (
    <div className="pur-erp__filter-card pur-erp__filter-card--po">
      <div className="pur-erp__toolbar pur-erp__toolbar--po">
        <div className="pur-erp__toolbar-fields pur-erp__filter-grid pur-erp__filter-grid--po">
          <label className="pur-erp__field">
            <span>Nhà cung cấp</span>
            <input
              className="pur-erp__select"
              value={supplierName}
              onChange={e => onSupplierNameChange(e.target.value)}
              placeholder="Tên NCC"
              aria-label="Lọc nhà cung cấp"
            />
          </label>
          <label className="pur-erp__field">
            <span>KHMH</span>
            <input
              className="pur-erp__select"
              value={planCode}
              onChange={e => onPlanCodeChange(e.target.value)}
              placeholder="Mã KHMH"
              aria-label="Lọc mã KHMH"
            />
          </label>
          <label className="pur-erp__field">
            <span>Dự án</span>
            <ProjectAutocomplete
              value={projectCode}
              onChange={onProjectCodeChange}
              projects={projects}
              placeholder="Mã / tên dự án"
              compact
            />
            {selectedProject ? (
              <span
                className="text-xs text-[var(--md-on-surface-variant)] mt-1 whitespace-nowrap block"
                title={`Ngân sách VT: ${formatCurrencyFull(selectedProject.materialBudget)} | Còn lại: ${formatCurrencyFull(projectBudgetRemaining)}`}
              >
                Ngân sách:{' '}
                <strong className="font-mono text-[var(--md-primary)]">
                  {formatCurrencyFull(selectedProject.materialBudget)}
                </strong>{' '}
                (còn{' '}
                <strong className={`font-mono ${projectBudgetRemaining < 0 ? 'text-[var(--md-error)]' : ''}`}>
                  {formatCurrencyFull(projectBudgetRemaining)}
                </strong>)
              </span>
            ) : null}
          </label>
          <label className="pur-erp__field">
            <span>Trạng thái đặt</span>
            <SelectField
              selectClassName="pur-erp__select"
              value={orderPlacementStatus}
              onChange={onOrderPlacementStatusChange}
              options={PLACEMENT_OPTIONS}
              aria-label="Lọc trạng thái đặt"
            />
          </label>
          <label className="pur-erp__field">
            <span>Trạng thái giao</span>
            <SelectField
              selectClassName="pur-erp__select"
              value={deliveryStatus}
              onChange={onDeliveryStatusChange}
              options={DELIVERY_OPTIONS}
              aria-label="Lọc trạng thái giao"
            />
          </label>
          <label className="pur-erp__field">
            <span>Tình trạng thanh toán</span>
            <SelectField
              selectClassName="pur-erp__select"
              value={paymentStatus}
              onChange={onPaymentStatusChange}
              options={PAYMENT_OPTIONS}
              aria-label="Lọc tình trạng thanh toán"
            />
          </label>
          <label className="pur-erp__field">
            <span>Cảnh báo thanh toán</span>
            <SelectField
              selectClassName="pur-erp__select"
              value={paymentWarning}
              onChange={onPaymentWarningChange}
              options={WARNING_OPTIONS}
              aria-label="Lọc đơn đang có cảnh báo thanh toán"
            />
          </label>
        </div>
        {hasActiveFilters ? (
          <div className="pur-erp__toolbar-actions">
            <button type="button" className="hrm-filter-reset" onClick={onReset}>
              <RefreshCw size={14} aria-hidden />
              Xóa lọc
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
