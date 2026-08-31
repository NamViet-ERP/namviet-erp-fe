import { Check, Send, Pencil } from 'lucide-react';
import type { ExportReturn } from '../../../types';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import VoucherCodeCell from '../../../components/warehouse/VoucherCodeCell';
import Dropdown from '../../../components/ui/Dropdown';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../../lib/apiClient';

interface ExportReturnTableProps {
  rows: ExportReturn[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onOpenDetail: (row: ExportReturn) => void;
  onEdit?: (row: ExportReturn) => void;
  onSubmit: (row: ExportReturn) => void;
  onApprove: (row: ExportReturn) => void;
}

function rowActionItems(
  row: ExportReturn,
  opts: {
    onEdit?: (row: ExportReturn) => void;
    onSubmit: (row: ExportReturn) => void;
    onApprove: (row: ExportReturn) => void;
  },
) {
  const items: Array<{ label: string; icon: typeof Pencil; onClick: () => void }> = [];
  if (row.status === 'draft' || row.status === 'pending') {
    items.push({ label: 'Sửa phiếu', icon: Pencil, onClick: () => opts.onEdit?.(row) });
  }
  if (row.status === 'draft') {
    items.push({ label: 'Chốt dự kiến', icon: Send, onClick: () => opts.onSubmit(row) });
  }
  if (row.status === 'pending') {
    items.push({ label: 'Duyệt kho', icon: Check, onClick: () => opts.onApprove(row) });
  }
  return items;
}

export default function ExportReturnTable({
  rows,
  isLoading,
  isError,
  error,
  onOpenDetail,
  onEdit,
  onSubmit,
  onApprove,
}: ExportReturnTableProps) {
  const showActionsCol = rows.some(row => rowActionItems(row, { onEdit, onSubmit, onApprove }).length > 0);
  const colSpan = showActionsCol ? 6 : 5;

  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table export-return-list-table">
        <thead>
          <tr>
            <th className="table-header-cell whitespace-nowrap">Mã phiếu HT</th>
            <th className="table-header-cell">Phiếu xuất nguồn</th>
            <th className="table-header-cell">Kho dự án</th>
            <th className="table-header-cell">Ngày</th>
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
                <EmptyState message={getApiErrorMessage(error, 'Không tải được phiếu hoàn trả.')} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan}>
                <EmptyState message="Chưa có phiếu hoàn trả nào." />
              </td>
            </tr>
          ) : (
            rows.map(row => {
              const actions = rowActionItems(row, { onEdit, onSubmit, onApprove });
              return (
                <tr
                  key={row.id}
                  className="table-row wms-inventory-row--interactive"
                  onClick={() => onOpenDetail(row)}
                >
                  <td className="table-cell">
                    <VoucherCodeCell
                      code={row.voucherCode}
                      voucher={row}
                      showCreator
                      onCodeClick={() => onOpenDetail(row)}
                    />
                  </td>
                  <td className="table-cell">
                    <span className="entity-code">{row.sourceExportCode || '—'}</span>
                  </td>
                  <td className="table-cell export-return-project-cell" title={row.projectName || row.project || undefined}>
                    {row.projectName || row.project || '—'}
                  </td>
                  <td className="table-cell whitespace-nowrap">{row.date}</td>
                  <td className="table-cell text-center">
                    <VoucherStatusCell
                      status={row.status}
                      voucherKind="exportReturn"
                      approvedBy={row.approvedBy}
                      approvedAt={row.approvedAt}
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
