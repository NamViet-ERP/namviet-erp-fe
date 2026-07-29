import { Check, Pencil, Printer, X } from 'lucide-react';
import type { PurchaseOrderDetailApiDto } from '../../../types/api/purchasingApi';

type Props = {
  order: PurchaseOrderDetailApiDto | undefined;
  editing: boolean;
  actionBusy: boolean;
  updatePending: boolean;
  canUpdate: boolean;
  canApprove: boolean;
  canUnapprove: boolean;
  canPlace: boolean;
  isDraft: boolean;
  isApproved: boolean;
  isPlaced: boolean;
  onPrint: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onAction: (kind: 'approve' | 'unapprove' | 'place') => void;
};

export function PoDetailHeaderActions({
  order,
  editing,
  actionBusy,
  updatePending,
  canUpdate,
  canApprove,
  canUnapprove,
  canPlace,
  isDraft,
  isApproved,
  isPlaced,
  onPrint,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onAction,
}: Props) {
  return (
    <div className="pur-detail__actions">
      {order ? (
        <button type="button" className="btn btn-outline btn-sm" onClick={onPrint}>
          <Printer size={15} strokeWidth={1.75} aria-hidden />
          In phiếu
        </button>
      ) : null}
      {order && canUpdate && isDraft && !editing ? (
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={actionBusy}
          onClick={onStartEdit}
        >
          <Pencil size={15} strokeWidth={1.75} aria-hidden />
          Chỉnh sửa
        </button>
      ) : null}
      {order && editing ? (
        <>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={actionBusy}
            onClick={onCancelEdit}
          >
            <X size={15} strokeWidth={1.75} aria-hidden />
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={actionBusy}
            onClick={onSaveEdit}
          >
            {updatePending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </>
      ) : null}
      {order && canApprove && isDraft && !editing ? (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={actionBusy}
          onClick={() => { onAction('approve'); }}
        >
          <Check size={15} strokeWidth={1.75} aria-hidden />
          Phê duyệt
        </button>
      ) : null}
      {order && canUnapprove && isApproved && !isPlaced ? (
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={actionBusy}
          onClick={() => { onAction('unapprove'); }}
        >
          Hủy phê duyệt
        </button>
      ) : null}
      {order && canPlace && isApproved && !isPlaced ? (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={actionBusy}
          onClick={() => { onAction('place'); }}
        >
          Xác nhận đã đặt NCC
        </button>
      ) : null}
    </div>
  );
}
