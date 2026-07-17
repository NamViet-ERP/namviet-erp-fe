import { useState } from 'react';
import { Plus, Trash2, Pencil, RotateCcw } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import MaterialAutocomplete from '../../components/ui/MaterialAutocomplete';
import CurrencyInput from '../../components/ui/CurrencyInput';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { WMS_ERROR } from '../../lib/wms/messages';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTimeVi } from '../../lib/hrm/formatters';
import {
  usePriceBooks,
  useCreatePriceBook,
  useUpdatePriceBook,
  useDeletePriceBook,
} from '../../hooks/usePriceBooks';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useMaterials } from '../../hooks/useMaterials';
import type { PriceBookApiDto } from '../../services/priceBooksService';

const emptyForm = {
  materialCode: '',
  supplierId: '',
  unitPrice: '',
  purchaseUrl: '',
  catalogUrl: '',
};

export default function PriceBooksSettingsPanel() {
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PriceBookApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PriceBookApiDto | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError } = usePriceBooks({
    page,
    pageSize,
    search: search || undefined,
    supplierId: supplierFilter ? Number(supplierFilter) : undefined,
  });
  const { data: suppliersPage } = useSuppliers({ all: true });
  const { data: materialsPage } = useMaterials({ pageSize: 300 });
  const createMutation = useCreatePriceBook();
  const updateMutation = useUpdatePriceBook();
  const deleteMutation = useDeletePriceBook();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const suppliers = suppliersPage?.items ?? [];
  const materials = materialsPage?.items ?? [];

  const resetFilters = () => {
    setSearch('');
    setSupplierFilter('');
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row: PriceBookApiDto) => {
    setEditing(row);
    setForm({
      materialCode: row.materialCode,
      supplierId: String(row.supplierId),
      unitPrice: String(row.unitPrice),
      purchaseUrl: row.purchaseUrl ?? '',
      catalogUrl: row.catalogUrl ?? '',
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
    const materialCode = form.materialCode.trim();
    const supplierId = Number(form.supplierId);
    const unitPrice = Number(form.unitPrice);
    if (!materialCode || !supplierId || !unitPrice) {
      showToast('warning', 'Vui lòng nhập đủ vật tư, NCC và đơn giá');
      return;
    }
    const body = {
      materialCode,
      supplierId,
      unitPrice,
      purchaseUrl: form.purchaseUrl.trim() || null,
      catalogUrl: form.catalogUrl.trim() || null,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        showToast('success', 'Đã cập nhật bảng giá');
      } else {
        await createMutation.mutateAsync(body);
        showToast('success', 'Đã thêm bảng giá');
      }
      closeForm();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, WMS_ERROR.generic));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', 'Đã xóa bảng giá');
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, WMS_ERROR.generic));
    }
  };

  return (
    <div className="surface-panel surface-panel--rounded-xl surface-panel--table shadow-card">
      <div className="surface-panel__filter-bar px-4 py-3 page-filter-bar">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="form-select w-44 text-xs"
            value={supplierFilter}
            onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả NCC</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.supplierName}</option>
            ))}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>
            <RotateCcw size={14} /> Đặt lại
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã vật tư, NCC…" />
          <button type="button" className="btn btn-filled btn-sm" onClick={openCreate}>
            <Plus size={14} /> Thêm giá
          </button>
        </div>
      </div>

      <div className="overflow-x-auto table-scroll">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header-cell">Mã vật tư</th>
              <th className="table-header-cell">Tên vật tư</th>
              <th className="table-header-cell">NCC</th>
              <th className="table-header-cell text-right">Đơn giá</th>
              <th className="table-header-cell">Cập nhật</th>
              <th className="table-header-cell text-center hrm-table-col-actions">Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={6} />
            ) : isError ? (
              <tr>
                <td colSpan={6} className="table-cell text-center text-[var(--md-error)]">
                  {WMS_ERROR.loadDefault}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState message="Chưa có bảng giá. Thêm giá theo vật tư và NCC để gợi ý khi lập phiếu nhập." />
                </td>
              </tr>
            ) : (
              items.map(row => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell font-mono text-xs">{row.materialCode}</td>
                  <td className="table-cell">{row.materialName}</td>
                  <td className="table-cell">{row.supplierName}</td>
                  <td className="table-cell text-right tabular-nums font-semibold text-[var(--md-primary)]">
                    {formatCurrency(row.unitPrice)} đ
                  </td>
                  <td className="table-cell text-xs text-[var(--md-on-surface-variant)]">
                    {formatDateTimeVi(row.priceDate)}
                  </td>
                  <td className="table-cell text-center hrm-table-col-actions">
                    <div className="hrm-table-row-actions">
                      <button type="button" className="icon-btn" title="Sửa" onClick={() => openEdit(row)}>
                        <Pencil size={15} />
                      </button>
                      <button type="button" className="icon-btn icon-btn--danger" title="Xóa" onClick={() => setDeleteTarget(row)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-[var(--md-outline-variant)]">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        />
      </div>

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? 'Sửa bảng giá' : 'Thêm bảng giá NCC'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={closeForm}>Hủy</button>
            <button
              type="submit"
              form="price-book-form"
              className="btn btn-filled"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Lưu
            </button>
          </>
        }
      >
        <form id="price-book-form" className="space-y-3 modal-form-bordered" onSubmit={handleSubmit}>
          <FormField label="Vật tư" required>
            <MaterialAutocomplete
              value={form.materialCode}
              onChange={code => setForm(f => ({ ...f, materialCode: code }))}
              materials={materials}
              disabled={Boolean(editing)}
              placeholder="Chọn mã vật tư…"
            />
          </FormField>
          <FormField label="Nhà cung cấp" required>
            <select
              className="form-select"
              value={form.supplierId}
              disabled={Boolean(editing)}
              onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
            >
              <option value="">— Chọn NCC —</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.supplierName}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Đơn giá (VNĐ)" required>
            <CurrencyInput
              value={form.unitPrice}
              onChange={val => setForm(f => ({ ...f, unitPrice: val }))}
            />
          </FormField>
          <FormField label="Link mua hàng">
            <input
              className="form-input"
              value={form.purchaseUrl}
              onChange={e => setForm(f => ({ ...f, purchaseUrl: e.target.value }))}
              placeholder="https://…"
            />
          </FormField>
          <FormField label="Link catalog kỹ thuật">
            <input
              className="form-input"
              value={form.catalogUrl}
              onChange={e => setForm(f => ({ ...f, catalogUrl: e.target.value }))}
              placeholder="https://…"
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa bảng giá?"
        message={
          deleteTarget ? (
            <p>
              Xóa giá <strong>{deleteTarget.materialName}</strong> — {deleteTarget.supplierName}?
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
