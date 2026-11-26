import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';
import SectionCard from '../../components/ui/SectionCard';
import SelectField from '../../components/ui/SelectField';
import TableShell from '../../components/ui/TableShell';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
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
import {
  supplierContactRoleLabel,
  supplierContactRoleTone,
} from '../../lib/suppliers/supplierContactRole';

export default function SupplierContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSupplierId = searchParams.get('supplierId') || '';
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState(urlSupplierId);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierContactApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierContactApiDto | null>(null);
  const [contactApiErrors, setContactApiErrors] = useState<{ phone?: string; email?: string; fullName?: string }>({});
  const prevUrlSupplierIdRef = useRef(urlSupplierId);

  useEffect(() => {
    if (urlSupplierId !== prevUrlSupplierIdRef.current) {
      prevUrlSupplierIdRef.current = urlSupplierId;
      setSupplierFilter(urlSupplierId);
      setPage(1);
    }
  }, [urlSupplierId]);

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
  const activeSupplier = (suppliers?.items ?? []).find(s => String(s.id) === supplierFilter);

  const handleSupplierFilterChange = (val: string) => {
    setSupplierFilter(val);
    setPage(1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (val) next.set('supplierId', val);
      else next.delete('supplierId');
      return next;
    }, { replace: true });
  };

  const handleResetFilters = () => {
    setSearch('');
    setSupplierFilter('');
    setPage(1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('supplierId');
      return next;
    }, { replace: true });
  };

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
    <PageShell>
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Liên hệ NCC"
        subtitle="Danh sách người liên hệ của từng nhà cung cấp."
        actions={(
          <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={openCreate}>
            Thêm liên hệ
          </Button>
        )}
      />
      <SectionCard noPadding>
        <FilterToolbar
          search={search}
          onSearchChange={value => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Tìm tên, chức vụ, điện thoại, email…"
          filters={(
            <SelectField
              variant="hrm"
              className="hrm-filter-select-wrap"
              selectClassName="hrm-filter-select"
              aria-label="Lọc theo nhà cung cấp"
              value={supplierFilter}
              placeholder="Tất cả nhà cung cấp"
              options={(suppliers?.items ?? []).map(s => ({
                value: String(s.id),
                label: s.supplierName,
              }))}
              onChange={handleSupplierFilterChange}
            />
          )}
          hasActiveFilters={hasFilters}
          onReset={handleResetFilters}
        />
        {supplierFilter ? (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 mx-4 my-2.5 rounded-lg bg-[var(--md-primary-container)] border border-[var(--md-outline-variant)] text-xs text-[var(--md-on-surface)]">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-[var(--md-on-surface-variant)]">Đang lọc theo NCC:</span>
              <span className="font-semibold text-[var(--md-primary)]">
                {activeSupplier ? `${activeSupplier.supplierCode} - ${activeSupplier.supplierName}` : `NCC #${supplierFilter}`}
              </span>
            </div>
            <Button
              type="button"
              variant="text"
              size="sm"
              leftIcon={X}
              onClick={() => handleSupplierFilterChange('')}
            >
              Bỏ lọc NCC
            </Button>
          </div>
        ) : null}
        <TableShell
          tableClassName="w-full border-collapse hrm-table table-min-w--950"
          colSpan={7}
          loading={isLoading}
          error={isError ? 'Không tải được danh sách liên hệ.' : null}
          isEmpty={items.length === 0}
          emptyMessage={hasFilters ? 'Không tìm thấy liên hệ phù hợp.' : 'Chưa có người liên hệ nào.'}
          emptyAction={
            hasFilters ? null : (
              <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={openCreate}>
                Thêm liên hệ đầu tiên
              </Button>
            )
          }
          pagination={
            totalCount > 0 && !isLoading
              ? {
                  embedded: true,
                  itemLabel: 'liên hệ',
                  currentPage: page,
                  totalPages,
                  onPageChange: setPage,
                  pageSize,
                  onPageSizeChange: size => {
                    setPageSize(size);
                    setPage(1);
                  },
                  totalItems: totalCount,
                }
              : undefined
          }
          header={(
            <tr>
              <th className="table-header-cell">Nhà cung cấp</th>
              <th className="table-header-cell">Họ và tên</th>
              <th className="table-header-cell">Chức vụ</th>
              <th className="table-header-cell">Điện thoại</th>
              <th className="table-header-cell">Email</th>
              <th className="table-header-cell text-center">Vai trò</th>
              <th className="table-header-cell text-center hrm-table-col-actions">Thao tác</th>
            </tr>
          )}
        >
          {items.map(row => (
            <tr key={row.id} className="table-row">
              <td className="table-cell font-medium">{row.supplierName}</td>
              <td className="table-cell font-semibold">{row.fullName}</td>
              <td className="table-cell">{row.position || '—'}</td>
              <td className="table-cell whitespace-nowrap tabular-nums">{row.phone || '—'}</td>
              <td className="table-cell truncate max-w-[16rem]">{row.email || '—'}</td>
              <td className="table-cell text-center">
                <PurchasingStatusBadge
                  label={row.roleLabel || supplierContactRoleLabel(row.role)}
                  tone={supplierContactRoleTone(row.role)}
                />
              </td>
              <td className="table-cell hrm-table-col-actions">
                <div className="hrm-table-row-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    title="Sửa"
                    aria-label={`Sửa liên hệ ${row.fullName}`}
                    onClick={() => {
                      setEditing(row);
                      setContactApiErrors({});
                      setShowForm(true);
                    }}
                  >
                    <Pencil size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    title="Xóa"
                    aria-label={`Xóa liên hệ ${row.fullName}`}
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>

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
      </SectionCard>
    </PageShell>
  );
}
