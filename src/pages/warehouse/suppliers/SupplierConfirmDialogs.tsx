import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import type { SupplierRow } from './SupplierShared';

interface SupplierConfirmDialogsProps {
  deleteTarget: SupplierRow | null;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;

  blacklistTarget: SupplierRow | null;
  blacklistReason: string;
  onBlacklistReasonChange: (reason: string) => void;
  onCloseBlacklist: () => void;
  onConfirmBlacklist: () => void;
  isBlacklisting: boolean;

  approveTarget: SupplierRow | null;
  onCloseApprove: () => void;
  onConfirmApprove: () => void;
  isApproving: boolean;

  rejectTarget: SupplierRow | null;
  onCloseReject: () => void;
  onConfirmReject: () => void;
  isRejecting: boolean;
}

export default function SupplierConfirmDialogs({
  deleteTarget,
  onCloseDelete,
  onConfirmDelete,
  isDeleting,
  blacklistTarget,
  blacklistReason,
  onBlacklistReasonChange,
  onCloseBlacklist,
  onConfirmBlacklist,
  isBlacklisting,
  approveTarget,
  onCloseApprove,
  onConfirmApprove,
  isApproving,
  rejectTarget,
  onCloseReject,
  onConfirmReject,
  isRejecting,
}: SupplierConfirmDialogsProps) {
  return (
    <>
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        title="Xóa nhà cung cấp?"
        message={
          deleteTarget ? (
            <p>
              Xóa <strong>{deleteTarget.supplierName}</strong> khỏi danh mục?
              Phiếu cũ vẫn giữ tên đã lưu.
            </p>
          ) : null
        }
        confirmLabel="Xóa"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={blacklistTarget !== null}
        onClose={onCloseBlacklist}
        onConfirm={onConfirmBlacklist}
        title="Thêm vào blacklist?"
        message={
          blacklistTarget ? (
            <div className="space-y-3 text-left">
              <p>
                Chuyển <strong>{blacklistTarget.supplierName}</strong> ({blacklistTarget.supplierCode}) sang
                mục Danh sách blacklist? NCC này sẽ không còn hiện ở danh mục nhà cung cấp.
              </p>
              <label className="block space-y-1 text-sm">
                <span className="font-semibold">
                  Lý do <span className="text-[var(--md-error)]">*</span>
                </span>
                <textarea
                  className="form-input w-full min-h-[80px] text-sm"
                  value={blacklistReason}
                  onChange={e => onBlacklistReasonChange(e.target.value)}
                  placeholder="Nhập lý do bắt buộc…"
                  autoFocus
                />
              </label>
            </div>
          ) : null
        }
        confirmLabel="Thêm vào blacklist"
        variant="danger"
        isLoading={isBlacklisting}
      />

      <ConfirmDialog
        isOpen={approveTarget !== null}
        onClose={onCloseApprove}
        onConfirm={onConfirmApprove}
        title="Duyệt nhà cung cấp?"
        message={
          approveTarget ? (
            <p>
              Duyệt <strong>{approveTarget.supplierName}</strong> ({approveTarget.supplierCode})?
              Sau khi duyệt có thể chọn NCC này khi tạo PO.
            </p>
          ) : null
        }
        confirmLabel="Duyệt"
        variant="default"
        isLoading={isApproving}
      />

      <ConfirmDialog
        isOpen={rejectTarget !== null}
        onClose={onCloseReject}
        onConfirm={onConfirmReject}
        title="Từ chối nhà cung cấp?"
        message={
          rejectTarget ? (
            <p>
              Từ chối <strong>{rejectTarget.supplierName}</strong>? NCC này chưa đặt hàng được.
            </p>
          ) : null
        }
        confirmLabel="Từ chối"
        variant="danger"
        isLoading={isRejecting}
      />
    </>
  );
}
