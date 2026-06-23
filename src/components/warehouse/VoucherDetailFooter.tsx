import type { StatusKey } from '../../types';

interface VoucherDetailFooterProps {
  status: StatusKey;
  onSubmit?: () => void;
  onApprove?: () => void;
  isSubmitPending?: boolean;
  isApprovePending?: boolean;
}

export default function VoucherDetailFooter({
  status,
  onSubmit,
  onApprove,
  isSubmitPending,
  isApprovePending,
}: VoucherDetailFooterProps) {
  const canSubmit = status === 'draft' && onSubmit;
  const canApprove = (status === 'draft' || status === 'pending') && onApprove;

  if (!canSubmit && !canApprove) return null;

  return (
    <>
      {canSubmit && (
        <button
          type="button"
          className="btn btn-outline"
          disabled={isSubmitPending}
          onClick={onSubmit}
        >
          Chốt phiếu
        </button>
      )}
      {canApprove && (
        <button
          type="button"
          className="btn btn-filled"
          disabled={isApprovePending}
          onClick={onApprove}
        >
          Thủ kho duyệt
        </button>
      )}
    </>
  );
}
