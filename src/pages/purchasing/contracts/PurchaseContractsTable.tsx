import type { ComponentProps } from 'react';
import { Download, FileText } from 'lucide-react';
import Button from '../../../components/ui/Button';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import Pagination from '../../../components/ui/Pagination';
import TableShell from '../../../components/ui/TableShell';
import { getInteractiveRowProps } from '../../../lib/a11y/interactiveRow';
import { formatDateCell } from '../../../lib/hrm/formatters';
import type { PurchaseContractApiDto } from '../../../types/api/purchasingApi';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import { contractStatusLabel, contractStatusTone } from './usePurchaseContractsController';

const COL_COUNT = 10;

interface PurchaseContractsTableProps {
  items: PurchaseContractApiDto[];
  isLoading: boolean;
  errorMessage: string | null;
  onOpenEdit: (row: PurchaseContractApiDto) => void;
  onDownload: (row: PurchaseContractApiDto) => Promise<void>;
  pagination?: ComponentProps<typeof Pagination>;
}

export default function PurchaseContractsTable({
  items,
  isLoading,
  errorMessage,
  onOpenEdit,
  onDownload,
  pagination,
}: PurchaseContractsTableProps) {
  return (
    <TableShell
      className="pur-contracts-table"
      tableClassName="wms-inventory-table"
      colSpan={COL_COUNT}
      loading={isLoading}
      skeletonRows={8}
      error={errorMessage}
      isEmpty={items.length === 0}
      emptyIcon={FileText}
      emptyMessage="Chưa có hợp đồng."
      pagination={pagination}
      header={(
        <tr>
          <th className="table-header-cell pur-contracts-col-code">Mã</th>
          <th className="table-header-cell pur-contracts-col-no">Số HĐ</th>
          <th className="table-header-cell min-w-[14rem]">Tiêu đề</th>
          <th className="table-header-cell">NCC</th>
          <th className="table-header-cell pur-contracts-col-po">PO / Dự án</th>
          <th className="table-header-cell pur-contracts-col-date">Hiệu lực từ</th>
          <th className="table-header-cell pur-contracts-col-date">Hiệu lực đến</th>
          <th className="table-header-cell text-right">Giá trị</th>
          <th className="table-header-cell">Trạng thái</th>
          <th className="table-header-cell text-center">Thao tác</th>
        </tr>
      )}
    >
      {items.map(row => (
        <tr
          key={row.id}
          className="table-row wms-inventory-row--interactive cursor-pointer"
          onClick={() => onOpenEdit(row)}
          {...getInteractiveRowProps(() => onOpenEdit(row), `Xem hợp đồng ${row.code}`)}
        >
          <td className="table-cell pur-contracts-col-code">
            <EntityCodeLink code={row.code} onClick={() => onOpenEdit(row)} />
          </td>
          <td className="table-cell font-semibold pur-contracts-col-no">{row.contractNo}</td>
          <td className="table-cell">{row.title}</td>
          <td className="table-cell">{row.supplierName || '—'}</td>
          <td className="table-cell pur-contracts-col-po">
            {row.poCode ? (
              <EntityCodeLink
                code={row.poCode}
                to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
              />
            ) : (
              <span className="entity-code">—</span>
            )}
            <div className="text-xs text-[var(--md-on-surface-variant)] font-mono">
              {row.projectCode || '—'}
            </div>
          </td>
          <td className="table-cell tabular-nums pur-contracts-col-date">
            {formatDateCell(row.effectiveFrom ?? undefined)}
          </td>
          <td className="table-cell tabular-nums pur-contracts-col-date">
            {formatDateCell(row.effectiveTo ?? undefined)}
          </td>
          <td className="table-cell text-right tabular-nums">
            {row.amount != null ? formatCurrencyFull(row.amount) : '—'}
          </td>
          <td className="table-cell">
            <div className="pur-contract-status">
              <span className={`pur-erp__pill pur-erp__pill--${contractStatusTone(row.status)}`}>
                {contractStatusLabel(row.status)}
              </span>
              {row.hasFile ? (
                <span className="pur-erp__pill pur-erp__pill--info">Có file</span>
              ) : null}
            </div>
          </td>
          <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
            {row.hasFile ? (
              <Button
                type="button"
                variant="text"
                size="sm"
                leftIcon={Download}
                title={`Tải ${row.fileName || 'file đính kèm'}`}
                aria-label={`Tải ${row.fileName || 'file đính kèm'}`}
                onClick={() => { void onDownload(row); }}
              />
            ) : (
              <span className="text-[var(--md-on-surface-variant)] text-xs">—</span>
            )}
          </td>
        </tr>
      ))}
    </TableShell>
  );
}
