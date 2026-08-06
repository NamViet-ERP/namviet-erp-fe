import FormField from '../../../components/ui/FormField';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type { PurchasePlanDetailApiDto, PurchasePlanApiDto } from '../../../types/api/purchasingApi';
import type { SupplierApiDto } from '../../../types/wms';

type Props = {
  plans: PurchasePlanApiDto[];
  plansLoading: boolean;
  plan: PurchasePlanDetailApiDto | undefined;
  planLoading: boolean;
  planError: boolean;
  planErr: unknown;
  sourceKind: 'plan' | 'adhoc';
  onSelectSourceKind: (kind: 'plan' | 'adhoc') => void;
  planCode: string;
  supplierName: string;
  suppliers: string[];
  note: string;
  onNoteChange: (value: string) => void;
  onSelectPlan: (code: string) => void;
  onSelectSupplier: (name: string) => void;
  matchedSupplier: SupplierApiDto | null | undefined;
  dueDatePreview: string | null;
};

export function CreatePoFormFields({
  plans,
  plansLoading,
  plan,
  planLoading,
  planError,
  planErr,
  sourceKind,
  onSelectSourceKind,
  planCode,
  supplierName,
  suppliers,
  note,
  onNoteChange,
  onSelectPlan,
  onSelectSupplier,
  matchedSupplier,
  dueDatePreview,
}: Props) {
  const sourceLabel = sourceKind === 'adhoc' ? 'Mua hàng phát sinh' : 'KHMH';
  return (
    <section className="pur-detail__card">
      <div className="pur-detail__form-grid">
        <FormField label="Nguồn" required>
          <select
            className="form-input form-input-md"
            value={sourceKind}
            onChange={e => onSelectSourceKind(e.target.value as 'plan' | 'adhoc')}
            aria-label="Nguồn phiếu"
          >
            <option value="plan">Kế hoạch mua hàng</option>
            <option value="adhoc">Mua hàng phát sinh</option>
          </select>
        </FormField>
        <FormField label={`Mã ${sourceLabel}`} required>
          <select
            className="form-input form-input-md"
            value={planCode}
            disabled={plansLoading}
            onChange={e => onSelectPlan(e.target.value)}
            aria-label={`Mã ${sourceLabel}`}
          >
            <option value="">
              {plansLoading ? 'Đang tải…' : `Chọn ${sourceLabel} đã duyệt`}
            </option>
            {plans.map(p => (
              <option key={p.code} value={p.code}>
                {p.code} — {p.projectCode}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={`Nhà cung cấp (theo ${sourceLabel})`} required>
          <select
            className="form-input form-input-md"
            value={supplierName}
            disabled={!planCode || planLoading}
            onChange={e => onSelectSupplier(e.target.value)}
            aria-label={`Nhà cung cấp theo ${sourceLabel}`}
          >
            <option value="">{!planCode ? `Chọn ${sourceLabel} trước` : 'Chọn NCC'}</option>
            {suppliers.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Dự án">
          <input
            className="form-input form-input-md"
            readOnly
            value={plan ? (plan.projectName ? `${plan.projectCode} — ${plan.projectName}` : plan.projectCode) : ''}
            aria-label={`Dự án (tự lấy từ ${sourceLabel})`}
          />
        </FormField>
        <FormField label="Ghi chú">
          <input
            className="form-input form-input-md"
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            aria-label="Ghi chú đơn hàng"
          />
        </FormField>
      </div>
      {planError ? (
        <p role="alert" className="pur-detail__alert">
          {getApiErrorMessage(planErr, `Không tải được chi tiết ${sourceLabel}.`)}
        </p>
      ) : null}
      {supplierName && !matchedSupplier ? (
        <p role="alert" className="pur-detail__alert">
          Không đối chiếu được NCC với danh mục. Vào <strong>Nhà cung cấp → Nhà cung cấp</strong> để tạo NCC trùng tên và đặt hạn công nợ trước khi lưu PO.
        </p>
      ) : null}
      {matchedSupplier ? (
        <div className="pur-dntt__po-card" aria-label="Điều khoản thanh toán NCC">
          <div className="pur-dntt__po-tile">
            <div>
              <span>NCC đối chiếu</span>
              <strong>{matchedSupplier.supplierName}</strong>
            </div>
          </div>
          <div className="pur-dntt__po-tile">
            <div>
              <span>Hạn công nợ (MaxDebtDays)</span>
              <strong>{matchedSupplier.maxDebtDays} ngày</strong>
            </div>
          </div>
          <div className="pur-dntt__po-tile pur-dntt__po-tile--money">
            <div>
              <span>Hạn thanh toán dự kiến</span>
              <strong>{dueDatePreview ? formatDateCell(dueDatePreview) : '—'}</strong>
            </div>
          </div>
        </div>
      ) : (
        <p className="pur-detail__muted">
          Công nợ và điều khoản thanh toán hiển thị trên phiếu PO sau khi đối chiếu NCC master.
        </p>
      )}
    </section>
  );
}
