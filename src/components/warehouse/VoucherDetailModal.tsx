import type { ReactNode } from 'react';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import type { StatusKey } from '../../types';
import { buildApprovalFields } from './voucherDetailUtils';
import type { VoucherDetailField } from './voucherDetailUtils';
import { getVoucherStatusLabel, type WmsVoucherKind } from '../../lib/wms/voucherStatusLabels';

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
  const allFields = [...fields, ...buildApprovalFields(status, approvedBy, approvedAt)];

  const infoPanel = (
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
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={voucherCode}
      size="full"
      className="md-dialog--detail wms-voucher-detail"
      headerCompact
      titleClassName="md-dialog__title--mono"
      titleAdornment={
        <Badge
          status={status}
          label={voucherKind ? getVoucherStatusLabel(status, voucherKind) : undefined}
        />
      }
      subtitle={statusHint ? <p className="wms-voucher-detail__hint">{statusHint}</p> : undefined}
      beforeBody={infoPanel}
      footer={footer}
    >
      <p className="wms-voucher-detail__section-label">{itemsTitle}</p>
      {children}
    </Modal>
  );
}
