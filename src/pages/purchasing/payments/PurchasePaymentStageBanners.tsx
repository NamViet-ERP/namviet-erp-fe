import { AlertTriangle, CircleCheck, Eye } from 'lucide-react';
import Button from '../../../components/ui/Button';
import type {
  PurchaseOrderDetailApiDto,
  PurchasePaymentApiDto,
  PurchasePaymentNextStageApiDto,
} from '../../../types/api/purchasingApi';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { CannotCreateReason } from './usePurchasePaymentDetail';

interface PurchasePaymentStageBannersProps {
  isCreate: boolean;
  poCode: string;
  order?: PurchaseOrderDetailApiDto;
  payment?: PurchasePaymentApiDto;
  nextStage?: PurchasePaymentNextStageApiDto | null;
  nextStageLoading: boolean;
  docsGateBlocked: boolean;
  missingDocTypes: string[];
  poHasNoApprovedImport: boolean;
  cannotCreateReason: CannotCreateReason | null;
  onViewPayment: (code: string) => void;
}

export default function PurchasePaymentStageBanners({
  isCreate,
  poCode,
  order,
  payment,
  nextStage,
  nextStageLoading,
  docsGateBlocked,
  missingDocTypes,
  poHasNoApprovedImport,
  cannotCreateReason,
  onViewPayment,
}: PurchasePaymentStageBannersProps) {
  return (
    <>
      {isCreate && poCode && nextStage ? (
        <div className="pur-dntt__stage-banner" role="status">
          <CircleCheck size={16} strokeWidth={1.75} aria-hidden />
          <div>
            <strong>
              Đợt {nextStage.stageNumber}/{nextStage.totalStages}
            </strong>
            <p>
              DNTT tuần tự — số tiền đề xuất {formatCurrencyFull(nextStage.amount)}
              {' '}({nextStage.percent}% giá trị PO).
            </p>
          </div>
        </div>
      ) : null}

      {docsGateBlocked ? (
        <div className="pur-dntt__stage-banner pur-dntt__stage-banner--warn" role="alert">
          <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
          <div>
            <strong>Chưa đủ chứng từ đợt {nextStage?.stageNumber}</strong>
            <p>
              Thiếu: {missingDocTypes.join(', ')}. Tải đủ file trên chi tiết PO trước khi tạo DNTT.
            </p>
          </div>
        </div>
      ) : null}

      {poHasNoApprovedImport ? (
        <div className="pur-dntt__stage-banner pur-dntt__stage-banner--warn" role="status">
          <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
          <div>
            <strong>PO chưa có phiếu nhập đã duyệt</strong>
            <p>
              DNTT vẫn tạo được nếu là tạm ứng theo đợt. Số tiền chưa gắn với hàng đã nhận kho.
            </p>
          </div>
        </div>
      ) : null}

      {isCreate && poCode && order && !nextStageLoading && !nextStage ? (
        <div className="pur-dntt__stage-banner pur-dntt__stage-banner--warn" role="status">
          <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
          <div className="flex-1">
            <strong>{cannotCreateReason?.title || 'Không còn đợt cần tạo DNTT'}</strong>
            <p>
              {cannotCreateReason?.detail || 'PO chưa duyệt, chưa có đợt, đã đủ DNTT, hoặc đang chờ thanh toán đợt hiện tại.'}
            </p>
            {cannotCreateReason?.paymentCode ? (
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  leftIcon={Eye}
                  onClick={() => onViewPayment(cannotCreateReason.paymentCode!)}
                >
                  Xem {cannotCreateReason.paymentCode}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isCreate && payment ? (
        <div className="pur-dntt__stage-banner" role="status">
          <CircleCheck size={16} strokeWidth={1.75} aria-hidden />
          <div>
            <strong>Đợt {payment.stageNumber}</strong>
            <p>DNTT gắn đợt thanh toán số {payment.stageNumber} của {payment.poCode}.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
