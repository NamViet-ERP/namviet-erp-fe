import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Badge from '../ui/Badge';
import type { StatusKey } from '../../types';
import { buildApprovalFields } from './voucherDetailUtils';
import type { VoucherDetailField } from './voucherDetailUtils';
import { getVoucherStatusLabel, type WmsVoucherKind } from '../../lib/wms/voucherStatusLabels';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export type { VoucherDetailField };

interface VoucherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherCode: string;
  status: StatusKey;
  voucherKind?: WmsVoucherKind;
  statusHint?: string;
  approvedBy?: string;
  approvedAt?: string;
  fields: VoucherDetailField[];
  footer: ReactNode;
  children: ReactNode;
  itemsTitle?: string;
}

export default function VoucherDetailModal({
  isOpen,
  onClose,
  voucherCode,
  status,
  voucherKind,
  statusHint,
  approvedBy,
  approvedAt,
  fields,
  footer,
  children,
  itemsTitle = 'Danh sách vật tư',
}: VoucherDetailModalProps) {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const allFields = [...fields, ...buildApprovalFields(status, approvedBy, approvedAt)];

  return createPortal(
    <div
      className="md-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wms-voucher-detail-title"
    >
      <div className="md-dialog-scrim" onClick={onClose} aria-hidden />
      <div className="md-dialog md-dialog--detail wms-voucher-detail animate-scale-in">
        <div className="md-dialog__header md-dialog__header--compact">
          <div className="min-w-0 flex-1">
            <div className="md-dialog__title-row">
              <h3 id="wms-voucher-detail-title" className="md-dialog__title md-dialog__title--mono">
                {voucherCode}
              </h3>
              <Badge
                status={status}
                label={voucherKind ? getVoucherStatusLabel(status, voucherKind) : undefined}
              />
            </div>
            {statusHint && <p className="wms-voucher-detail__hint">{statusHint}</p>}
          </div>
          <button type="button" className="md-dialog__close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="md-dialog__divider" aria-hidden />

        <div className="md-dialog__info-panel">
          <div className="md-detail-grid">
            {allFields.map(field => (
              <div key={field.label} className={field.wide ? 'md-detail-field--wide' : undefined}>
                <p className="md-detail-field__label">{field.label}</p>
                <div className="md-detail-field__value">{field.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="md-dialog__body wms-voucher-detail__body">
          <p className="wms-voucher-detail__section-label">{itemsTitle}</p>
          {children}
        </div>

        {footer ? (
          <div className="md-dialog__footer wms-voucher-detail__footer">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
