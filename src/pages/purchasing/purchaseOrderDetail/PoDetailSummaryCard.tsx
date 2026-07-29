import { formatDateCell, formatDateTimeVi } from '../../../lib/hrm/formatters';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import {
  PoStatusPill,
  type PoPillTone,
} from '../../../lib/purchasing/purchaseOrderStatus';
import type { PurchaseOrderDetailApiDto } from '../../../types/api/purchasingApi';
import { PoDetailMeta } from './PoDetailMeta';

type StatusView = { label: string; tone: PoPillTone };

type Props = {
  order: PurchaseOrderDetailApiDto;
  editing: boolean;
  editOrderDate: string;
  editNote: string;
  onEditOrderDateChange: (value: string) => void;
  onEditNoteChange: (value: string) => void;
  approval: StatusView;
  placement: StatusView;
  delivery: StatusView;
  payment: StatusView;
  paymentWarning: StatusView;
};

export function PoDetailSummaryCard({
  order,
  editing,
  editOrderDate,
  editNote,
  onEditOrderDateChange,
  onEditNoteChange,
  approval,
  placement,
  delivery,
  payment,
  paymentWarning,
}: Props) {
  return (
    <section className="pur-detail__card" aria-label="Thông tin đơn hàng">
      <div className="pur-detail__meta">
        <PoDetailMeta label="Mã PO" value={order.code} />
        <PoDetailMeta label="KHMH" value={order.planCode} />
        <PoDetailMeta
          label="Dự án"
          value={order.projectName ? `${order.projectCode} — ${order.projectName}` : (order.projectCode || '—')}
          span={2}
        />
        <PoDetailMeta label="Nhà cung cấp" value={order.supplierName || '—'} span={2} />
        <PoDetailMeta label="Ngày tạo" value={formatDateTimeVi(order.createdAt) ?? '—'} />
        <PoDetailMeta label="Người tạo" value={order.createdByName || '—'} />

        <PoDetailMeta
          label="Duyệt"
          value={<PoStatusPill label={approval.label} tone={approval.tone} />}
        />
        <PoDetailMeta
          label="Người duyệt"
          value={order.approvedByName
            ? `${order.approvedByName}${order.approvedAt ? ` · ${formatDateTimeVi(order.approvedAt) ?? ''}` : ''}`
            : '—'}
          muted={!order.approvedByName}
        />
        <PoDetailMeta
          label="Trạng thái đặt"
          value={<PoStatusPill label={placement.label} tone={placement.tone} />}
        />
        <PoDetailMeta
          label="Người đặt NCC"
          value={order.placedByName
            ? `${order.placedByName}${order.placedAt ? ` · ${formatDateTimeVi(order.placedAt) ?? ''}` : ''}`
            : '—'}
          muted={!order.placedByName}
        />
        <PoDetailMeta
          label="Trạng thái giao"
          value={<PoStatusPill label={delivery.label} tone={delivery.tone} />}
        />
        <PoDetailMeta
          label="Thanh toán"
          value={<PoStatusPill label={payment.label} tone={payment.tone} />}
        />

        <PoDetailMeta
          label="Cảnh báo thanh toán"
          value={<PoStatusPill label={paymentWarning.label} tone={paymentWarning.tone} />}
        />
        <PoDetailMeta label="Điều khoản thanh toán" value={`${order.supplierPaymentTermsDays} ngày`} />
        <PoDetailMeta label="Hạn thanh toán" value={formatDateCell(order.paymentDueDate ?? undefined)} />
        {editing ? (
          <>
            <PoDetailMeta
              label="Ngày đơn"
              value={(
                <input
                  className="form-input"
                  type="date"
                  value={editOrderDate}
                  onChange={e => onEditOrderDateChange(e.target.value)}
                />
              )}
            />
            <PoDetailMeta
              label="Ghi chú"
              value={(
                <textarea
                  className="form-input"
                  rows={2}
                  value={editNote}
                  onChange={e => onEditNoteChange(e.target.value)}
                />
              )}
              span="all"
            />
          </>
        ) : (
          <PoDetailMeta
            label="Ghi chú"
            value={order.note || '—'}
            span="all"
            muted={!order.note}
          />
        )}
      </div>

      <div className="pur-detail__totals" aria-label="Tổng tiền">
        <div
          className="pur-detail__total pur-detail__total--purchase"
          style={{ backgroundColor: '#f3e6cc', borderColor: '#dfc28a' }}
        >
          <div className="pur-detail__total-label">Tổng tiền</div>
          <div className="pur-detail__total-value">{formatCurrencyFull(order.totalAmount)}</div>
        </div>
      </div>
    </section>
  );
}
