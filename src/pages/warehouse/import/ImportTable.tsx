import type { Import } from '../../../types';
import VoucherStatusCell from '../../../components/warehouse/VoucherStatusCell';
import VoucherCodeCell from '../../../components/warehouse/VoucherCodeCell';
import EmptyState from '../../../components/ui/EmptyState';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { formatCurrency } from '../../../utils/formatCurrency';
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
}

export default function ImportTable({
  rows,
  isLoading,
  isError,
  error,
  projectName,
  onOpenDetail,
  showPrices = true,
}: ImportTableProps) {
  const colSpan = showPrices ? 7 : 6;

  return (
    <div className="overflow-x-auto table-scroll wms-inventory-table-wrap">
      <table className="wms-inventory-table">
        <thead>
          <tr>
            <th className="table-header-cell text-center whitespace-nowrap">Mã chứng từ</th>
            <th className="table-header-cell text-center">Kho dự án</th>
            <th className="table-header-cell text-center">Mã đơn hàng</th>
            <th className="table-header-cell text-center">Nhà cung cấp</th>
            <th className="table-header-cell text-center">Mã KHMH</th>
            {showPrices ? (
              <th className="table-header-cell text-center">Tổng giá trị</th>
            ) : null}
            <th className="table-header-cell text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableSkeletonRows colSpan={colSpan} />
          ) : isError ? (
            <tr>
              <td colSpan={colSpan}>
                <EmptyState message={getApiErrorMessage(error, WMS_ERROR.loadImports)} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan}>
                <EmptyState message={WMS_EMPTY.noImports} />
              </td>
            </tr>
          ) : (
            rows.map(imp => (
              <tr
                key={imp.id}
                className="table-row wms-inventory-row--interactive"
                onClick={() => onOpenDetail(imp)}
              >
                <td className="table-cell text-center">
                  <VoucherCodeCell
                    code={imp.voucherCode}
                    voucher={imp}
                    onCodeClick={() => onOpenDetail(imp)}
                  />
                </td>
                <td className="table-cell text-center max-w-[200px]">
                  <span className="line-clamp-1" title={projectName(imp.project)}>
                    {imp.project ? projectName(imp.project) : '-'}
                  </span>
                </td>
                <td className="table-cell text-center">
                  {imp.referenceCode ? <span className="entity-code">{imp.referenceCode}</span> : '-'}
                </td>
                <td className="table-cell text-center">{imp.supplier || '-'}</td>
                <td className="table-cell text-center">
                  {imp.planCode?.trim() ? <span className="entity-code">{imp.planCode.trim()}</span> : '-'}
                </td>
                {showPrices ? (
                  <td className="table-cell text-center tabular-nums">
                    {isIssueFromGeneralWarehouse(imp) ? '—' : formatCurrency(imp.totalValue)}
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
