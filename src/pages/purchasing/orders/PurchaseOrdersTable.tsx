import type { ComponentProps } from 'react';
import { Check } from 'lucide-react';
import Dropdown from '../../../components/ui/Dropdown';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import Pagination from '../../../components/ui/Pagination';
import TableShell from '../../../components/ui/TableShell';
import { getInteractiveRowProps } from '../../../lib/a11y/interactiveRow';
import { formatDateTimeVi } from '../../../lib/hrm/formatters';
import {
  PoStatusPill,
  poDeliveryStatus,
  poPaymentStatus,
  poPaymentWarningStatus,
  poPlacementStatus,
} from '../../../lib/purchasing/purchaseOrderStatus';
import type { DropdownItem } from '../../../types';
import type { PurchaseOrderApiDto } from '../../../types/api/purchasingApi';
import { formatCurrency } from '../../../utils/formatCurrency';

const COL_COUNT_BASE = 12;

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function PoApprovalStatusCell({
  row,
  canApprove,
  approving,
  onApprove,
}: {
  row: PurchaseOrderApiDto;
  canApprove: boolean;
  approving: boolean;
  onApprove: (code: string) => void;
}) {
  const approved = row.approvalStatus === 'approved';
  if (!approved) {
    if (canApprove) {
      return (
        <div className="pur-erp__approve">
          <button
            type="button"
            className="pur-erp__pill pur-erp__pill--warn pur-erp__approve-btn"
            title="Bạn có muốn duyệt phiếu?"
            aria-label={`Duyệt PO ${row.code}`}
            disabled={approving}
            onClick={() => onApprove(row.code)}
          >
            Chưa duyệt
            <span className="pur-erp__approve-mark" aria-hidden>
              <Check size={10} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      );
    }
    return (
      <div className="pur-erp__approve">
        <span className="pur-erp__pill pur-erp__pill--warn pur-erp__approve-btn pur-erp__approve-btn--static">
          Chưa duyệt
          <span className="pur-erp__approve-mark" aria-hidden>
            <Check size={10} strokeWidth={2.5} />
          </span>
        </span>
      </div>
    );
  }

  const approver = row.approvedByName?.trim() || '—';
  const tip = row.approvedAt
    ? `Vào lúc: ${formatDateTimeVi(row.approvedAt) ?? row.approvedAt}`
    : '';

  return (
    <div className="pur-erp__approve">
      <span className="pur-erp__pill pur-erp__pill--ok">Đã duyệt</span>
      <div className="pur-erp__approve-user">
        <span
          className="pur-erp__approve-avatar"
          data-tip={tip || undefined}
          tabIndex={tip ? 0 : undefined}
          role={tip ? 'img' : undefined}
          aria-label={tip || undefined}
        >
          {nameInitials(approver)}
        </span>
        <span className="pur-erp__approve-name" title={approver}>{approver}</span>
      </div>
    </div>
  );
}

interface PurchaseOrdersTableProps {
  items: PurchaseOrderApiDto[];
  isLoading: boolean;
  errorMessage: string | null;
  canApprove: boolean;
  approving: boolean;
  showActionsCol: boolean;
  onApprove: (code: string) => void;
  onOpenOrder: (code: string) => void;
  rowActions: (row: PurchaseOrderApiDto) => DropdownItem[];
  pagination?: ComponentProps<typeof Pagination>;
}

export default function PurchaseOrdersTable({
  items,
  isLoading,
  errorMessage,
  canApprove,
  approving,
  showActionsCol,
  onApprove,
  onOpenOrder,
  rowActions,
  pagination,
}: PurchaseOrdersTableProps) {
  const colCount = COL_COUNT_BASE + (showActionsCol ? 1 : 0);

  return (
    <TableShell
      tableClassName="pur-erp__table pur-erp__table--po"
      colSpan={colCount}
      loading={isLoading}
      skeletonRows={8}
      error={errorMessage}
      isEmpty={items.length === 0}
      emptyMessage="Chưa có đơn hàng khớp bộ lọc."
      pagination={pagination}
      header={(
        <tr>
          <th>Ngày tạo</th>
          <th>Mã PO</th>
          <th>KHMH</th>
          <th>Dự án</th>
          <th>Nhà cung cấp</th>
          <th className="pur-erp__th-num">Tổng tiền (VNĐ)</th>
          <th className="pur-erp__th-status">Trạng thái</th>
          <th className="pur-erp__th-status">Trạng thái đặt</th>
          <th className="pur-erp__th-status">Trạng thái giao</th>
          <th className="pur-erp__th-status">Tình trạng thanh toán</th>
          <th className="pur-erp__th-status">Cảnh báo thanh toán</th>
          <th>Ghi chú</th>
          {showActionsCol ? <th>Tác vụ</th> : null}
        </tr>
      )}
    >
      {items.map(row => {
        const placement = poPlacementStatus(row.orderPlacementStatus);
        const delivery = poDeliveryStatus(row.deliveryStatus);
        const payment = poPaymentStatus(row.paymentStatus);
        const warning = poPaymentWarningStatus(row.paymentWarning);
        const actions = showActionsCol ? rowActions(row) : [];

        return (
          <tr
            key={row.code}
            className="cursor-pointer"
            onClick={() => onOpenOrder(row.code)}
            {...getInteractiveRowProps(() => onOpenOrder(row.code), `Xem đơn hàng ${row.code}`)}
          >
            <td className="pur-erp__td-datetime">{formatDateTimeVi(row.createdAt) ?? '—'}</td>
            <td className="pur-erp__td-code" onClick={e => e.stopPropagation()}>
              <EntityCodeLink
                code={row.code}
                to={`/purchasing/orders/${encodeURIComponent(row.code)}`}
              />
            </td>
            <td className="pur-erp__td-code" onClick={e => e.stopPropagation()}>
              {row.planCode ? (
                <EntityCodeLink
                  code={row.planCode}
                  to={
                    row.planCode.toUpperCase().startsWith('MHPS-')
                      ? `/purchasing/adhoc/${encodeURIComponent(row.planCode)}`
                      : `/purchasing/plans/${encodeURIComponent(row.planCode)}`
                  }
                />
              ) : (
                '—'
              )}
            </td>
            <td className="pur-erp__td-project">
              {row.projectName
                ? `${row.projectName} (${row.projectCode})`
                : (row.projectCode || '—')}
            </td>
            <td>{row.supplierName || '—'}</td>
            <td className="pur-erp__td-num tabular-nums font-mono">{formatCurrency(row.totalAmount)}</td>
            <td className="pur-erp__td-status" onClick={e => e.stopPropagation()}>
              <PoApprovalStatusCell
                row={row}
                canApprove={canApprove}
                approving={approving}
                onApprove={onApprove}
              />
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
            <td className="pur-erp__td-status">
              <PoStatusPill label={warning.label} tone={warning.tone} />
            </td>
            <td>{row.note || '—'}</td>
            {showActionsCol ? (
              <td className="text-center" onClick={e => e.stopPropagation()}>
                {actions.length > 0 ? (
                  <Dropdown trigger="Tác vụ" items={actions} />
                ) : null}
              </td>
            ) : null}
          </tr>
        );
      })}
    </TableShell>
  );
}
