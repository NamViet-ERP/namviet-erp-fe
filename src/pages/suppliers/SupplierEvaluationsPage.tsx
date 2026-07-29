import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import SupplierEvaluationFormModal from '../../components/suppliers/SupplierEvaluationFormModal';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { useSuppliers } from '../../hooks/useSuppliers';
import {
  useCreateSupplierEvaluation,
  useDeleteSupplierEvaluation,
  useSupplierEvaluations,
  useSupplierModuleSettings,
  useUpdateSupplierEvaluation,
} from '../../hooks/useSupplierDirectory';
import type {
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

  const { data: suppliers } = useSuppliers({ all: true });
  const { data: settings } = useSupplierModuleSettings();
  const { data, isLoading, isError } = useSupplierEvaluations({
    search,
    supplierId: supplierFilter ? Number(supplierFilter) : undefined,
    page,
    pageSize,
  });
  const createMutation = useCreateSupplierEvaluation();
  const updateMutation = useUpdateSupplierEvaluation();
  const deleteMutation = useDeleteSupplierEvaluation();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
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

  return (
    <PurchasingListLayout
      eyebrow="Nhà cung cấp"
      title="Đánh giá NCC"
      subtitle="Điểm đánh giá nhà cung cấp theo kỳ. Xếp hạng tính tự động từ ngưỡng điểm trong Thiết lập."
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
          Tạo đánh giá
        </button>
      )}
    >
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
                    message={hasFilters ? 'Không tìm thấy đánh giá phù hợp.' : 'Chưa có đánh giá nào.'}
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
