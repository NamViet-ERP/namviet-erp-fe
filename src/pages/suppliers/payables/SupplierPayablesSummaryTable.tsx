import Button from '../../../components/ui/Button';
import TableShell from '../../../components/ui/TableShell';
import { formatCurrencyFull } from '../../../utils/formatCurrency';
import type { SupplierPayableSupplierRowApiDto } from '../../../types/api/purchasingApi';
import { ApBoard } from './PayablesBoard';

interface SupplierPayablesSummaryTableProps {
  suppliers: SupplierPayableSupplierRowApiDto[];
  showInitialLoading: boolean;
  isRefetching: boolean;
  onSelectSupplier: (supplierId: number) => void;
}

export default function SupplierPayablesSummaryTable({
  suppliers,
  showInitialLoading,
  isRefetching,
  onSelectSupplier,
}: SupplierPayablesSummaryTableProps) {
  return (
    <ApBoard
      title="Công nợ theo nhà cung cấp"
      desc="Tổng hợp đề nghị, đã trả và còn nợ theo từng NCC."
    >
      <div aria-busy={isRefetching || undefined}>
        <TableShell
          tableClassName="wms-inventory-table"
          className={isRefetching ? 'is-refetching' : undefined}
          colSpan={8}
          loading={showInitialLoading}
          skeletonRows={6}
          isEmpty={suppliers.length === 0}
          emptyMessage="Chưa có đề nghị thanh toán nào được lập."
          header={(
            <tr>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell text-right">Số PO / dự án</th>
              <th className="table-header-cell text-right">Đã đề nghị TT</th>
              <th className="table-header-cell text-right">Đã thanh toán</th>
              <th className="table-header-cell text-right">Còn nợ</th>
              <th className="table-header-cell text-right">Hạn mức</th>
              <th className="table-header-cell">Tình trạng</th>
              <th className="table-header-cell hrm-table-col-actions">Tác vụ</th>
            </tr>
          )}
        >
          {suppliers.map(row => (
            <tr key={row.supplierId} className="table-row">
              <td className="table-cell sup-ap-col-ncc">
                <span className="sup-analytics__code">{row.supplierCode}</span>
                {' '}
                {row.supplierName}
              </td>
              <td className="table-cell text-right tabular-nums">
                {row.poCount} / {row.projectCount}
              </td>
              <td className="table-cell text-right tabular-nums whitespace-nowrap">
                {formatCurrencyFull(row.requested)}
              </td>
              <td className="table-cell text-right tabular-nums whitespace-nowrap">
                {formatCurrencyFull(row.paid)}
              </td>
              <td className="table-cell text-right tabular-nums whitespace-nowrap">
                {formatCurrencyFull(row.outstanding)}
              </td>
              <td className="table-cell text-right">
                {row.creditLimit ? (
                  <>
                    <span className="tabular-nums whitespace-nowrap">{formatCurrencyFull(row.creditLimit)}</span>
                    {row.overLimit ? (
                      <div><span className="badge badge-error">Vượt hạn mức</span></div>
                    ) : null}
                  </>
                ) : (
                  <span className="sup-ap-meta">Không giới hạn</span>
                )}
              </td>
              <td className="table-cell">
                {row.overdueCount > 0 ? (
                  <span className="badge badge-error">
                    {row.overdueCount} DNTT quá hạn - {formatCurrencyFull(row.overdueAmount)}
                  </span>
                ) : row.unpaidCount > 0 ? (
                  <span className="badge badge-warning">{row.unpaidCount} DNTT chưa đến hạn</span>
                ) : (
                  <span className="badge badge-success">Không nợ</span>
                )}
              </td>
              <td className="table-cell hrm-table-col-actions">
                <Button type="button" variant="outlined" size="sm" onClick={() => onSelectSupplier(row.supplierId)}>
                  Lọc DNTT
                </Button>
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </ApBoard>
  );
}
