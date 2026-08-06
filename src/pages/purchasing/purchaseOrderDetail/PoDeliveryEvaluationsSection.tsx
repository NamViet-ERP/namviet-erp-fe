import { Link } from 'react-router-dom';
import EmptyState from '../../../components/ui/EmptyState';
import PurchasingStatusBadge from '../../../components/purchasing/PurchasingStatusBadge';
import TableSkeletonRows from '../../../components/ui/TableSkeletonRows';
import { formatDateCell, formatDateTimeVi } from '../../../lib/hrm/formatters';
import { useSupplierDeliveryEvaluations } from '../../../hooks/useSupplierDirectory';

type Props = {
  poCode: string;
};

function statusTone(status: string, overdue: boolean): 'warning' | 'success' | 'danger' | 'neutral' {
  if (status === 'completed') return 'success';
  if (overdue) return 'danger';
  if (status === 'pending') return 'warning';
  return 'neutral';
}

function statusLabel(status: string, overdue: boolean): string {
  if (status === 'completed') return 'Đã đánh giá';
  if (overdue) return 'Quá hạn';
  if (status === 'pending') return 'Chờ đánh giá';
  return status;
}

/** Đánh giá nhận hàng gắn PO — tạo tự động sau khi thủ kho duyệt NK. */
export function PoDeliveryEvaluationsSection({ poCode }: Props) {
  const { data, isLoading, isError } = useSupplierDeliveryEvaluations({
    poCode,
    page: 1,
    pageSize: 50,
  });
  const items = data?.items ?? [];

  return (
    <section className="pur-detail__card" aria-label="Đánh giá nhận hàng">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h2 className="purchasing-section-title mb-0">Đánh giá nhận hàng</h2>
          <p className="pur-detail__muted mt-1">
            Tự tạo khi duyệt phiếu NK thực tế. Hoàn thành tại module NCC.
          </p>
        </div>
        <Link to="/suppliers/evaluations" className="btn btn-outline btn-sm">
          Mở hub đánh giá
        </Link>
      </div>

      {isLoading ? (
        <table className="pur-erp__table"><tbody><TableSkeletonRows rows={2} colSpan={5} /></tbody></table>
      ) : isError ? (
        <EmptyState message="Không tải được đánh giá nhận hàng." />
      ) : items.length === 0 ? (
        <EmptyState message="Chưa có đánh giá — sẽ xuất hiện sau khi thủ kho duyệt NK gắn PO." />
      ) : (
        <div className="pur-detail__table-wrap overflow-x-auto table-scroll">
          <table className="pur-erp__table">
            <thead>
              <tr>
                <th className="pur-detail__th">Phiếu NK</th>
                <th className="pur-detail__th">Nhận thực tế</th>
                <th className="pur-detail__th">Hạn đánh giá</th>
                <th className="pur-detail__th">Trạng thái</th>
                <th className="pur-detail__th text-right">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell font-semibold">{row.importTicketCode}</td>
                  <td className="table-cell tabular-nums">
                    {formatDateTimeVi(row.receivedAt) ?? formatDateCell(row.receivedAt)}
                  </td>
                  <td className="table-cell tabular-nums">{formatDateCell(row.dueAt)}</td>
                  <td className="table-cell">
                    <PurchasingStatusBadge
                      label={statusLabel(row.status, row.isOverdue)}
                      tone={statusTone(row.status, row.isOverdue)}
                    />
                  </td>
                  <td className="table-cell text-right tabular-nums">
                    {row.score != null ? `${row.score}${row.grade ? ` (${row.grade})` : ''}` : '—'}
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
