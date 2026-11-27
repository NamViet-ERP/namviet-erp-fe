import type { ComponentProps } from 'react';
import type { Import } from '../../../types';
import Pagination from '../../../components/ui/Pagination';
import TableShell from '../../../components/ui/TableShell';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import VoucherCodeCell from '../../../components/warehouse/VoucherCodeCell';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import { getInteractiveRowProps } from '../../../lib/a11y/interactiveRow';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { WMS_EMPTY, WMS_ERROR } from '../../../lib/wms/messages';
import { isIssueFromGeneralWarehouse } from './importUtils';

interface ImportTableProps {
  rows: Import[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  projectName: (code?: string) => string;
  onOpenDetail: (imp: Import) => void;
  /** Ẩn cột tổng giá trị khi không có wms.prices.view */
  showPrices?: boolean;
  pagination?: ComponentProps<typeof Pagination>;
}

export default function ImportTable({
  rows,
  isLoading,
  isError,
  error,
  projectName,
  onOpenDetail,
  showPrices = true,
  pagination,
}: ImportTableProps) {
  const colSpan = showPrices ? 7 : 6;

  return (
    <TableShell
      flushTop
      colSpan={colSpan}
      loading={isLoading}
      error={isError ? getApiErrorMessage(error, WMS_ERROR.loadImports) : null}
      isEmpty={rows.length === 0}
      emptyMessage={WMS_EMPTY.noImports}
      pagination={pagination}
      header={
        <tr>
          <th className="table-header-cell text-center whitespace-nowrap">Mã chứng từ</th>
          <th className="table-header-cell text-left">Kho dự án</th>
          <th className="table-header-cell text-center">Mã đơn hàng</th>
          <th className="table-header-cell text-left">Nhà cung cấp</th>
          <th className="table-header-cell text-center">Mã KHMH</th>
          {showPrices ? (
            <th className="table-header-cell text-right whitespace-nowrap">Tổng giá trị</th>
          ) : null}
          <th className="table-header-cell text-center">Trạng thái</th>
        </tr>
      }
    >
      {rows.map(imp => (
        <tr
          key={imp.id}
          className="table-row wms-inventory-row--interactive"
          onClick={() => onOpenDetail(imp)}
          {...getInteractiveRowProps(() => onOpenDetail(imp), `Xem phiếu nhập ${imp.voucherCode}`)}
        >
          <td className="table-cell text-center">
            <VoucherCodeCell
              code={imp.voucherCode}
              voucher={imp}
              onCodeClick={() => onOpenDetail(imp)}
            />
          </td>
          <td className="table-cell text-left max-w-[200px]">
            <span className="line-clamp-1" title={projectName(imp.project)}>
              {imp.project ? projectName(imp.project) : '-'}
            </span>
          </td>
          <td className="table-cell text-center">
            {imp.referenceCode ? <span className="entity-code">{imp.referenceCode}</span> : '-'}
          </td>
          <td className="table-cell text-left">{imp.supplier || '-'}</td>
          <td className="table-cell text-center">
            {imp.planCode?.trim() ? <span className="entity-code">{imp.planCode.trim()}</span> : '-'}
          </td>
          {showPrices ? (
            <td className="table-cell text-right tabular-nums font-mono">
              {isIssueFromGeneralWarehouse(imp) ? '—' : formatCurrencyFull(imp.totalValue)}
            </td>
          ) : null}
          <td className="table-cell text-center">
            <VoucherStatusCell
              voucherKind="import"
              status={imp.status}
              approvedBy={imp.approvedBy}
              approvedAt={imp.approvedAt}
            />
          </td>
        </tr>
      ))}
    </TableShell>
  );
}
