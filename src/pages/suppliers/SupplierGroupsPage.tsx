import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import PageShell from '../../components/ui/PageShell';
import PageHeader from '../../components/ui/PageHeader';
import SectionCard from '../../components/ui/SectionCard';
import TableShell from '../../components/ui/TableShell';
import FilterToolbar from '../../components/ui/FilterToolbar';
import PurchasingStatusBadge from '../../components/purchasing/PurchasingStatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
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
    <PageShell>
      <PageHeader
        eyebrow="Nhà cung cấp"
        title="Nhóm nhà cung cấp"
        subtitle="Phân nhóm theo ngành / loại. Một NCC có thể thuộc nhiều nhóm."
        actions={(
          <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={openCreate}>
            Tạo nhóm
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
          searchPlaceholder="Tìm theo tên nhóm…"
          hasActiveFilters={Boolean(search)}
          onReset={() => {
            setSearch('');
            setPage(1);
          }}
        />
        <TableShell
          className="supplier-groups-table"
          tableClassName="w-full border-collapse hrm-table table-min-w--720"
          colSpan={5}
          loading={isLoading}
          error={isError ? 'Không tải được danh sách nhóm nhà cung cấp.' : null}
          isEmpty={items.length === 0}
          emptyMessage={search ? 'Không tìm thấy nhóm phù hợp.' : 'Chưa có nhóm nhà cung cấp nào.'}
          emptyAction={
            search ? null : (
              <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={openCreate}>
                Tạo nhóm đầu tiên
              </Button>
            )
          }
          pagination={
            totalCount > 0 && !isLoading
              ? {
                  embedded: true,
                  itemLabel: 'nhóm',
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
              <th className="table-header-cell supplier-groups-col-idx">#</th>
              <th className="table-header-cell supplier-groups-col-name">Nhóm</th>
              <th className="table-header-cell supplier-groups-col-desc">Mô tả</th>
              <th className="table-header-cell text-center supplier-groups-col-count">Số NCC</th>
              <th className="table-header-cell hrm-table-col-actions" aria-label="Thao tác" />
            </tr>
          )}
        >
          {items.map((row, i) => (
            <tr key={row.id} className="table-row">
              <td className="table-cell supplier-groups-col-idx whitespace-nowrap tabular-nums">
                {(page - 1) * pageSize + i + 1}
              </td>
              <td className="table-cell supplier-groups-col-name">
                <Link
                  to={`/suppliers/list?groupId=${row.id}`}
                  className="supplier-groups-name-link"
                  title={`Xem NCC trong nhóm ${row.name}`}
                >
                  {row.name}
                </Link>
              </td>
              <td className="table-cell supplier-groups-col-desc">
                {row.description ? (
                  <span className="supplier-groups-desc">{row.description}</span>
                ) : (
                  <span className="supplier-groups-desc supplier-groups-desc--empty">Chưa có mô tả</span>
                )}
              </td>
              <td className="table-cell text-center supplier-groups-col-count">
                <PurchasingStatusBadge
                  label={String(row.supplierCount)}
                  tone={row.supplierCount > 0 ? 'warning' : 'neutral'}
                />
              </td>
              <td className="table-cell hrm-table-col-actions">
                <div className="hrm-table-row-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    title="Gán nhà cung cấp"
                    aria-label={`Gán nhà cung cấp cho nhóm ${row.name}`}
                    onClick={() => setMembersTarget(row)}
                  >
                    <Users size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    title="Sửa"
                    aria-label={`Sửa nhóm ${row.name}`}
                    onClick={() => openEdit(row)}
                  >
                    <Pencil size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    title="Xóa"
                    aria-label={`Xóa nhóm ${row.name}`}
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>

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
      </SectionCard>
    </PageShell>
  );
}
