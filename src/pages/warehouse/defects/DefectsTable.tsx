import type { ComponentProps } from 'react';
import Button from '../../../components/ui/Button';
import Dropdown from '../../../components/ui/Dropdown';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import Pagination from '../../../components/ui/Pagination';
import TableShell from '../../../components/ui/TableShell';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type { DropdownItem } from '../../../types';
import type { PurchaseDefectApiDto } from '../../../types/api/poDefectApi';
import DefectStatusCell from './DefectStatusCell';

interface DefectsTableProps {
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  rows: PurchaseDefectApiDto[];
  buildRowActions: (row: PurchaseDefectApiDto) => DropdownItem[];
  onOpenDetail: (row: PurchaseDefectApiDto) => void;
  pagination?: ComponentProps<typeof Pagination>;
}

export default function DefectsTable({
  isLoading,
  isError = false,
  error,
  onRetry,
  rows,
  buildRowActions,
  onOpenDetail,
  pagination,
}: DefectsTableProps) {
  const showActionsCol = rows.some(row => buildRowActions(row).length > 0);
  const colSpan = showActionsCol ? 8 : 7;

  return (
    <TableShell
      flushTop
      colSpan={colSpan}
      loading={isLoading}
      isEmpty={isError || rows.length === 0}
      emptyMessage={isError ? getApiErrorMessage(error, 'Không tải được phiếu hàng lỗi.') : 'Chưa có phiếu hàng lỗi.'}
      emptyAction={
        isError && onRetry ? (
          <Button type="button" variant="outlined" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        ) : undefined
      }
      pagination={pagination}
      header={
        <tr>
          <th className="table-header-cell text-center">Mã phiếu</th>
          <th className="table-header-cell text-center">Nguồn</th>
          <th className="table-header-cell text-center">Mã đơn hàng</th>
          <th className="table-header-cell text-center">KHMH</th>
          <th className="table-header-cell text-center">Dự án</th>
          <th className="table-header-cell text-left">NCC</th>
          <th className="table-header-cell text-center">Trạng thái</th>
          {showActionsCol ? <th className="table-header-cell text-center">Tác vụ</th> : null}
        </tr>
      }
    >
      {rows.map(row => {
        const actions = showActionsCol ? buildRowActions(row) : [];
        return (
          <tr
            key={row.ticketCode}
            className="table-row wms-inventory-row--interactive"
            onClick={() => onOpenDetail(row)}
          >
            <td className="table-cell text-center">
              <EntityCodeLink code={row.ticketCode} onClick={() => onOpenDetail(row)} />
            </td>
            <td className="table-cell text-center">
              <span className={`badge ${row.sourceType === 'stock' ? 'badge-md-neutral' : 'badge-new'}`}>
                {row.sourceType === 'stock' ? 'Tồn kho' : 'PO'}
              </span>
            </td>
            <td className="table-cell text-center">
              {row.poCode ? <span className="entity-code">{row.poCode}</span> : '—'}
            </td>
            <td className="table-cell text-center">
              {row.planCode ? <span className="entity-code">{row.planCode}</span> : '—'}
            </td>
            <td className="table-cell text-center">
              {row.projectCode ? <span className="entity-code">{row.projectCode}</span> : '—'}
            </td>
            <td className="table-cell text-left">{row.supplierName || '—'}</td>
            <td className="table-cell text-center">
              <DefectStatusCell row={row} />
            </td>
            {showActionsCol ? (
              <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                {actions.length > 0 ? <Dropdown items={actions} /> : null}
              </td>
            ) : null}
          </tr>
        );
      })}
    </TableShell>
  );
}
