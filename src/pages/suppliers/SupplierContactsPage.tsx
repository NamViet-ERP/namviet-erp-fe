import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import SupplierContactFormModal from '../../components/suppliers/SupplierContactFormModal';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage, getApiFieldErrors } from '../../lib/apiClient';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import { useSuppliers } from '../../hooks/useSuppliers';
import {
  useCreateSupplierContact,
  useDeleteSupplierContact,
  useSupplierContacts,
  useUpdateSupplierContact,
} from '../../hooks/useSupplierDirectory';
import type {
  SupplierContactApiDto,
  UpsertSupplierContactRequest,
} from '../../types/api/supplierDirectoryApi';

export default function SupplierContactsPage() {
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierContactApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierContactApiDto | null>(null);
  const [contactApiErrors, setContactApiErrors] = useState<{ phone?: string; email?: string; fullName?: string }>({});

  const { data: suppliers } = useSuppliers({ all: true });
  const { data, isLoading, isError } = useSupplierContacts({
    search,
    supplierId: supplierFilter ? Number(supplierFilter) : undefined,
    page,
    pageSize,
  });
  const createMutation = useCreateSupplierContact();
  const updateMutation = useUpdateSupplierContact();
  const deleteMutation = useDeleteSupplierContact();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = Boolean(search || supplierFilter);

  const openCreate = () => {
    setEditing(null);
    setContactApiErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (body: UpsertSupplierContactRequest) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        showToast('success', 'Đã cập nhật người liên hệ');
      } else {
        await createMutation.mutateAsync(body);
        showToast('success', 'Đã thêm người liên hệ');
      }
      setContactApiErrors({});
      setShowForm(false);
      setEditing(null);
    } catch (err: unknown) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors.phone || fieldErrors.email || fieldErrors.fullName) {
        setContactApiErrors({
          phone: fieldErrors.phone,
          email: fieldErrors.email,
          fullName: fieldErrors.fullName,
        });
        return;
      }
      showToast('error', getApiErrorMessage(err, 'Không thể lưu người liên hệ'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa liên hệ ${deleteTarget.fullName}`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa người liên hệ'));
    }
  };

  return (
    <PurchasingListLayout
      eyebrow="Nhà cung cấp"
      title="Liên hệ NCC"
      subtitle="Danh sách người liên hệ của từng nhà cung cấp."
      search={search}
      onSearchChange={value => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Tìm tên, chức vụ, điện thoại, email…"
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
          Thêm liên hệ
        </button>
      )}
    >
      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table table-min-w--950">
          <thead>
            <tr>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell">Họ và tên</th>
              <th className="table-header-cell">Chức vụ</th>
              <th className="table-header-cell">Điện thoại</th>
              <th className="table-header-cell">Email</th>
              <th className="table-header-cell text-center">Liên hệ chính</th>
              <th className="table-header-cell text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={7} />
            ) : isError ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState message="Không tải được danh sách liên hệ." />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    message={hasFilters ? 'Không tìm thấy liên hệ phù hợp.' : 'Chưa có người liên hệ nào.'}
                    action={
                      hasFilters ? null : (
                        <button type="button" className="btn btn-primary" onClick={openCreate}>
                          <Plus size={16} aria-hidden />
                          Thêm liên hệ đầu tiên
                        </button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              items.map(row => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell font-medium">{row.supplierName}</td>
                  <td className="table-cell font-semibold">{row.fullName}</td>
                  <td className="table-cell">{row.position || '—'}</td>
                  <td className="table-cell whitespace-nowrap tabular-nums">{row.phone || '—'}</td>
                  <td className="table-cell truncate max-w-[16rem]">{row.email || '—'}</td>
                  <td className="table-cell text-center">
                    {row.isPrimary ? (
                      <PurchasingStatusBadge label="Chính" tone="success" />
                    ) : (
                      <span className="text-[var(--md-on-surface-variant)]">—</span>
                    )}
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-[var(--tint-primary-hover)] opacity-80 hover:opacity-100"
                        aria-label={`Sửa liên hệ ${row.fullName}`}
                        onClick={() => {
                          setEditing(row);
                          setContactApiErrors({});
                          setShowForm(true);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-[var(--md-error)] hover:bg-[var(--md-error-container)] opacity-80 hover:opacity-100"
                        aria-label={`Xóa liên hệ ${row.fullName}`}
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
          itemLabel="liên hệ"
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

      <SupplierContactFormModal
        isOpen={showForm}
        editing={editing}
        isSaving={createMutation.isPending || updateMutation.isPending}
        apiErrors={contactApiErrors}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
          setContactApiErrors({});
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa người liên hệ?"
        message={
          deleteTarget ? (
            <p>
              Xóa <strong>{deleteTarget.fullName}</strong> khỏi danh sách liên hệ của{' '}
              {deleteTarget.supplierName}?
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
