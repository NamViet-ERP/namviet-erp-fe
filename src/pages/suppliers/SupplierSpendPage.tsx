import { Link } from 'react-router-dom';
import { Banknote } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import TableShell from '../../components/ui/TableShell';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useSupplierSpend } from '../../hooks/useSupplierPoAnalytics';
import { formatCurrencyFull } from '../../utils/formatCurrency';

export default function SupplierSpendPage() {
  const { data, isLoading, isError, error } = useSupplierSpend();
  const rows = data?.rows ?? [];
  const grandTotal = data?.grandTotal ?? 0;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Chi tiêu theo NCC"
        subtitle="Tổng hợp số PO và giá trị đã đặt hàng theo từng nhà cung cấp trên toàn bộ dự án."
      />

      <SectionCard>
        <div className="sup-analytics__head">
          <h2 className="sup-analytics__title">Chi tiêu &amp; tỷ trọng theo nhà cung cấp</h2>
          <p className="sup-analytics__desc">
            Tổng hợp giá trị đã đặt hàng (PO) — không cần tự cộng tay qua nhiều sheet.
          </p>
        </div>

        <TableShell
          tableClassName="wms-inventory-table sup-analytics__table"
          colSpan={4}
          loading={isLoading}
          skeletonRows={6}
          error={isError ? getApiErrorMessage(error, 'Không tải được chi tiêu theo NCC.') : null}
          isEmpty={rows.length === 0}
          emptyMessage="Chưa có nhà cung cấp hoặc PO để tổng hợp."
          header={(
            <tr>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell text-right">Số PO</th>
              <th className="table-header-cell text-right">Tổng giá trị</th>
              <th className="table-header-cell">Tỷ trọng</th>
            </tr>
          )}
          tfoot={
            !isLoading && !isError && rows.length > 0 ? (
              <tr>
                <td className="table-cell text-right font-bold">Tổng cộng</td>
                <td className="table-cell" />
                <td className="table-cell text-right font-bold tabular-nums whitespace-nowrap">
                  {formatCurrencyFull(grandTotal)}
                </td>
                <td className="table-cell" />
              </tr>
            ) : undefined
          }
        >
          {rows.map(row => (
            <tr key={`${row.supplierId ?? 'x'}-${row.supplierCode}`}>
              <td className="table-cell">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    to={`/suppliers/list?search=${encodeURIComponent(row.supplierCode)}`}
                    className="hover:underline font-medium text-[var(--md-on-surface)] group flex items-center gap-1.5"
                    title="Xem chi tiết nhà cung cấp"
                  >
                    <span className="sup-analytics__code group-hover:text-[var(--md-primary)]">{row.supplierCode}</span>
                    <span>{row.supplierName}</span>
                  </Link>
                  {row.supplierId != null && (
                    <Link
                      to={`/suppliers/debt?supplierId=${row.supplierId}`}
                      className="inline-flex items-center gap-1 text-xs text-[var(--md-primary)] hover:underline px-2 py-0.5 rounded bg-[var(--md-surface-container)] hover:bg-[var(--md-surface-container-high)] transition-colors whitespace-nowrap"
                      title="Xem công nợ nhà cung cấp"
                    >
                      <Banknote size={12} />
                      <span>Công nợ</span>
                    </Link>
                  )}
                </div>
              </td>
              <td className="table-cell text-right tabular-nums">
                <Link
                  to={`/purchasing/orders?search=${encodeURIComponent(row.supplierCode)}`}
                  className="text-[var(--md-primary)] hover:underline font-medium"
                  title="Xem danh sách đơn mua hàng (PO)"
                >
                  {row.poCount}
                </Link>
              </td>
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
          ))}
        </TableShell>
      </SectionCard>
    </PageShell>
  );
}
