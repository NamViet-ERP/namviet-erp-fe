import { Check, Send, Pencil } from 'lucide-react';
import type { Transfer } from '../../../types';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import VoucherCodeCell from '../../../components/warehouse/VoucherCodeCell';
import Dropdown from '../../../components/ui/Dropdown';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../../lib/wms/messages';
import { destinationLabel, transferProjectLabel } from './transferUtils';

interface TransferTableProps {
  rows: Transfer[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onOpenDetail: (tf: Transfer) => void;
  onEdit?: (tf: Transfer) => void;
  onSubmit: (tf: Transfer) => void;
  onApprove: (tf: Transfer) => void;
}

function rowActionItems(
  tf: Transfer,
  opts: {
    onEdit?: (tf: Transfer) => void;
    onSubmit: (tf: Transfer) => void;
    onApprove: (tf: Transfer) => void;
  },
) {
  const items: Array<{ label: string; icon: typeof Pencil; onClick: () => void }> = [];
  if (tf.status === 'draft' || tf.status === 'pending') {
    items.push({ label: 'Sửa phiếu', icon: Pencil, onClick: () => opts.onEdit?.(tf) });
  }
  if (tf.status === 'draft') {
    items.push({ label: 'Chốt dự kiến', icon: Send, onClick: () => opts.onSubmit(tf) });
  }
  if (tf.status === 'pending') {
    items.push({ label: 'Duyệt thực tế', icon: Check, onClick: () => opts.onApprove(tf) });
  }
  return items;
}

export default function TransferTable({
  rows,
  isLoading,
  isError,
  error,
  onOpenDetail,
  onEdit,
  onSubmit,
  onApprove,
}: TransferTableProps) {
  const showActionsCol = rows.some(tf => rowActionItems(tf, { onEdit, onSubmit, onApprove }).length > 0);
  const colSpan = showActionsCol ? 5 : 4;

  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell whitespace-nowrap">Mã chứng từ</th>
            <th className="table-header-cell">Từ kho dự án</th>
            <th className="table-header-cell">Đích</th>
            <th className="table-header-cell text-center">Trạng thái</th>
            {showActionsCol ? (
              <th className="table-header-cell text-center w-16">Tác vụ</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeletonRows colSpan={colSpan} />
          ) : isError ? (
            <tr>
              <td colSpan={colSpan}>
                <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadTransfers)} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan}>
                <EmptyState message={WMS_EMPTY.noTransfers} />
              </td>
            </tr>
          ) : (
            rows.map(tf => {
              const actions = rowActionItems(tf, { onEdit, onSubmit, onApprove });
              return (
                <tr
                  key={tf.id}
                  className="table-row wms-inventory-row--interactive"
                  onClick={() => onOpenDetail(tf)}
                >
                  <td className="table-cell">
                    <VoucherCodeCell
                      code={tf.voucherCode}
                      voucher={tf}
                      showCreator
                      onCodeClick={() => onOpenDetail(tf)}
                    />
                  </td>
                  <td className="table-cell max-w-[220px]">
                    <span className="line-clamp-1" title={transferProjectLabel(tf)}>
                      {transferProjectLabel(tf)}
                    </span>
                  </td>
                  <td className="table-cell">{destinationLabel(tf)}</td>
                  <td className="table-cell text-center">
                    <VoucherStatusCell
                      voucherKind="transfer"
                      status={tf.status}
                      approvedBy={tf.approvedBy}
                      approvedAt={tf.approvedAt}
                    />
                  </td>
                  {showActionsCol ? (
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      {actions.length > 0 ? <Dropdown items={actions} /> : null}
                    </td>
                  ) : null}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
