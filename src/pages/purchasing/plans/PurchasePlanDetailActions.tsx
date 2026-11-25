import {
  CheckCircle2,
  CopyPlus,
  FolderLock,
  FolderOpen,
  Pencil,
  Send,
  XCircle,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { planStatusBadgeClass, planStatusLabel } from './planStatusHelpers';

interface PurchasePlanDetailActionsProps {
  status: string;
  actionBusy: boolean;
  canSubmit: boolean;
  canApproveL1: boolean;
  canApproveL2: boolean;
  canReject: boolean;
  canRemake: boolean;
  onEdit: () => void;
  onSubmit: () => void;
  onApproveL1: () => void;
  onApproveL2: () => void;
  onOpenReject: () => void;
  onRemake: () => void;
  onReopen: () => void;
  onOpenClose: () => void;
}

export default function PurchasePlanDetailActions({
  status,
  actionBusy,
  canSubmit,
  canApproveL1,
  canApproveL2,
  canReject,
  canRemake,
  onEdit,
  onSubmit,
  onApproveL1,
  onApproveL2,
  onOpenReject,
  onRemake,
  onReopen,
  onOpenClose,
}: PurchasePlanDetailActionsProps) {
  const isDraft = status === 'draft';
  const isPendingL1 = status === 'pending_l1';
  const isPendingL2 = status === 'pending_l2';
  const isApproved = status === 'approved' || status === 'active';
  const isRejected = status === 'rejected';
  const isClosed = status === 'closed';

  return (
    <div className="pur-detail__actions">
      <span className={planStatusBadgeClass(status)}>
        {planStatusLabel(status)}
      </span>
      {isDraft ? (
        <>
          <Button
            type="button"
            variant="outlined"
            size="sm"
            leftIcon={Pencil}
            disabled={actionBusy}
            onClick={onEdit}
          >
            Chỉnh sửa
          </Button>
          {canSubmit ? (
            <Button
              type="button"
              variant="filled"
              size="sm"
              leftIcon={Send}
              disabled={actionBusy}
              onClick={onSubmit}
            >
              Gửi duyệt
            </Button>
          ) : null}
        </>
      ) : null}
      {isPendingL1 && canApproveL1 ? (
        <Button
          type="button"
          variant="filled"
          size="sm"
          leftIcon={CheckCircle2}
          disabled={actionBusy}
          onClick={onApproveL1}
        >
          Duyệt cấp 1
        </Button>
      ) : null}
      {isPendingL2 && canApproveL2 ? (
        <Button
          type="button"
          variant="filled"
          size="sm"
          leftIcon={CheckCircle2}
          disabled={actionBusy}
          onClick={onApproveL2}
        >
          Duyệt cấp 2
        </Button>
      ) : null}
      {(isPendingL1 || isPendingL2) && canReject ? (
        <Button
          type="button"
          variant="outlined"
          size="sm"
          leftIcon={XCircle}
          disabled={actionBusy}
          onClick={onOpenReject}
        >
          Từ chối
        </Button>
      ) : null}
      {isRejected && canRemake ? (
        <Button
          type="button"
          variant="filled"
          size="sm"
          leftIcon={CopyPlus}
          disabled={actionBusy}
          onClick={onRemake}
        >
          Lập phiếu mới
        </Button>
      ) : null}
      {isClosed ? (
        <Button
          type="button"
          variant="filled"
          size="sm"
          leftIcon={FolderOpen}
          disabled={actionBusy}
          onClick={onReopen}
        >
          Mở lại kế hoạch
        </Button>
      ) : null}
      {isApproved ? (
        <Button
          type="button"
          variant="outlined"
          size="sm"
          leftIcon={FolderLock}
          disabled={actionBusy}
          onClick={onOpenClose}
        >
          Đóng kế hoạch
        </Button>
      ) : null}
    </div>
  );
}
