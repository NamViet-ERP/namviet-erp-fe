import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import PurchasingListLayout from '../../components/purchasing/PurchasingListLayout';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Dropdown from '../../components/ui/Dropdown';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import SupplierGroupFormModal from '../../components/suppliers/SupplierGroupFormModal';
import SupplierGroupMembersModal from '../../components/suppliers/SupplierGroupMembersModal';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import {
  useCreateSupplierGroup,
  useDeleteSupplierGroup,
  useSetSupplierGroupMembers,
  useSupplierGroups,
  useUpdateSupplierGroup,
} from '../../hooks/useSupplierDirectory';
import type { DropdownItem } from '../../types';
import type { SupplierGroupApiDto } from '../../types/api/supplierDirectoryApi';

export default function SupplierGroupsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierGroupApiDto | null>(null);
  const [membersTarget, setMembersTarget] = useState<SupplierGroupApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierGroupApiDto | null>(null);

  const { data, isLoading, isError } = useSupplierGroups({ search, page, pageSize });
  const createMutation = useCreateSupplierGroup();
  const updateMutation = useUpdateSupplierGroup();
  const deleteMutation = useDeleteSupplierGroup();
  const membersMutation = useSetSupplierGroupMembers();

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (group: SupplierGroupApiDto) => {
    setEditing(group);
    setShowForm(true);
  };

  const rowActions = (row: SupplierGroupApiDto): DropdownItem[] => [
    {
      label: 'Gán nhà cung cấp',
      icon: Users,
      onClick: () => setMembersTarget(row),
    },
    {
      label: 'Sửa',
      icon: Pencil,
      onClick: () => openEdit(row),
    },
    {
      label: 'Xóa',
      icon: Trash2,
      danger: true,
      onClick: () => setDeleteTarget(row),
    },
  ];

  const handleSubmit = async (values: { name: string; description: string | null }) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body: values });
        showToast('success', 'Đã cập nhật nhóm nhà cung cấp');
      } else {
        await createMutation.mutateAsync(values);
        showToast('success', 'Đã tạo nhóm nhà cung cấp');
      }
      setShowForm(false);
      setEditing(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu nhóm nhà cung cấp'));
    }
  };

  const handleSetMembers = async (supplierIds: number[]) => {
    if (!membersTarget) return;
    try {
      await membersMutation.mutateAsync({ groupId: membersTarget.id, supplierIds });
      showToast('success', `Đã cập nhật NCC của nhóm ${membersTarget.name}`);
      setMembersTarget(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể cập nhật NCC của nhóm'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa nhóm ${deleteTarget.name}`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa nhóm nhà cung cấp'));
    }
  };

  return (
    <PurchasingListLayout
      eyebrow="Nhà cung cấp"
      title="Nhóm nhà cung cấp"
      subtitle="Phân nhóm NCC theo ngành / loại. Một NCC có thể thuộc nhiều nhóm."
      search={search}
      onSearchChange={value => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Tìm nhóm…"
      hasFilters={Boolean(search)}
      onResetFilters={() => {
        setSearch('');
        setPage(1);
      }}
      actions={(
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden />
          Tạo mới
        </button>
      )}
    >
      <div className="overflow-x-auto table-scroll hrm-table-wrap">
        <table className="w-full border-collapse hrm-table table-min-w--720">
          <thead>
            <tr>
              <th className="table-header-cell">#</th>
              <th className="table-header-cell">Nhóm nhà cung cấp</th>
              <th className="table-header-cell">Mô tả</th>
              <th className="table-header-cell text-right">Số NCC</th>
              <th className="table-header-cell text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeletonRows colSpan={5} />
            ) : isError ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState message="Không tải được danh sách nhóm nhà cung cấp." />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    message={search ? 'Không tìm thấy nhóm phù hợp.' : 'Chưa có nhóm nhà cung cấp nào.'}
                    action={
                      search ? null : (
                        <button type="button" className="btn btn-primary" onClick={openCreate}>
                          <Plus size={16} aria-hidden />
                          Tạo nhóm đầu tiên
                        </button>
                      )
                    }
                  />
                </td>
              </tr>
            ) : (
              items.map((row, i) => (
                <tr key={row.id} className="table-row">
                  <td className="table-cell whitespace-nowrap tabular-nums">
                    {(page - 1) * pageSize + i + 1}
                  </td>
                  <td className="table-cell">
                    <Link
                      to={`/suppliers/list?groupId=${row.id}`}
                      className="font-semibold text-[var(--md-primary)] hover:underline"
                      title={`Xem NCC trong nhóm ${row.name}`}
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="table-cell">{row.description || '—'}</td>
                  <td className="table-cell whitespace-nowrap text-right tabular-nums">
                    {row.supplierCount}
                  </td>
                  <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                    <Dropdown trigger="Tác vụ" items={rowActions(row)} />
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
          itemLabel="nhóm"
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

      <SupplierGroupFormModal
        isOpen={showForm}
        editing={editing}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <SupplierGroupMembersModal
        group={membersTarget}
        isSaving={membersMutation.isPending}
        onClose={() => setMembersTarget(null)}
        onSubmit={handleSetMembers}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa nhóm nhà cung cấp?"
        message={
          deleteTarget ? (
            <p>
              Xóa nhóm <strong>{deleteTarget.name}</strong>? Các nhà cung cấp trong nhóm vẫn được giữ
              lại, chỉ mất liên kết nhóm.
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
