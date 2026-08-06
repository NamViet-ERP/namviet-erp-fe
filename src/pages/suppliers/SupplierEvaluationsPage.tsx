import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import SupplierEvaluationFormModal from '../../components/suppliers/SupplierEvaluationFormModal';
import CompleteDeliveryEvaluationModal from '../../components/suppliers/CompleteDeliveryEvaluationModal';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell, formatDateTimeVi } from '../../lib/hrm/formatters';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { useSuppliers } from '../../hooks/useSuppliers';
import {
  useCompleteSupplierDeliveryEvaluation,
  useCreateSupplierEvaluation,
  useDeleteSupplierEvaluation,
  useSupplierDeliveryEvaluations,
  useSupplierEvaluations,
  useSupplierModuleSettings,
  useUpdateSupplierEvaluation,
} from '../../hooks/useSupplierDirectory';
import type {
  CompleteSupplierDeliveryEvaluationRequest,
  SupplierDeliveryEvaluationApiDto,
  SupplierEvaluationApiDto,
  UpsertSupplierEvaluationRequest,
} from '../../types/api/supplierDirectoryApi';

function gradeTone(grade: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (grade === 'A') return 'success';
  if (grade === 'B') return 'warning';
  if (grade === 'C') return 'danger';
  return 'neutral';
}

export default function SupplierEvaluationsPage() {
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierEvaluationApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierEvaluationApiDto | null>(null);
  const [completing, setCompleting] = useState<SupplierDeliveryEvaluationApiDto | null>(null);

  const { data: suppliers } = useSuppliers({ all: true });
  const { data: settings } = useSupplierModuleSettings();
  const { data, isLoading, isError } = useSupplierEvaluations({
    search,
    supplierId: supplierFilter ? Number(supplierFilter) : undefined,
    page,
    pageSize,
  });
  const pendingQuery = useSupplierDeliveryEvaluations({
    status: 'pending',
    supplierId: supplierFilter ? Number(supplierFilter) : undefined,
    page: 1,
    pageSize: 20,
  });
  const createMutation = useCreateSupplierEvaluation();
  const updateMutation = useUpdateSupplierEvaluation();
  const deleteMutation = useDeleteSupplierEvaluation();
  const completeMutation = useCompleteSupplierDeliveryEvaluation();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const pendingItems = pendingQuery.data?.items ?? [];
  const hasFilters = Boolean(search || supplierFilter);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleSubmit = async (body: UpsertSupplierEvaluationRequest) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        showToast('success', 'Đã cập nhật đánh giá');
      } else {
        await createMutation.mutateAsync(body);
        showToast('success', 'Đã thêm đánh giá');
      }
      setShowForm(false);
      setEditing(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu đánh giá'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', 'Đã xóa đánh giá');
      setDeleteTarget(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa đánh giá'));
    }
  };

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
    <PurchasingListLayout
      eyebrow="Nhà cung cấp"
      title="Đánh giá NCC"
      subtitle="Chờ đánh giá sau nhận hàng + điểm KPI theo kỳ. Xếp hạng tính từ ngưỡng trong Thiết lập."
      search={search}
      onSearchChange={value => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Tìm NCC, kỳ, ghi chú…"
      filters={(
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
      )}
      hasFilters={hasFilters}
      onResetFilters={() => {
        setSearch('');
        setSupplierFilter('');
        setPage(1);
      }}
      actions={(
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden />
          Tạo đánh giá kỳ
        </button>
      )}
    >
      <section className="mb-5" aria-label="Chờ đánh giá nhận hàng">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <h2 className="purchasing-section-title mb-0 text-base">
            Chờ đánh giá nhận hàng
            <span className="ml-2 text-xs font-normal text-[var(--md-on-surface-variant)]">
              ({pendingQuery.data?.totalCount ?? pendingItems.length})
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full border-collapse hrm-table table-min-w--750">
            <thead>
              <tr>
                <th className="table-header-cell">NCC</th>
                <th className="table-header-cell">PO</th>
                <th className="table-header-cell">Phiếu NK</th>
                <th className="table-header-cell">Nhận thực tế</th>
                <th className="table-header-cell">Hạn</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pendingQuery.isLoading ? (
                <TableSkeletonRows colSpan={7} />
              ) : pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message="Không có đánh giá nhận hàng đang chờ." />
                  </td>
                </tr>
              ) : (
                pendingItems.map(row => (
                  <tr key={row.id} className="table-row">
                    <td className="table-cell font-semibold">{row.supplierName}</td>
                    <td className="table-cell whitespace-nowrap">
                      <Link
                        to={`/purchasing/orders/${encodeURIComponent(row.poCode)}`}
                        className="text-[var(--md-primary)] hover:underline"
                      >
                        {row.poCode}
                      </Link>
                    </td>
                    <td className="table-cell whitespace-nowrap">{row.importTicketCode}</td>
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
                        Đánh giá
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <h2 className="purchasing-section-title mb-2 text-base">Đánh giá theo kỳ</h2>
      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table table-min-w--950">
          <thead>
            <tr>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell">Kỳ</th>
              <th className="table-header-cell text-right">Điểm</th>
              <th className="table-header-cell text-center">Xếp hạng</th>
              <th className="table-header-cell">Ngày đánh giá</th>
              <th className="table-header-cell text-right">Giao đúng hạn</th>
              <th className="table-header-cell text-right">Hàng lỗi</th>
              <th className="table-header-cell text-right">Hoàn thành BH</th>
              <th className="table-header-cell">Người đánh giá</th>
              <th className="table-header-cell">Ghi chú</th>
              <th className="table-header-cell text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={11} />
            ) : isError ? (
              <tr>
                <td colSpan={11}>
                  <EmptyState message="Không tải được danh sách đánh giá." />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <EmptyState
                    message={hasFilters ? 'Không tìm thấy đánh giá phù hợp.' : 'Chưa có đánh giá kỳ nào.'}
                    action={
                      hasFilters ? null : (
                        <button type="button" className="btn btn-primary" onClick={openCreate}>
                          <Plus size={16} aria-hidden />
                          Tạo đánh giá đầu tiên
                        </button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              items.map(row => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell font-semibold">{row.supplierName}</td>
                  <td className="table-cell whitespace-nowrap">{row.period}</td>
                  <td className="table-cell whitespace-nowrap text-right tabular-nums">{row.score}</td>
                  <td className="table-cell text-center">
                    <PurchasingStatusBadge label={row.grade} tone={gradeTone(row.grade)} />
                  </td>
                  <td className="table-cell whitespace-nowrap tabular-nums">{row.evaluatedAt}</td>
                  <td className="table-cell whitespace-nowrap text-right tabular-nums">{row.onTimeDeliveryRate}%</td>
                  <td className="table-cell whitespace-nowrap text-right tabular-nums">{row.defectRate}%</td>
                  <td className="table-cell whitespace-nowrap text-right tabular-nums">{row.warrantyCompletionRate}%</td>
                  <td className="table-cell">{row.evaluatedByName || '—'}</td>
                  <td className="table-cell truncate max-w-[18rem]">{row.note || '—'}</td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-[var(--tint-primary-hover)] opacity-80 hover:opacity-100"
                        aria-label={`Sửa đánh giá ${row.supplierName} kỳ ${row.period}`}
                        onClick={() => {
                          setEditing(row);
                          setShowForm(true);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-[var(--md-error)] hover:bg-[var(--md-error-container)] opacity-80 hover:opacity-100"
                        aria-label={`Xóa đánh giá ${row.supplierName} kỳ ${row.period}`}
                        onClick={() => setDeleteTarget(row)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && !isLoading && (
        <Pagination
          embedded
          itemLabel="đánh giá"
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={size => {
            setPageSize(size);
            setPage(1);
          }}
          totalItems={totalCount}
        />
      )}

      <SupplierEvaluationFormModal
        isOpen={showForm}
        editing={editing}
        settings={settings}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <CompleteDeliveryEvaluationModal
        isOpen={Boolean(completing)}
        evaluation={completing}
        settings={settings}
        isSaving={completeMutation.isPending}
        onClose={() => setCompleting(null)}
        onSubmit={body => { void handleComplete(body); }}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa đánh giá?"
        message={
          deleteTarget ? (
            <p>
              Xóa đánh giá kỳ <strong>{deleteTarget.period}</strong> của {deleteTarget.supplierName}?
            </p>
          ) : null
        }
        confirmLabel="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PurchasingListLayout>
  );
}
