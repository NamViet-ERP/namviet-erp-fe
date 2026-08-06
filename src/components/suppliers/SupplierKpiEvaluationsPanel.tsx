import { useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import PurchasingStatusBadge from '../purchasing/PurchasingStatusBadge';
import SupplierEvaluationFormModal from './SupplierEvaluationFormModal';
import SupplierKpiEvaluationDetailModal from './SupplierKpiEvaluationDetailModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import Dropdown from '../ui/Dropdown';
import EmptyState from '../ui/EmptyState';
import Pagination from '../ui/Pagination';
import SearchBar from '../ui/SearchBar';
import TableSkeletonRows from '../ui/TableSkeletonRows';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { formatDateCell } from '../../lib/hrm/formatters';
import { kpiGradeLabel } from '../../lib/suppliers/kpiCriteriaCatalog';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { useSuppliers } from '../../hooks/useSuppliers';
import {
  useCreateSupplierEvaluation,
  useDeleteSupplierEvaluation,
  useSupplierEvaluation,
  useSupplierEvaluations,
  useUpdateSupplierEvaluation,
} from '../../hooks/useSupplierDirectory';
import type {
  SupplierEvaluationApiDto,
  UpsertSupplierEvaluationRequest,
} from '../../types/api/supplierDirectoryApi';
import type { DropdownItem } from '../../types';

function gradeTone(grade: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (grade === 'A') return 'success';
  if (grade === 'B') return 'warning';
  if (grade === 'C' || grade === 'D') return 'danger';
  return 'neutral';
}

export default function SupplierKpiEvaluationsPanel() {
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierEvaluationApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierEvaluationApiDto | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: suppliers } = useSuppliers({ all: true });
  const { data, isLoading, isError } = useSupplierEvaluations({
    search,
    supplierId: supplierFilter ? Number(supplierFilter) : undefined,
    page,
    pageSize,
  });
  const detailQuery = useSupplierEvaluation(detailId);
  const createMutation = useCreateSupplierEvaluation();
  const updateMutation = useUpdateSupplierEvaluation();
  const deleteMutation = useDeleteSupplierEvaluation();

  const items = data?.items ?? [];
  const hasFilters = Boolean(search || supplierFilter);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleSubmit = async (body: UpsertSupplierEvaluationRequest) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        showToast('success', 'Đã cập nhật đánh giá định kỳ');
      } else {
        await createMutation.mutateAsync(body);
        showToast('success', 'Đã thêm đánh giá định kỳ');
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

  const rowActions = (row: SupplierEvaluationApiDto): DropdownItem[] => [
    {
      label: 'Xem chi tiết',
      icon: Eye,
      onClick: () => setDetailId(row.id),
    },
    {
      label: 'Sửa',
      icon: Pencil,
      onClick: () => {
        setEditing(row);
        setShowForm(true);
      },
    },
    {
      label: 'Xóa',
      icon: Trash2,
      danger: true,
      onClick: () => setDeleteTarget(row),
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-pretty rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-3 py-2 text-[var(--md-on-surface-variant)]">
        Đánh giá định kỳ (quý/năm) toàn diện năng lực NCC theo 5 nhóm — 30 tiêu chí, thang điểm 1–5.
        Khác với &quot;Đánh giá theo đơn hàng&quot; (gắn 1 PO cụ thể), đánh giá này nhìn tổng thể năng lực hợp tác lâu dài.
      </p>

      <div className="hrm-list-toolbar">
        <div className="hrm-list-toolbar__filters">
          <SearchBar
            value={search}
            onChange={value => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Tìm NCC, kỳ, ghi chú…"
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

      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="purchasing-section-title text-base m-0">Lịch sử đánh giá định kỳ (KPI)</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus size={14} aria-hidden />
          Đánh giá định kỳ mới
        </button>
      </div>
      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table table-min-w--750">
          <thead>
            <tr>
              <th className="table-header-cell">Ngày</th>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell">Kỳ đánh giá</th>
              <th className="table-header-cell">Người đánh giá</th>
              <th className="table-header-cell text-right">Điểm tổng</th>
              <th className="table-header-cell">Xếp hạng</th>
              <th className="table-header-cell text-center">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={7} />
            ) : isError ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState message="Không tải được danh sách đánh giá định kỳ." />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    message={hasFilters ? 'Không tìm thấy đánh giá phù hợp.' : 'Chưa có đánh giá định kỳ nào.'}
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
                  <td className="table-cell whitespace-nowrap tabular-nums">
                    {formatDateCell(row.evaluatedAt)}
                  </td>
                  <td className="table-cell font-semibold">{row.supplierName}</td>
                  <td className="table-cell whitespace-nowrap">{row.period}</td>
                  <td className="table-cell">{row.evaluatedByName || '—'}</td>
                  <td className="table-cell text-right tabular-nums font-semibold">
                    {row.score}/5
                  </td>
                  <td className="table-cell">
                    <PurchasingStatusBadge
                      label={row.gradeLabel || kpiGradeLabel(row.grade)}
                      tone={gradeTone(row.grade)}
                    />
                  </td>
                  <td className="table-cell text-center">
                    <Dropdown trigger="Tác vụ" items={rowActions(row)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(data?.totalCount ?? 0) > 0 && !isLoading ? (
        <Pagination
          embedded
          itemLabel="đánh giá"
          currentPage={page}
          totalPages={data?.totalPages ?? 1}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={size => {
            setPageSize(size);
            setPage(1);
          }}
          totalItems={data?.totalCount ?? 0}
        />
      ) : null}

      <SupplierEvaluationFormModal
        isOpen={showForm}
        editing={editing}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSubmit={body => { void handleSubmit(body); }}
      />

      <SupplierKpiEvaluationDetailModal
        isOpen={detailId !== null}
        evaluation={detailQuery.data ?? null}
        isLoading={detailQuery.isLoading}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          if (!detailQuery.data) return;
          setEditing(detailQuery.data);
          setDetailId(null);
          setShowForm(true);
        }}
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
    </div>
  );
}
