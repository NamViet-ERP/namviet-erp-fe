import { useId, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import SearchBar from '../../../components/ui/SearchBar';
import SelectField from '../../../components/ui/SelectField';
import TableShell from '../../../components/ui/TableShell';
import { formatDateCell } from '../../../lib/hrm/formatters';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type {
  SupplierPayableLineApiDto,
  SupplierPayableSupplierRowApiDto,
} from '../../../types/api/purchasingApi';
import { ApBoard, ApFilterTabs, LineStatusBadge } from './PayablesBoard';
import type { StatusFilter } from './payablesUtils';

const LINE_COL_COUNT = 9;

interface SupplierPayablesLinesTableProps {
  suppliers: SupplierPayableSupplierRowApiDto[];
  lines: SupplierPayableLineApiDto[];
  supplierId: number | undefined;
  filteredSupplierName: string | undefined;
  status: StatusFilter;
  search: string;
  hasFilters: boolean;
  showInitialLoading: boolean;
  isRefetching: boolean;
  canPay: boolean;
  onSupplierFilterChange: (next: string) => void;
  onStatusChange: (next: StatusFilter) => void;
  onSearchChange: (next: string) => void;
  onResetFilters: () => void;
}

export default function SupplierPayablesLinesTable({
  suppliers,
  lines,
  supplierId,
  filteredSupplierName,
  status,
  search,
  hasFilters,
  showInitialLoading,
  isRefetching,
  canPay,
  onSupplierFilterChange,
  onStatusChange,
  onSearchChange,
  onResetFilters,
}: SupplierPayablesLinesTableProps) {
  const supplierSelectId = useId();
  const supplierOptions = useMemo(
    () => suppliers.map(s => ({ value: String(s.supplierId), label: `${s.supplierCode} - ${s.supplierName}` })),
    [suppliers],
  );

  return (
    <ApBoard
      title="DNTT và công nợ chi tiết"
      desc={filteredSupplierName ? `Đang lọc theo ${filteredSupplierName}.` : 'Từng đề nghị thanh toán đã lập. PO chưa có DNTT không xuất hiện.'}
      toolbar={(
        <>
          <div className="ops-projects__filter-field">
            <label htmlFor={supplierSelectId}>Nhà cung cấp</label>
            <SelectField
              id={supplierSelectId}
              variant="hrm"
              className="hrm-filter-select-wrap"
              selectClassName="hrm-filter-select"
              aria-label="Lọc nhà cung cấp"
              value={supplierId ? String(supplierId) : ''}
              onChange={onSupplierFilterChange}
              placeholder="Tất cả NCC"
              options={supplierOptions}
            />
          </div>
          <ApFilterTabs value={status} onChange={onStatusChange} />
          <SearchBar value={search} onChange={onSearchChange} placeholder="Tìm PO, DNTT hoặc NCC" />
          {hasFilters ? (
            <Button type="button" variant="text" size="sm" onClick={onResetFilters} title="Đặt lại bộ lọc">
              Xóa lọc
            </Button>
          ) : null}
        </>
      )}
    >
      <div id="sup-ap-lines" aria-busy={isRefetching || undefined}>
        <TableShell
          tableClassName="wms-inventory-table"
          className={isRefetching ? 'is-refetching' : undefined}
          colSpan={LINE_COL_COUNT}
          loading={showInitialLoading}
          skeletonRows={8}
          isEmpty={lines.length === 0}
          emptyMessage="Không có DNTT nào phù hợp bộ lọc."
          header={(
            <tr>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell">Dự án</th>
              <th className="table-header-cell">PO / DNTT</th>
              <th className="table-header-cell">Ngày PO</th>
              <th className="table-header-cell text-right">Giá trị</th>
              <th className="table-header-cell">Điều khoản</th>
              <th className="table-header-cell">Hạn TT</th>
              <th className="table-header-cell">Trạng thái</th>
              <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
            </tr>
          )}
        >
          {lines.map(line => (
            <tr key={line.paymentCode} className="table-row">
              <td className="table-cell sup-ap-col-ncc">
                {line.supplierCode ? <span className="sup-analytics__code">{line.supplierCode}</span> : null}
                {' '}
                {line.supplierName || '-'}
              </td>
              <td className="table-cell">
                {line.projectCode ? (
                  <EntityCodeLink code={line.projectCode} to={`/warehouse/projects/${encodeURIComponent(line.projectCode)}`} />
                ) : <span className="entity-code">-</span>}
                {line.projectName ? <div className="sup-ap-meta">{line.projectName}</div> : null}
              </td>
              <td className="table-cell">
                <EntityCodeLink code={line.poCode} to={`/purchasing/orders/${encodeURIComponent(line.poCode)}`} />
                <div className="sup-ap-meta sup-ap-meta--mono">
                  {line.paymentCode}
                  {line.stageNumber > 1 ? ` - đợt ${line.stageNumber}` : ''}
                </div>
              </td>
              <td className="table-cell">{formatDateCell(line.poDate ?? undefined)}</td>
              <td className="table-cell text-right tabular-nums whitespace-nowrap">{formatCurrencyFull(line.requested)}</td>
              <td className="table-cell">{line.paymentTerm || '-'}</td>
              <td className="table-cell">{formatDateCell(line.dueDate)}</td>
              <td className="table-cell sup-ap-col-status"><LineStatusBadge line={line} /></td>
              <td className="table-cell hrm-table-col-actions">
                {line.lineStatus === 'paid' ? (
                  <Link className="btn btn-outlined btn-sm" to={`/purchasing/orders/${encodeURIComponent(line.poCode)}`}>Xem PO</Link>
                ) : canPay ? (
                  <Link className="btn btn-filled btn-sm" to={`/purchasing/payments/${encodeURIComponent(line.paymentCode)}`}>Xác nhận TT</Link>
                ) : (
                  <Link className="btn btn-outlined btn-sm" to={`/purchasing/payments/${encodeURIComponent(line.paymentCode)}`}>Xem DNTT</Link>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </ApBoard>
  );
}
