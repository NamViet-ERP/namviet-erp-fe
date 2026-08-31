import { Check, Send, Pencil } from 'lucide-react';
import type { Export } from '../../../types';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import VoucherCodeCell from '../../../components/warehouse/VoucherCodeCell';
import Dropdown from '../../../components/ui/Dropdown';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../../lib/wms/messages';
import { exportKindLabel, exportProjectLabel } from './exportUtils';

interface ExportTableProps {
  rows: Export[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onOpenDetail: (exp: Export) => void;
  onEdit?: (exp: Export) => void;
  onSubmit: (exp: Export) => void;
  onApprove: (exp: Export) => void;
}

function rowActionItems(
  exp: Export,
  opts: {
    onEdit?: (exp: Export) => void;
    onSubmit: (exp: Export) => void;
    onApprove: (exp: Export) => void;
  },
) {
  const items: Array<{ label: string; icon: typeof Pencil; onClick: () => void }> = [];
  if (exp.isDirectProcurement) {
    if (exp.status === 'pending') {
      items.push({ label: 'Duyệt thực tế', icon: Check, onClick: () => opts.onApprove(exp) });
    }
    return items;
  }
  if (exp.status === 'draft' || exp.status === 'pending') {
    items.push({ label: 'Sửa phiếu', icon: Pencil, onClick: () => opts.onEdit?.(exp) });
  }
  if (exp.status === 'draft') {
    items.push({ label: 'Chốt dự kiến', icon: Send, onClick: () => opts.onSubmit(exp) });
  }
  if (exp.status === 'pending') {
    items.push({ label: 'Duyệt thực tế', icon: Check, onClick: () => opts.onApprove(exp) });
  }
  return items;
}

export default function ExportTable({
  rows,
  isLoading,
  isError,
  error,
  onOpenDetail,
  onEdit,
  onSubmit,
  onApprove,
}: ExportTableProps) {
  const showActionsCol = rows.some(exp => rowActionItems(exp, { onEdit, onSubmit, onApprove }).length > 0);
  const colSpan = (showActionsCol ? 6 : 5);

  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell whitespace-nowrap">Mã chứng từ</th>
            <th className="table-header-cell">Loại</th>
            <th className="table-header-cell">Kho dự án</th>
            <th className="table-header-cell">Mã đơn hàng</th>
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
                <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadExports)} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan}>
                <EmptyState message={WMS_EMPTY.noExports} />
              </td>
            </tr>
          ) : (
            rows.map(exp => {
              const actions = rowActionItems(exp, { onEdit, onSubmit, onApprove });
              return (
                <tr
                  key={exp.id}
                  className="table-row wms-inventory-row--interactive"
                  onClick={() => onOpenDetail(exp)}
                >
                  <td className="table-cell">
                    <VoucherCodeCell
                      code={exp.voucherCode}
                      voucher={exp}
                      onCodeClick={() => onOpenDetail(exp)}
                    />
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${exp.isDirectProcurement ? 'badge-new' : 'badge-md-neutral'}`}>
                      {exportKindLabel(exp)}
                    </span>
                  </td>
                  <td className="table-cell max-w-[220px]">
                    <span className="line-clamp-1" title={exportProjectLabel(exp)}>
                      {exportProjectLabel(exp)}
                    </span>
                  </td>
                  <td className="table-cell">
                    {exp.soCode ? <span className="entity-code">{exp.soCode}</span> : '—'}
                  </td>
                  <td className="table-cell text-center">
                    <VoucherStatusCell
                      voucherKind="export"
                      status={exp.status}
                      approvedBy={exp.approvedBy}
                      approvedAt={exp.approvedAt}
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
