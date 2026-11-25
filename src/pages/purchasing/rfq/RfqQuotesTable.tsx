import Dropdown from '../../../components/ui/Dropdown';
import TableShell from '../../../components/ui/TableShell';
import type { ListPageSize } from '../../../constants/pagination';
import { formatDateCell } from '../../../lib/hrm/formatters';
import type { DropdownItem } from '../../../types';
import type { PurchaseRfqQuoteApiDto } from '../../../types/api/purchasingApi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { RFQ_STATUS_LABEL, rfqStatusBadge } from './useRfqQuotesController';

const COLS = 9;

interface RfqQuotesTableProps {
  items: PurchaseRfqQuoteApiDto[];
  isLoading: boolean;
  errorMessage: string | null;
  canUpdate: boolean;
  page: number;
  totalPages: number;
  pageSize: ListPageSize;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ListPageSize) => void;
  getRowActions: (row: PurchaseRfqQuoteApiDto) => DropdownItem[];
}

export default function RfqQuotesTable({
  items,
  isLoading,
  errorMessage,
  canUpdate,
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  getRowActions,
}: RfqQuotesTableProps) {
  return (
    <TableShell
      tableClassName="wms-inventory-table"
      colSpan={COLS}
      loading={isLoading}
      error={errorMessage}
      isEmpty={items.length === 0}
      emptyMessage="Chưa có báo giá phù hợp bộ lọc."
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
          <th className="table-header-cell">Ngày BG</th>
          <th className="table-header-cell">Hàng hoá</th>
          <th className="table-header-cell">NCC</th>
          <th className="table-header-cell">Đơn giá</th>
          <th className="table-header-cell">Hạn giữ giá</th>
          <th className="table-header-cell">TG giao hàng</th>
          <th className="table-header-cell">Điều khoản thanh toán</th>
          <th className="table-header-cell">Trạng thái</th>
          <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
        </tr>
      )}
    >
      {items.map(row => (
        <tr key={row.id} className="table-row">
          <td className="table-cell">{formatDateCell(row.quoteDate)}</td>
          <td className="table-cell">
            <span className="font-mono">{row.materialCode}</span>
            {' '}
            {row.materialName}
          </td>
          <td className="table-cell">{row.supplierName}</td>
          <td className="table-cell text-right tabular-nums">{formatCurrency(row.unitPrice)}</td>
          <td className="table-cell">{row.validUntil ? formatDateCell(row.validUntil) : '-'}</td>
          <td className="table-cell">{row.leadTimeDays != null ? `${row.leadTimeDays} ngày` : '-'}</td>
          <td className="table-cell">{row.paymentTerm || '-'}</td>
          <td className="table-cell">
            <span className={`badge ${rfqStatusBadge(row.status)}`}>
              {RFQ_STATUS_LABEL[row.status] ?? row.status}
            </span>
          </td>
          <td className="table-cell hrm-table-col-actions">
            {(() => {
              if (!canUpdate) return null;
              const actions = getRowActions(row);
              return actions.length > 0 ? <Dropdown trigger="Tác vụ" items={actions} /> : null;
            })()}
          </td>
        </tr>
      ))}
    </TableShell>
  );
}
