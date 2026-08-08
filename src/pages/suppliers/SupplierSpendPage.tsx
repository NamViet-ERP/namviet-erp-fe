import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import HrmPanel from '../../components/hr/HrmPanel';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useSupplierSpend } from '../../hooks/useSupplierPoAnalytics';
import { formatCurrencyFull } from '../../utils/formatCurrency';

export default function SupplierSpendPage() {
  const { data, isLoading, isError, error } = useSupplierSpend();
  const rows = data?.rows ?? [];
  const grandTotal = data?.grandTotal ?? 0;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Chi tiêu theo NCC"
        subtitle="Tổng hợp số PO và giá trị đã đặt hàng theo từng nhà cung cấp trên toàn bộ dự án."
      />

      <HrmPanel>
        <div className="sup-analytics__head">
          <h2 className="sup-analytics__title">Chi tiêu &amp; tỷ trọng theo nhà cung cấp</h2>
          <p className="sup-analytics__desc">
            Tổng hợp giá trị đã đặt hàng (PO) — không cần tự cộng tay qua nhiều sheet.
          </p>
        </div>

        <div className="overflow-x-auto table-scroll">
          <table className="wms-inventory-table sup-analytics__table">
            <thead>
              <tr>
                <th className="table-header-cell">Nhà cung cấp</th>
                <th className="table-header-cell text-right">Số PO</th>
                <th className="table-header-cell text-right">Tổng giá trị</th>
                <th className="table-header-cell">Tỷ trọng</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={4} rows={6} />
              ) : isError ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState message={getApiErrorMessage(error, 'Không tải được chi tiêu theo NCC.')} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState message="Chưa có nhà cung cấp hoặc PO để tổng hợp." />
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={`${row.supplierId ?? 'x'}-${row.supplierCode}`}>
                    <td className="table-cell">
                      <span className="sup-analytics__code">{row.supplierCode}</span>
                      {' '}
                      {row.supplierName}
                    </td>
                    <td className="table-cell text-right tabular-nums">{row.poCount}</td>
                    <td className="table-cell text-right tabular-nums whitespace-nowrap">
                      {formatCurrencyFull(row.totalAmount)}
                    </td>
                    <td className="table-cell">
                      <div className="sup-analytics__share">
                        <div className="sup-analytics__share-track" aria-hidden>
                          <div
                            className="sup-analytics__share-fill"
                            style={{ width: `${Math.min(100, row.sharePercent)}%` }}
                          />
                        </div>
                        <span className="sup-analytics__share-pct tabular-nums">{row.sharePercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!isLoading && !isError && rows.length > 0 ? (
              <tfoot>
                <tr>
                  <td className="table-cell text-right font-bold">Tổng cộng</td>
                  <td className="table-cell" />
                  <td className="table-cell text-right font-bold tabular-nums whitespace-nowrap">
                    {formatCurrencyFull(grandTotal)}
                  </td>
                  <td className="table-cell" />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </HrmPanel>
    </div>
  );
}
