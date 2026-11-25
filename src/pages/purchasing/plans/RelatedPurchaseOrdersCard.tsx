import { Link } from 'react-router-dom';
import TableShell from '../../../components/ui/TableShell';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import {
  PoStatusPill,
  poApprovalStatus,
  poDeliveryStatus,
  poPaymentStatus,
  poPlacementStatus,
} from '../../../lib/purchasing/purchaseOrderStatus';
import type { PurchasePlanRelatedPoApiDto } from '../../../types/api/purchasingApi';
import { formatCurrency } from '../../../utils/formatCurrency';

interface RelatedPurchaseOrdersCardProps {
  orders?: PurchasePlanRelatedPoApiDto[] | null;
}

export default function RelatedPurchaseOrdersCard({ orders }: RelatedPurchaseOrdersCardProps) {
  if (!orders || orders.length === 0) return null;

  return (
    <section className="pur-detail__card" aria-label="Đơn mua hàng liên quan">
      <h2 className="pur-detail__section-title">
        Đơn mua hàng liên quan ({orders.length})
      </h2>
      <TableShell
        className="pur-detail__table-wrap"
        tableClassName="pur-erp__table pur-erp__table--po"
        colSpan={9}
        header={(
          <tr>
            <th className="pur-pay-plan__th-po">Mã PO</th>
            <th>Nhà cung cấp</th>
            <th className="pur-erp__th-num">Số dòng</th>
            <th className="pur-erp__th-num">Tổng tiền</th>
            <th>Duyệt</th>
            <th>Đặt hàng</th>
            <th>Giao hàng</th>
            <th>Thanh toán</th>
            <th>Ngày tạo</th>
          </tr>
        )}
      >
        {orders.map(order => {
          const approval = poApprovalStatus(order.approvalStatus);
          const placement = poPlacementStatus(order.orderPlacementStatus);
          const delivery = poDeliveryStatus(order.deliveryStatus);
          const payment = poPaymentStatus(order.paymentStatus);

          return (
            <tr key={order.code}>
              <td className="pur-erp__td-code pur-pay-plan__td-po">
                <Link
                  to={`/purchasing/orders/${encodeURIComponent(order.code)}`}
                  className="pur-pay-plan__po-link"
                >
                  {order.code}
                </Link>
              </td>
              <td>{order.supplierName || '—'}</td>
              <td className="pur-erp__td-num">{order.itemCount}</td>
              <td className="pur-erp__td-num tabular-nums font-semibold">
                {formatCurrency(order.totalAmount)}
              </td>
              <td className="pur-erp__td-status">
                <PoStatusPill label={approval.label} tone={approval.tone} />
              </td>
              <td className="pur-erp__td-status">
                <PoStatusPill label={placement.label} tone={placement.tone} />
              </td>
              <td className="pur-erp__td-status">
                <PoStatusPill label={delivery.label} tone={delivery.tone} />
              </td>
              <td className="pur-erp__td-status">
                <PoStatusPill label={payment.label} tone={payment.tone} />
              </td>
              <td>{formatDateTimeVi(order.createdAt) ?? '—'}</td>
            </tr>
          );
        })}
      </TableShell>
    </section>
  );
}
