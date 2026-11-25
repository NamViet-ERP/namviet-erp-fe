import type { ComponentProps } from 'react';
import Button from '../../../components/ui/Button';
import Dropdown from '../../../components/ui/Dropdown';
import EmptyState from '../../../components/ui/EmptyState';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import Pagination from '../../../components/ui/Pagination';
import TableShell from '../../../components/ui/TableShell';
import { formatDateCell, formatDateTimeVi } from '../../../lib/hrm/formatters';
import type { DropdownItem } from '../../../types';
import type { PurchasePaymentApiDto } from '../../../types/api/purchasingApi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { paymentStatusBadgeClass, paymentStatusLabel } from './paymentStatusHelpers';

const COL_COUNT = 10;

function paymentPaidMeta(row: {
  status?: string | null;
  paidAt?: string | null;
  paidByName?: string | null;
}) {
  if (row.status !== 'paid') return null;
  const name = row.paidByName?.trim() || '';
  const time = formatDateTimeVi(row.paidAt ?? undefined);
  if (!name && !time) return null;
  return { name, time };
}

interface PurchasePaymentsTableProps {
  items: PurchasePaymentApiDto[];
  isLoading: boolean;
  errorMessage: string | null;
  emptyMessage: string;
  onRetry: () => void;
  onOpenPayment: (code: string) => void;
  rowActions: (row: PurchasePaymentApiDto) => DropdownItem[];
  pagination?: ComponentProps<typeof Pagination>;
}

export default function PurchasePaymentsTable({
  items,
  isLoading,
  errorMessage,
  emptyMessage,
  onRetry,
  onOpenPayment,
  rowActions,
  pagination,
}: PurchasePaymentsTableProps) {
  if (errorMessage) {
    return (
      <EmptyState
        message={errorMessage}
        action={(
          <Button type="button" variant="outlined" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      />
    );
  }

  return (
    <TableShell
      tableClassName="pur-erp__table pur-erp__table--po pur-erp__table--payments-list"
      colSpan={COL_COUNT}
      loading={isLoading}
      skeletonRows={8}
      isEmpty={items.length === 0}
      emptyMessage={emptyMessage}
      pagination={pagination}
      header={(
        <tr>
          <th>Mã DNTT</th>
          <th>Mã PO</th>
          <th className="pur-erp__th-num">Đợt</th>
          <th>Nhà cung cấp</th>
          <th>Hóa đơn</th>
          <th className="pur-erp__th-num">Số tiền</th>
          <th>Hạn TT</th>
          <th className="pur-erp__th-status">Trạng thái</th>
          <th>Ngày tạo</th>
          <th className="pur-erp__th-actions">Tác vụ</th>
        </tr>
      )}
    >
      {items.map(row => {
        const paidMeta = paymentPaidMeta(row);
        return (
          <tr
            key={row.code}
            className="cursor-pointer"
            onClick={() => onOpenPayment(row.code)}
          >
            <td className="pur-erp__td-code" onClick={e => e.stopPropagation()}>
              <EntityCodeLink
                code={row.code}
                to={`/purchasing/payments/${encodeURIComponent(row.code)}`}
              />
            </td>
            <td className="pur-erp__td-code" onClick={e => e.stopPropagation()}>
              {row.poCode ? (
                <EntityCodeLink
                  code={row.poCode}
                  to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                />
              ) : '-'}
            </td>
            <td className="pur-erp__td-num">{row.stageNumber ?? '-'}</td>
            <td>{row.supplierName || '-'}</td>
            <td>{row.invoiceNo || '-'}</td>
            <td className="pur-erp__td-num">{formatCurrency(row.amount)}</td>
            <td>{formatDateCell(row.dueDate)}</td>
            <td className="pur-erp__td-status">
              <div className="pur-plan-status-cell">
                <span className={paymentStatusBadgeClass(row.status)}>
                  {paymentStatusLabel(row.status)}
                </span>
                {paidMeta ? (
                  <div className="pur-plan-status-meta">
                    {paidMeta.time ? (
                      <div className="tabular-nums">{paidMeta.time}</div>
                    ) : null}
                    {paidMeta.name ? (
                      <div className="pur-plan-status-meta__name" title={paidMeta.name}>
                        {paidMeta.name}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </td>
            <td className="pur-erp__td-datetime">{formatDateTimeVi(row.createdAt)}</td>
            <td
              className="pur-erp__td-actions text-center"
              onClick={e => e.stopPropagation()}
            >
              <Dropdown trigger="Tác vụ" items={rowActions(row)} />
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}
