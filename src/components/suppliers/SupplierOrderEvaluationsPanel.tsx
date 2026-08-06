import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import PurchasingStatusBadge from '../purchasing/PurchasingStatusBadge';
import CompleteDeliveryEvaluationModal from './CompleteDeliveryEvaluationModal';
import EmptyState from '../ui/EmptyState';
import Pagination from '../ui/Pagination';
import SearchBar from '../ui/SearchBar';
import TableSkeletonRows from '../ui/TableSkeletonRows';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import { orderGradeLabel } from '../../lib/suppliers/orderEvalScoring';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { useSuppliers } from '../../hooks/useSuppliers';
import {
  useCompleteSupplierDeliveryEvaluation,
  useSupplierDeliveryEvaluations,
  useSupplierModuleSettings,
} from '../../hooks/useSupplierDirectory';
import type {
  CompleteSupplierDeliveryEvaluationRequest,
  SupplierDeliveryEvaluationApiDto,
} from '../../types/api/supplierDirectoryApi';

function gradeTone(grade: string | null | undefined): 'success' | 'warning' | 'danger' | 'neutral' {
  if (grade === 'A') return 'success';
  if (grade === 'B') return 'warning';
  if (grade === 'C' || grade === 'D') return 'danger';
  return 'neutral';
}

function criteriaCell(value: number | null | undefined) {
  return value == null ? '—' : value;
}

export default function SupplierOrderEvaluationsPanel() {
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [completing, setCompleting] = useState<SupplierDeliveryEvaluationApiDto | null>(null);

  const { data: suppliers } = useSuppliers({ all: true });
  const { data: settings } = useSupplierModuleSettings();
  const supplierId = supplierFilter ? Number(supplierFilter) : undefined;

  const pendingQuery = useSupplierDeliveryEvaluations({
    status: 'pending',
    supplierId,
    search,
    page: 1,
    pageSize: 50,
  });
  const historyQuery = useSupplierDeliveryEvaluations({
    status: 'completed',
    supplierId,
    search,
    page,
    pageSize,
  });
  const completeMutation = useCompleteSupplierDeliveryEvaluation();

  const pendingItems = pendingQuery.data?.items ?? [];
  const historyItems = historyQuery.data?.items ?? [];
  const hasFilters = Boolean(search || supplierFilter);

  const handleComplete = async (body: CompleteSupplierDeliveryEvaluationRequest) => {
    if (!completing) return;
    try {
      await completeMutation.mutateAsync({ id: completing.id, body });
      showToast('success', 'Đã hoàn thành đánh giá nhận hàng');
      setCompleting(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu đánh giá nhận hàng'));
    }
  };

  return (
    <div className="space-y-5 p-4">
      <div className="hrm-list-toolbar">
        <div className="hrm-list-toolbar__filters">
          <SearchBar
            value={search}
            onChange={value => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Tìm PO, phiếu NK, NCC…"
          />
          <div className="hrm-list-toolbar__filter-row hrm-list-toolbar__filter-row--selects">
            <div className="hrm-filter-select-wrap">
              <select
                className="hrm-filter-select"
                value={supplierFilter}
                aria-label="Lọc theo nhà cung cấp"
                onChange={e => {
                  setSupplierFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả nhà cung cấp</option>
                {(suppliers?.items ?? []).map(s => (
                  <option key={s.id} value={s.id}>{s.supplierName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <section aria-label="Đánh giá đang chờ xử lý">
        <h2 className="purchasing-section-title mb-1 text-base">
          Đánh giá đang chờ xử lý
          <span className="ml-2 text-xs font-normal text-[var(--md-on-surface-variant)]">
            ({pendingQuery.data?.totalCount ?? pendingItems.length})
          </span>
        </h2>
        <p className="mb-2 text-xs text-pretty text-[var(--md-on-surface-variant)]">
          Mỗi khi nhận hàng theo PO, có 0–30 ngày để hoàn thành đánh giá NCC cho đợt giao đó.
        </p>
        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full border-collapse hrm-table table-min-w--750">
            <thead>
              <tr>
                <th className="table-header-cell">Mã PO</th>
                <th className="table-header-cell">Nhà cung cấp</th>
                <th className="table-header-cell">Ngày nhận hàng</th>
                <th className="table-header-cell">Hạn đánh giá</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pendingQuery.isLoading ? (
                <TableSkeletonRows colSpan={6} />
              ) : pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message="Không có đánh giá nhận hàng đang chờ." />
                  </td>
                </tr>
              ) : (
                pendingItems.map(row => (
                  <tr key={row.id} className="table-row">
                    <td className="table-cell whitespace-nowrap">
                      <Link
                        to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                        className="text-[var(--md-primary)] hover:underline"
                      >
                        {row.poCode}
                      </Link>
                    </td>
                    <td className="table-cell font-semibold">{row.supplierName}</td>
                    <td className="table-cell whitespace-nowrap tabular-nums">
                      {formatDateTimeVi(row.receivedAt) ?? formatDateCell(row.receivedAt)}
                    </td>
                    <td className="table-cell whitespace-nowrap tabular-nums">
                      {formatDateCell(row.dueAt)}
                    </td>
                    <td className="table-cell">
                      <PurchasingStatusBadge
                        label={row.isOverdue ? 'Quá hạn' : 'Chờ đánh giá'}
                        tone={row.isOverdue ? 'danger' : 'warning'}
                      />
                    </td>
                    <td className="table-cell text-center">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm inline-flex items-center gap-1"
                        onClick={() => setCompleting(row)}
                      >
                        <ClipboardCheck size={14} aria-hidden />
                        Đánh giá ngay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Lịch sử đánh giá theo đơn hàng">
        <h2 className="purchasing-section-title mb-1 text-base">Lịch sử đánh giá nhà cung cấp</h2>
        <p className="mb-2 text-xs text-pretty text-[var(--md-on-surface-variant)]">
          Thang điểm 1–10 mỗi tiêu chí · Điểm tổng theo trọng số (Chất lượng 30%, Giao hàng 25%, Giá 20%, Dịch vụ 15%, Tuân thủ 10%).
        </p>
        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full border-collapse hrm-table table-min-w--950">
            <thead>
              <tr>
                <th className="table-header-cell">Ngày</th>
                <th className="table-header-cell">Nhà cung cấp</th>
                <th className="table-header-cell">Mã PO</th>
                <th className="table-header-cell">Người đánh giá</th>
                <th className="table-header-cell text-center">Chất lượng</th>
                <th className="table-header-cell text-center">Giao hàng</th>
                <th className="table-header-cell text-center">Giá</th>
                <th className="table-header-cell text-center">Dịch vụ</th>
                <th className="table-header-cell text-center">Tuân thủ</th>
                <th className="table-header-cell text-right">Điểm tổng</th>
                <th className="table-header-cell">Xếp hạng</th>
              </tr>
            </thead>
            <tbody>
              {historyQuery.isLoading ? (
                <TableSkeletonRows colSpan={11} />
              ) : historyQuery.isError ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState message="Không tải được lịch sử đánh giá." />
                  </td>
                </tr>
              ) : historyItems.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState
                      message={hasFilters ? 'Không tìm thấy đánh giá phù hợp.' : 'Chưa có đánh giá nào.'}
                    />
                  </td>
                </tr>
              ) : (
                historyItems.map(row => (
                  <tr key={row.id} className="table-row">
                    <td className="table-cell whitespace-nowrap tabular-nums">
                      {row.evaluatedAt ? formatDateCell(row.evaluatedAt) : '—'}
                    </td>
                    <td className="table-cell font-semibold">{row.supplierName}</td>
                    <td className="table-cell whitespace-nowrap">{row.poCode}</td>
                    <td className="table-cell">{row.evaluatedByName || '—'}</td>
                    <td className="table-cell text-center tabular-nums">{criteriaCell(row.quality)}</td>
                    <td className="table-cell text-center tabular-nums">{criteriaCell(row.delivery)}</td>
                    <td className="table-cell text-center tabular-nums">{criteriaCell(row.price)}</td>
                    <td className="table-cell text-center tabular-nums">{criteriaCell(row.service)}</td>
                    <td className="table-cell text-center tabular-nums">{criteriaCell(row.compliance)}</td>
                    <td className="table-cell text-right tabular-nums font-semibold">
                      {row.score == null ? '—' : row.score}
                    </td>
                    <td className="table-cell">
                      <PurchasingStatusBadge
                        label={row.gradeLabel || orderGradeLabel(row.grade)}
                        tone={gradeTone(row.grade)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(historyQuery.data?.totalCount ?? 0) > 0 && !historyQuery.isLoading ? (
          <Pagination
            embedded
            itemLabel="đánh giá"
            currentPage={page}
            totalPages={historyQuery.data?.totalPages ?? 1}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={size => {
              setPageSize(size);
              setPage(1);
            }}
            totalItems={historyQuery.data?.totalCount ?? 0}
          />
        ) : null}
      </section>

      <CompleteDeliveryEvaluationModal
        isOpen={Boolean(completing)}
        evaluation={completing}
        settings={settings}
        isSaving={completeMutation.isPending}
        onClose={() => setCompleting(null)}
        onSubmit={body => { void handleComplete(body); }}
      />
    </div>
  );
}
