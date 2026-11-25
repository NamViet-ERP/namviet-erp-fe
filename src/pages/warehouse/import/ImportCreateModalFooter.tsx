import Button from '../../../components/ui/Button';
import { formatCurrency } from '../../../utils/formatCurrency';

interface ImportCreateModalFooterProps {
  onClose: () => void;
  canViewPrices: boolean;
  issueFromGeneralWarehouse: boolean;
  displayGrandTotal: number;
  selectedPoLineCount: number;
  isEditMode: boolean;
  isPendingVoucher: boolean;
  canApprove: boolean;
  isPending: boolean;
  isApproving: boolean;
  submitBlocked: boolean;
  onSave: () => void;
  onTryApproveFromEdit: () => void;
  onSubmitCreate: (status: 'draft' | 'pending') => void;
}

export default function ImportCreateModalFooter({
  onClose,
  canViewPrices,
  issueFromGeneralWarehouse,
  displayGrandTotal,
  selectedPoLineCount,
  isEditMode,
  isPendingVoucher,
  canApprove,
  isPending,
  isApproving,
  submitBlocked,
  onSave,
  onTryApproveFromEdit,
  onSubmitCreate,
}: ImportCreateModalFooterProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4 flex-wrap">
      <Button type="button" variant="outlined" onClick={onClose}>Hủy</Button>
      <div className="flex items-center gap-3 flex-wrap md-dialog__footer-actions">
        <div className="text-sm mr-1">
          {canViewPrices && !issueFromGeneralWarehouse ? (
            <>
              <span className="text-[var(--md-on-surface-variant)]">Tổng giá trị: </span>
              <span className="font-bold text-[var(--md-primary)] tabular-nums">
                {formatCurrency(displayGrandTotal)} đ
              </span>
            </>
          ) : (
            <span className="text-[var(--md-on-surface-variant)]">
              {selectedPoLineCount > 0
                ? `${selectedPoLineCount} dòng vật tư`
                : issueFromGeneralWarehouse ? 'Chỉ ghi số lượng' : 'Không hiển thị giá'}
            </span>
          )}
        </div>
        {isEditMode ? (
          <>
            <Button type="button" variant="filled" disabled={isPending || isApproving} onClick={onSave}>
              Lưu thay đổi
            </Button>
            {canApprove && isPendingVoucher ? (
              <Button type="button" variant="filled" disabled={isPending || isApproving || submitBlocked} onClick={onTryApproveFromEdit}>
                Lưu SL thực nhận &amp; Duyệt
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Button type="button" variant="outlined" disabled={isPending || submitBlocked} onClick={() => onSubmitCreate('draft')}>
              Lưu nháp
            </Button>
            <Button type="button" variant="filled" disabled={isPending || submitBlocked} onClick={() => onSubmitCreate('pending')}>
              Chốt dự kiến
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
