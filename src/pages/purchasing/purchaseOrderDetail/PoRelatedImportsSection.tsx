import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { formatCurrency } from '../../../utils/formatCurrency';
import type { Import, StatusKey } from '../../../types';

type Props = {
  relatedImports: Import[];
  importsLoading: boolean;
  onNavigateImport: () => void;
};

export function PoRelatedImportsSection({
  relatedImports,
  importsLoading,
  onNavigateImport,
}: Props) {
  return (
    <section className="pur-detail__card" aria-label="Phiếu nhập kho liên quan">
      <h2 className="purchasing-section-title">
        Phiếu nhập kho liên quan
        <span className="ml-2 text-xs font-normal text-[var(--md-on-surface-variant)]">
          ({relatedImports.length})
        </span>
      </h2>
      {importsLoading ? (
        <table className="pur-erp__table"><tbody><TableSkeletonRows rows={3} colSpan={5} /></tbody></table>
      ) : relatedImports.length === 0 ? (
        <EmptyState message="Chưa có phiếu NK gắn PO này." />
      ) : (
        <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
          <table className="pur-erp__table">
            <thead>
              <tr>
                <th className="pur-detail__th">Mã phiếu NK</th>
                <th className="pur-detail__th">Kho dự án</th>
                <th className="pur-detail__th">Trạng thái</th>
                <th className="pur-detail__th">Ngày</th>
                <th className="pur-detail__th text-right">Tổng giá trị</th>
              </tr>
            </thead>
            <tbody>
              {relatedImports.map(imp => (
                <tr
                  key={imp.id}
                  className="table-row cursor-pointer"
                  onClick={onNavigateImport}
                >
                  <td className="table-cell font-semibold">{imp.voucherCode}</td>
                  <td className="table-cell">{imp.project || '—'}</td>
                  <td className="table-cell">
                    <Badge status={imp.status as StatusKey} />
                  </td>
                  <td className="table-cell">{imp.date || '—'}</td>
                  <td className="table-cell text-right tabular-nums">
                    {formatCurrency(imp.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
