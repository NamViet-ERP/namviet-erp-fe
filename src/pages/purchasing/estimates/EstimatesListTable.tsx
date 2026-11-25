import Dropdown from '../../../components/ui/Dropdown';
import TableShell from '../../../components/ui/TableShell';
import type { ListPageSize } from '../../../constants/pagination';
import { estimateStatusBadge, estimateStatusLabel } from '../../../lib/purchaseEstimateStatus';
import type { DropdownItem } from '../../../types';
import type { PurchaseEstimateListItemApiDto } from '../../../types/api/purchasingApi';

interface EstimatesListTableProps {
  items: PurchaseEstimateListItemApiDto[];
  isLoading: boolean;
  errorMessage: string | null;
  page: number;
  totalPages: number;
  pageSize: ListPageSize;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ListPageSize) => void;
  getRowActions: (row: PurchaseEstimateListItemApiDto) => DropdownItem[];
}

export default function EstimatesListTable({
  items,
  isLoading,
  errorMessage,
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  getRowActions,
}: EstimatesListTableProps) {
  return (
    <TableShell
      tableClassName="wms-inventory-table"
      colSpan={6}
      loading={isLoading}
      error={errorMessage}
      isEmpty={items.length === 0}
      emptyMessage="Chưa có dự toán. Tạo mới để bắt đầu."
      pagination={{
        embedded: true,
        currentPage: page,
        totalPages,
        onPageChange,
        pageSize,
        onPageSizeChange: s => {
          onPageSizeChange(s);
          onPageChange(1);
        },
        totalItems,
      }}
      header={(
        <tr>
          <th className="table-header-cell">Mã DT</th>
          <th className="table-header-cell">Tiêu đề / Dự án</th>
          <th className="table-header-cell">Số dòng</th>
          <th className="table-header-cell">Trạng thái</th>
          <th className="table-header-cell">Ver</th>
          <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
        </tr>
      )}
    >
      {items.map(row => (
        <tr key={row.id} className="table-row">
          <td className="table-cell font-mono">{row.code}</td>
          <td className="table-cell">
            <div className="font-medium">{row.title}</div>
            <div className="text-[var(--md-on-surface-variant)]">{row.projectCode}</div>
          </td>
          <td className="table-cell tabular-nums">{row.filledLineCount}/{row.lineCount}</td>
          <td className="table-cell">
            <span className={`badge ${estimateStatusBadge(row.status)}`}>
              {estimateStatusLabel(row.status)}
            </span>
          </td>
          <td className="table-cell">Ver {row.currentVersion}</td>
          <td className="table-cell hrm-table-col-actions">
            <Dropdown trigger="Tác vụ" items={getRowActions(row)} />
          </td>
        </tr>
      ))}
    </TableShell>
  );
}
