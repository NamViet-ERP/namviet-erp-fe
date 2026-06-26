import { Eye, Check, Send, Pencil } from 'lucide-react';
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
  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell whitespace-nowrap">Mã chứng từ</th>
            <th className="table-header-cell">Từ kho dự án</th>
            <th className="table-header-cell">Đích</th>
            <th className="table-header-cell text-center">Trạng thái</th>
            <th className="table-header-cell text-center w-16">Tác vụ</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeletonRows colSpan={5} />
          ) : isError ? (
            <tr>
              <td colSpan={5}>
                <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadTransfers)} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5}>
                <EmptyState message={WMS_EMPTY.noTransfers} />
              </td>
            </tr>
          ) : (
            rows.map(tf => (
              <tr
                key={tf.id}
                className="table-row wms-inventory-row--interactive"
                onClick={() => onOpenDetail(tf)}
              >
                <td className="table-cell">
                  <VoucherCodeCell code={tf.voucherCode} voucher={tf} showCreator />
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
                <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                  <Dropdown
                    items={[
                      { label: 'Xem chi tiết', icon: Eye, onClick: () => onOpenDetail(tf) },
                      ...(tf.status === 'draft' || tf.status === 'pending'
                        ? [{ label: 'Sửa phiếu', icon: Pencil, onClick: () => onEdit?.(tf) }]
                        : []),
                      ...(tf.status === 'draft'
                        ? [{ label: 'Chốt dự kiến', icon: Send, onClick: () => onSubmit(tf) }]
                        : []),
                      ...(tf.status === 'pending'
                        ? [{ label: 'Duyệt thực tế', icon: Check, onClick: () => onApprove(tf) }]
                        : []),
                    ]}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
