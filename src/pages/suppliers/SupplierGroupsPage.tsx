import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  CornerDownRight,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
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
import { buildSupplierGroupTree } from '../../lib/suppliers/supplierGroupTree';
import {
  useCreateSupplierGroup,
  useDeleteSupplierGroup,
  useSetSupplierGroupMembers,
  useSupplierGroups,
  useUpdateSupplierGroup,
} from '../../hooks/useSupplierDirectory';
import type {
  SupplierGroupApiDto,
  UpsertSupplierGroupRequest,
} from '../../types/api/supplierDirectoryApi';

export default function SupplierGroupsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierGroupApiDto | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);
  const [membersTarget, setMembersTarget] = useState<SupplierGroupApiDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierGroupApiDto | null>(null);
  const [collapsedParentIds, setCollapsedParentIds] = useState<Set<number>>(() => new Set());

  const { data, isLoading, isError } = useSupplierGroups({ search, page: 1, pageSize: 500 });
  const { data: allGroupsData } = useSupplierGroups({ page: 1, pageSize: 500 });
  const createMutation = useCreateSupplierGroup();
  const updateMutation = useUpdateSupplierGroup();
  const deleteMutation = useDeleteSupplierGroup();
  const membersMutation = useSetSupplierGroupMembers();

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const parentOptions = useMemo(() => allGroupsData?.items ?? items, [allGroupsData?.items, items]);
  const tree = useMemo(() => buildSupplierGroupTree(items), [items]);
  const parentsWithChildren = useMemo(
    () => tree.filter(node => node.children.length > 0),
    [tree],
  );
  const hasAnyChildren = parentsWithChildren.length > 0;
  const allCollapsed =
    hasAnyChildren && parentsWithChildren.every(node => collapsedParentIds.has(node.group.id));

  const openCreateRoot = () => {
    setEditing(null);
    setDefaultParentId(null);
    setShowForm(true);
  };

  const openCreateChild = (parentId: number) => {
    setEditing(null);
    setDefaultParentId(parentId);
    setShowForm(true);
  };

  const openEdit = (group: SupplierGroupApiDto) => {
    setEditing(group);
    setDefaultParentId(group.parentGroupId ?? null);
    setShowForm(true);
  };

  const toggleParentCollapsed = (parentId: number) => {
    setCollapsedParentIds(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  const toggleAllCollapsed = () => {
    if (allCollapsed) {
      setCollapsedParentIds(new Set());
    } else {
      setCollapsedParentIds(new Set(parentsWithChildren.map(node => node.group.id)));
    }
  };

  const handleSubmit = async (values: UpsertSupplierGroupRequest) => {
    try {
      const hasSubGroups =
        values.parentGroupId == null &&
        Array.isArray(values.subGroups) &&
        values.subGroups.length > 0;
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body: values });
        showToast(
          'success',
          values.parentGroupId != null
            ? 'Đã cập nhật mô tả con'
            : hasSubGroups
              ? 'Đã cập nhật nhóm và danh sách mô tả con'
              : 'Đã cập nhật nhóm nhà cung cấp',
        );
      } else {
        await createMutation.mutateAsync(values);
        showToast(
          'success',
          values.parentGroupId != null
            ? 'Đã thêm mô tả con'
            : hasSubGroups && values.subGroups
              ? `Đã tạo nhóm và ${values.subGroups.length} mô tả con`
              : 'Đã tạo nhóm nhà cung cấp',
        );
      }
      setShowForm(false);
      setEditing(null);
      setDefaultParentId(null);
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
    if (!deleteTarget || deleteTarget.childCount > 0) return;
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
        subtitle="Mỗi nhóm có thể chia thành nhiều mô tả / phân loại con bên trong. Một NCC có thể tick chọn nhiều mô tả."
        actions={(
          <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={openCreateRoot}>
            Tạo nhóm
          </Button>
        )}
      />
      <SectionCard noPadding>
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo tên nhóm…"
          filters={
            hasAnyChildren ? (
              <Button
                type="button"
                variant="outlined"
                size="sm"
                leftIcon={allCollapsed ? ChevronsUpDown : ChevronsDownUp}
                onClick={toggleAllCollapsed}
              >
                {allCollapsed ? 'Mở rộng tất cả' : 'Thu gọn tất cả'}
              </Button>
            ) : undefined
          }
          hasActiveFilters={Boolean(search)}
          onReset={() => setSearch('')}
        />
        <TableShell
          className="supplier-groups-table"
          tableClassName="w-full border-collapse hrm-table table-min-w--720"
          colSpan={5}
          loading={isLoading}
          error={isError ? 'Không tải được danh sách nhóm nhà cung cấp.' : null}
          isEmpty={tree.length === 0}
          emptyMessage={search ? 'Không tìm thấy nhóm phù hợp.' : 'Chưa có nhóm nhà cung cấp nào.'}
          emptyAction={
            search ? null : (
              <Button type="button" variant="filled" size="sm" leftIcon={Plus} onClick={openCreateRoot}>
                Tạo nhóm đầu tiên
              </Button>
            )
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
          {tree.map((node, parentIdx) => {
            const parent = node.group;
            const children = node.children;
            const hasChildren = children.length > 0;
            const isExpanded = hasChildren && !collapsedParentIds.has(parent.id);
            const isPromotedChild = parent.parentGroupId != null;

            return (
              <Fragment key={parent.id}>
                <tr className="table-row supplier-groups-row--parent">
                  <td className="table-cell supplier-groups-col-idx whitespace-nowrap tabular-nums">
                    {parentIdx + 1}
                  </td>
                  <td className="table-cell supplier-groups-col-name">
                    <div className="supplier-groups-tree-cell">
                      {hasChildren ? (
                        <button
                          type="button"
                          className="supplier-groups-tree-toggle"
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? `Thu gọn ${parent.name}` : `Mở rộng ${parent.name}`}
                          onClick={() => toggleParentCollapsed(parent.id)}
                        >
                          {isExpanded ? <ChevronDown size={15} aria-hidden /> : <ChevronRight size={15} aria-hidden />}
                        </button>
                      ) : (
                        <span className="supplier-groups-tree-spacer" aria-hidden />
                      )}
                      <Link
                        to={`/suppliers/list?groupId=${parent.id}`}
                        className="supplier-groups-name-link"
                        title={`Xem NCC trong nhóm ${parent.name}`}
                      >
                        {isPromotedChild && parent.parentGroupName
                          ? `${parent.parentGroupName} › ${parent.name}`
                          : parent.name}
                      </Link>
                      {hasChildren ? (
                        <span className="supplier-groups-child-count">{children.length} mô tả</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="table-cell supplier-groups-col-desc">
                    {parent.description ? (
                      <span className="supplier-groups-desc">{parent.description}</span>
                    ) : hasChildren ? (
                      <span className="supplier-groups-desc supplier-groups-desc--empty">
                        {`Gồm ${children.length} mô tả con bên dưới`}
                      </span>
                    ) : (
                      <span className="supplier-groups-desc supplier-groups-desc--empty">Chưa có mô tả</span>
                    )}
                  </td>
                  <td className="table-cell text-center supplier-groups-col-count">
                    <PurchasingStatusBadge
                      label={String(parent.supplierCount)}
                      tone={parent.supplierCount > 0 ? 'warning' : 'neutral'}
                    />
                  </td>
                  <td className="table-cell hrm-table-col-actions">
                    <div className="hrm-table-row-actions">
                      {!isPromotedChild ? (
                        <button
                          type="button"
                          className="icon-btn"
                          title="Thêm mô tả con"
                          aria-label={`Thêm mô tả con cho ${parent.name}`}
                          onClick={() => openCreateChild(parent.id)}
                        >
                          <Plus size={15} aria-hidden />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={hasChildren}
                        title={
                          hasChildren
                            ? 'Gán nhà cung cấp ở từng mô tả con bên dưới'
                            : 'Gán nhà cung cấp'
                        }
                        aria-label={`Gán nhà cung cấp cho nhóm ${parent.name}`}
                        onClick={() => setMembersTarget(parent)}
                      >
                        <Users size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="Sửa"
                        aria-label={`Sửa nhóm ${parent.name}`}
                        onClick={() => openEdit(parent)}
                      >
                        <Pencil size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        disabled={hasChildren}
                        title={
                          hasChildren
                            ? `Không thể xóa vì đang có ${children.length} mô tả con`
                            : 'Xóa'
                        }
                        aria-label={`Xóa nhóm ${parent.name}`}
                        onClick={() => setDeleteTarget(parent)}
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded
                  ? children.map((child, childIdx) => (
                      <tr key={child.id} className="table-row supplier-groups-row--child">
                        <td className="table-cell supplier-groups-col-idx whitespace-nowrap tabular-nums">
                          {parentIdx + 1}.{childIdx + 1}
                        </td>
                        <td className="table-cell supplier-groups-col-name">
                          <div className="supplier-groups-tree-cell supplier-groups-tree-cell--child">
                            <CornerDownRight size={14} className="supplier-groups-child-icon" aria-hidden />
                            <Link
                              to={`/suppliers/list?groupId=${child.id}`}
                              className="supplier-groups-child-link"
                              title={`Xem NCC trong mô tả ${child.name}`}
                            >
                              {child.name}
                            </Link>
                          </div>
                        </td>
                        <td className="table-cell supplier-groups-col-desc">
                          {child.description ? (
                            <span className="supplier-groups-desc">{child.description}</span>
                          ) : (
                            <span className="supplier-groups-desc supplier-groups-desc--empty">
                              —
                            </span>
                          )}
                        </td>
                        <td className="table-cell text-center supplier-groups-col-count">
                          <PurchasingStatusBadge
                            label={String(child.supplierCount)}
                            tone={child.supplierCount > 0 ? 'warning' : 'neutral'}
                          />
                        </td>
                        <td className="table-cell hrm-table-col-actions">
                          <div className="hrm-table-row-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              title="Gán nhà cung cấp"
                              aria-label={`Gán nhà cung cấp cho mô tả ${child.name}`}
                              onClick={() => setMembersTarget(child)}
                            >
                              <Users size={15} aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              title="Sửa"
                              aria-label={`Sửa mô tả ${child.name}`}
                              onClick={() => openEdit(child)}
                            >
                              <Pencil size={15} aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="icon-btn icon-btn--danger"
                              title="Xóa"
                              aria-label={`Xóa mô tả ${child.name}`}
                              onClick={() => setDeleteTarget(child)}
                            >
                              <Trash2 size={15} aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </Fragment>
            );
          })}
        </TableShell>

        <SupplierGroupFormModal
          isOpen={showForm}
          editing={editing}
          parentOptions={parentOptions}
          allGroups={parentOptions}
          defaultParentId={defaultParentId}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
            setDefaultParentId(null);
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
