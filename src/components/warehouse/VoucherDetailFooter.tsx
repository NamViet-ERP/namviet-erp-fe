import type { StatusKey } from '../../types';
import Button from '../ui/Button';

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
  const canApprove = status === 'pending' && onApprove;

  if (!canSubmit && !canApprove) return null;

  return (
    <>
      {canSubmit && (
        <Button
          type="button"
          variant="outlined"
          disabled={isSubmitPending}
          onClick={onSubmit}
        >
          Duyệt dự kiến
        </Button>
      )}
      {canApprove && (
        <Button
          type="button"
          variant="filled"
          disabled={isApprovePending}
          onClick={onApprove}
        >
          Duyệt kho
        </Button>
      )}
    </>
  );
}
