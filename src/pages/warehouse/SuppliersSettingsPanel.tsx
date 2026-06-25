import { useState } from 'react';
import { Plus, Trash2, Pencil, RotateCcw } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '../../hooks/useSuppliers';
import type { SupplierApiDto } from '../../services/suppliersService';

const RATING_OPTIONS = ['A', 'B', 'C'];

const emptyForm = {
  supplierCode: '',
  supplierName: '',
  contactPhone: '',
  maxDebtDays: '30',
  rating: 'A',
};

export default function SuppliersSettingsPanel() {
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierApiDto | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError } = useSuppliers({
    page,
    pageSize,
    search: search || undefined,
    rating: ratingFilter || undefined,
  });
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const resetFilters = () => {
    setSearch('');
    setRatingFilter('');
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: SupplierApiDto) => {
    setEditing(s);
    setForm({
      supplierCode: s.supplierCode,
      supplierName: s.supplierName,
      contactPhone: s.contactPhone ?? '',
      maxDebtDays: String(s.maxDebtDays),
      rating: s.rating || 'A',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplierCode = form.supplierCode.trim();
    const supplierName = form.supplierName.trim();
    if (!supplierCode || !supplierName) {
      showToast('warning', 'Mã NCC và tên nhà cung cấp là bắt buộc');
      return;
    }
    const body = {
      supplierCode,
      supplierName,
      contactPhone: form.contactPhone.trim() || null,
      maxDebtDays: Number(form.maxDebtDays) || 30,
      rating: form.rating || 'A',
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        showToast('success', 'Đã cập nhật nhà cung cấp');
      } else {
        await createMutation.mutateAsync(body);
        showToast('success', 'Đã thêm nhà cung cấp');
      }
      closeForm();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu nhà cung cấp'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa ${deleteTarget.supplierName}`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa nhà cung cấp'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="surface-panel surface-panel--rounded-xl p-4 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[var(--md-on-surface-variant)] text-pretty max-w-2xl">
            Chỉ các NCC đã khai báo mới xuất hiện khi lập phiếu nhập kho.
          </p>
          <button type="button" className="btn btn-primary flex items-center gap-2 shrink-0" onClick={openCreate}>
            <Plus size={16} />
            Thêm NCC
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs space-y-1 sm:col-span-2">
            <span className="font-semibold text-[var(--md-on-surface-variant)]">Xếp hạng</span>
            <select
              className="form-select w-full text-sm"
              value={ratingFilter}
              onChange={e => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">— Tất cả —</option>
              {RATING_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="hrm-filter-bar">
          <div className="hrm-filter-bar__search flex-1 min-w-[220px]">
            <SearchBar
              value={search}
              onChange={v => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm mã NCC, tên nhà cung cấp…"
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="btn-clear-filters"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">XÓA BỘ LỌC</span>
          </button>
        </div>
      </div>

      <div className="surface-panel surface-panel--rounded-xl surface-panel--table shadow-card">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-xs table-min-w--720">
            <thead>
              <tr>
                <th className="table-header-cell text-left">Mã NCC</th>
                <th className="table-header-cell text-left">Tên nhà cung cấp</th>
                <th className="table-header-cell text-left">Điện thoại</th>
                <th className="table-header-cell text-right">Hạn công nợ</th>
                <th className="table-header-cell text-center">Xếp hạng</th>
                <th className="table-header-cell text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows colSpan={6} />
              ) : isError ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message={WMS_ERROR.loadSuppliers} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState message={search || ratingFilter ? 'Không tìm thấy NCC phù hợp.' : 'Chưa có nhà cung cấp nào.'} />
                  </td>
                </tr>
              ) : (
                items.map(s => (
                  <tr
                    key={s.id}
                    className="table-row border-b border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)]"
                  >
                    <td className="table-cell font-mono font-semibold">{s.supplierCode}</td>
                    <td className="table-cell font-medium">{s.supplierName}</td>
                    <td className="table-cell">{s.contactPhone || '—'}</td>
                    <td className="table-cell text-right tabular-nums">{s.maxDebtDays} ngày</td>
                    <td className="table-cell text-center">
                      <span className="inline-block min-w-[1.5rem] px-2 py-0.5 rounded bg-[var(--md-surface-container-high)] font-semibold">
                        {s.rating}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-[var(--tint-primary-hover)] opacity-80 hover:opacity-100"
                          aria-label="Sửa"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-[var(--md-error)] hover:bg-[var(--md-error-container)] opacity-80 hover:opacity-100"
                          aria-label="Xóa"
                          onClick={() => setDeleteTarget(s)}
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
          <div className="surface-panel__footer px-4 pb-4">
            <Pagination
              embedded
              itemLabel="NCC"
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={s => {
                setPageSize(s);
                setPage(1);
              }}
              totalItems={totalCount}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={closeForm}>Hủy</button>
            <button
              type="submit"
              form="supplier-settings-form"
              className="btn btn-filled"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Lưu
            </button>
          </>
        }
      >
        <form id="supplier-settings-form" className="space-y-3 modal-form-bordered" onSubmit={handleSubmit}>
          <FormField label="Mã NCC" required>
            <input
              className="form-input"
              value={form.supplierCode}
              disabled={Boolean(editing)}
              onChange={e => setForm(f => ({ ...f, supplierCode: e.target.value }))}
              placeholder="VD: NCC-HP-01"
            />
          </FormField>
          <FormField label="Tên nhà cung cấp" required>
            <input
              className="form-input"
              value={form.supplierName}
              onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
            />
          </FormField>
          <FormField label="Điện thoại liên hệ">
            <input
              className="form-input"
              value={form.contactPhone}
              onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Hạn công nợ (ngày)">
              <input
                type="number"
                min={0}
                className="form-input"
                value={form.maxDebtDays}
                onChange={e => setForm(f => ({ ...f, maxDebtDays: e.target.value }))}
              />
            </FormField>
            <FormField label="Xếp hạng">
              <select
                className="form-select"
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
              >
                {RATING_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </FormField>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa nhà cung cấp?"
        message={
          deleteTarget ? (
            <p>
              Xóa <strong>{deleteTarget.supplierName}</strong> khỏi danh mục?
              Phiếu cũ vẫn giữ tên đã lưu.
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
