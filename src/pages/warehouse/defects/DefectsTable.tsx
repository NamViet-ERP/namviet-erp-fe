import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import Dropdown from '../../../components/ui/Dropdown';
import type { DropdownItem } from '../../../types';
import type { PurchaseDefectApiDto } from '../../../types/api/poDefectApi';
import DefectStatusCell from './DefectStatusCell';

interface DefectsTableProps {
  isLoading: boolean;
  rows: PurchaseDefectApiDto[];
  buildRowActions: (row: PurchaseDefectApiDto) => DropdownItem[];
  onOpenDetail: (row: PurchaseDefectApiDto) => void;
}

export default function DefectsTable({
  isLoading,
  rows,
  buildRowActions,
  onOpenDetail,
}: DefectsTableProps) {
  const showActionsCol = rows.some(row => buildRowActions(row).length > 0);
  const colSpan = showActionsCol ? 8 : 7;

  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell text-center">Mã phiếu</th>
            <th className="table-header-cell text-center">Nguồn</th>
            <th className="table-header-cell text-center">PO</th>
            <th className="table-header-cell text-center">KHMH</th>
            <th className="table-header-cell text-center">Dự án</th>
            <th className="table-header-cell text-center">NCC</th>
            <th className="table-header-cell text-center">Trạng thái</th>
            {showActionsCol ? (
              <th className="table-header-cell text-center">Tác vụ</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeletonRows rows={5} colSpan={colSpan} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan}>
                <EmptyState message="Chưa có phiếu hàng lỗi." />
              </td>
            </tr>
          ) : (
            rows.map(row => {
              const actions = showActionsCol ? buildRowActions(row) : [];
              return (
                <tr
                  key={row.ticketCode}
                  className="table-row wms-inventory-row--interactive"
                  onClick={() => onOpenDetail(row)}
                >
                  <td className="table-cell text-center font-semibold">{row.ticketCode}</td>
                  <td className="table-cell text-center">
                    <span className={`badge ${row.sourceType === 'stock' ? 'badge-md-neutral' : 'badge-new'}`}>
                      {row.sourceType === 'stock' ? 'Tồn kho' : 'PO'}
                    </span>
                  </td>
                  <td className="table-cell text-center">{row.poCode || '—'}</td>
                  <td className="table-cell text-center">{row.planCode || '—'}</td>
                  <td className="table-cell text-center">{row.projectCode || '—'}</td>
                  <td className="table-cell text-center">{row.supplierName || '—'}</td>
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
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
