import FormField from '../../../components/ui/FormField';
import { Link } from 'react-router-dom';
import PlanAutocomplete from '../../../components/purchasing/PlanAutocomplete';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { PurchasePlanDetailApiDto, PurchasePlanApiDto, SupplierPayableSnapshotApiDto } from '../../../types/api/purchasingApi';
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
  payableSnapshot?: SupplierPayableSnapshotApiDto | null;
  payableSnapshotLoading?: boolean;
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
  payableSnapshot,
  payableSnapshotLoading,
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
          <PlanAutocomplete
            value={planCode}
            onChange={onSelectPlan}
            plans={plans}
            disabled={plansLoading}
            placeholder={plansLoading ? 'Đang tải…' : `Tìm ${sourceLabel} còn đặt được…`}
            ariaLabel={`Mã ${sourceLabel}`}
            emptyMessage={`Không có ${sourceLabel} khớp.`}
          />
        </FormField>
        <FormField label={`Nhà cung cấp (theo ${sourceLabel})`} required>
          <select
            className="form-input form-input-md"
            value={supplierName}
            disabled={!planCode || planLoading}
            onChange={e => onSelectSupplier(e.target.value)}
            aria-label={`Nhà cung cấp theo ${sourceLabel}`}
          >
            <option value="">
              {!planCode
                ? `Chọn ${sourceLabel} trước`
                : suppliers.length === 0
                  ? 'Không còn NCC khả dụng'
                  : 'Chọn NCC'}
            </option>
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
      {planCode && !planLoading && !planError && suppliers.length === 0 ? (
        <p role="status" className="pur-detail__muted">
          {sourceLabel} này không còn NCC nào có SL đặt được. Đóng kế hoạch trên danh sách KHMH nếu đã hoàn tất.
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
              <span>Hạn thanh toán (ngày)</span>
              <strong>{matchedSupplier.maxDebtDays} ngày</strong>
            </div>
          </div>
          <div className="pur-dntt__po-tile pur-dntt__po-tile--money">
            <div>
              <span>Hạn thanh toán dự kiến</span>
              <strong>{dueDatePreview ? formatDateCell(dueDatePreview) : '-'}</strong>
            </div>
          </div>
          <div className="pur-dntt__po-tile pur-dntt__po-tile--money">
            <div>
              <span>Công nợ hiện tại</span>
              <strong>
                {payableSnapshotLoading
                  ? 'Đang tải…'
                  : payableSnapshot
                    ? formatCurrencyFull(payableSnapshot.outstanding)
                    : '-'}
              </strong>
            </div>
          </div>
          <div className="pur-dntt__po-tile">
            <div>
              <span>Hạn mức công nợ</span>
              <strong>
                {payableSnapshot?.creditLimit
                  ? formatCurrencyFull(payableSnapshot.creditLimit)
                  : 'Không giới hạn'}
              </strong>
            </div>
          </div>
        </div>
      ) : (
        <p className="pur-detail__muted">
          Công nợ và điều khoản thanh toán hiển thị trên phiếu PO sau khi đối chiếu NCC master.
        </p>
      )}
      {payableSnapshot?.overdueCount ? (
        <p className="pur-detail__alert" role="status">
          {payableSnapshot.overdueCount} DNTT quá hạn ({formatCurrencyFull(payableSnapshot.overdueAmount)}).
        </p>
      ) : payableSnapshot && payableSnapshot.unpaidCount > 0 ? (
        <p className="pur-detail__muted">
          {payableSnapshot.unpaidCount} DNTT chưa thanh toán.
        </p>
      ) : null}
      {payableSnapshot?.overLimit ? (
        <p className="pur-detail__alert" role="alert">
          Công nợ hiện tại ({formatCurrencyFull(payableSnapshot.outstanding)}) đã vượt hạn mức
          ({formatCurrencyFull(payableSnapshot.creditLimit)}). Cân nhắc trước khi đặt thêm hàng từ NCC này.
        </p>
      ) : null}
      {matchedSupplier ? (
        <p className="pur-detail__muted">
          <Link to={`/suppliers/debt?supplierId=${matchedSupplier.id}`}>Xem chi tiết công nợ</Link>
        </p>
      ) : null}
    </section>
  );
}
