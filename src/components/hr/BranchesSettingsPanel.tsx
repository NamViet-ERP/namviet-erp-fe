import { useState } from 'react';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import HrmPanel from './HrmPanel';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import TableSkeletonRows from '../ui/TableSkeletonRows';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  useCreateBranch,
  useDeleteBranch,
  useBranches,
  useUpdateBranch,
} from '../../hooks/useBranches';
import type { BranchApiDto } from '../../services/branchesService';

type BranchForm = { code: string; name: string };

const EMPTY_FORM: BranchForm = { code: '', name: '' };

const COL_COUNT = 5;

/** Design read: dense ERP HR branch catalog - table + modal primitives, tokens only. */
export default function BranchesSettingsPanel({ canUpdate }: { canUpdate: boolean }) {
  const { data: branches = [], isPending, isError, refetch } = useBranches(false);
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BranchApiDto | null>(null);
  const [form, setForm] = useState<BranchForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<BranchApiDto | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (branch: BranchApiDto) => {
    setEditing(branch);
    setForm({ code: branch.code, name: branch.name });
    setFormOpen(true);
  };

  const handleSave = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    if (!code || !name) {
      showToast('warning', 'Nhập mã và tên chi nhánh.');
      return;
    }
    const body = { code, name };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
        showToast('success', 'Đã cập nhật chi nhánh.');
      } else {
        await createMutation.mutateAsync(body);
        showToast('success', 'Đã tạo chi nhánh.');
      }
      setFormOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu chi nhánh.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast('success', `Đã xóa chi nhánh ${deleteTarget.name}.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa chi nhánh.'));
    }
  };

  return (
    <>
      <HrmPanel className="hrm-settings-card hrm-settings-card--featured">
        <div className="hrm-settings-card__head">
          <div className="hrm-settings-card__icon hrm-settings-card__icon--primary">
            <MapPin size={20} aria-hidden />
          </div>
          <div className="hrm-settings-card__head-text">
            <h2 className="hrm-settings-card__title">Chi nhánh</h2>
            <p className="hrm-settings-card__desc">
              Danh mục chi nhánh dùng khi tạo và sửa hồ sơ nhân viên.
            </p>
          </div>
          {canUpdate && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Thêm chi nhánh
            </button>
          )}
        </div>

        {isError && (
          <div className="hrm-invite-state" role="alert">
            <span>Không tải được danh sách chi nhánh.</span>
            <button type="button" className="btn btn-outline btn-sm rounded-full" onClick={() => void refetch()}>
              Thử lại
            </button>
          </div>
        )}

        {!isPending && !isError && branches.length === 0 && (
          <EmptyState message="Chưa có chi nhánh. Tạo chi nhánh đầu tiên để chọn trên hồ sơ nhân viên." />
        )}

        {(isPending || branches.length > 0) && (
          <div className="wms-inventory-table-wrap">
            <table className="wms-inventory-table">
              <thead>
                <tr>
                  <th className="table-header-cell">Mã</th>
                  <th className="table-header-cell">Tên chi nhánh</th>
                  <th className="table-header-cell">Số NV</th>
                  <th className="table-header-cell">Trạng thái</th>
                  {canUpdate && <th className="table-header-cell">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {isPending && <TableSkeletonRows colSpan={canUpdate ? COL_COUNT : COL_COUNT - 1} />}
                {!isPending && branches.map(branch => (
                  <tr key={branch.id} className="table-row">
                    <td className="table-cell" style={{ fontFamily: 'var(--font-mono)' }}>{branch.code}</td>
                    <td className="table-cell">{branch.name}</td>
                    <td className="table-cell" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {branch.employeeCount ?? 0}
                    </td>
                    <td className="table-cell">{branch.isActive ? 'Đang hoạt động' : 'Ngừng'}</td>
                    {canUpdate && (
                      <td className="table-cell">
                        <div className="hrm-table-row-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => openEdit(branch)}
                            aria-label={`Sửa ${branch.name}`}
                          >
                            <Pencil size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm text-[var(--md-error)]"
                            onClick={() => setDeleteTarget(branch)}
                            aria-label={`Xóa ${branch.name}`}
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HrmPanel>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}
        size="sm"
        footer={(
          <>
            <button type="button" className="btn btn-outline" onClick={() => setFormOpen(false)}>Hủy</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleSave()}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Lưu
            </button>
          </>
        )}
      >
        <div className="flex flex-col gap-3">
          <label className="hrm-field">
            <span className="hrm-field__label">Mã chi nhánh</span>
            <input
              className="hrm-field-input"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="VD: HN"
            />
          </label>
          <label className="hrm-field">
            <span className="hrm-field__label">Tên chi nhánh</span>
            <input
              className="hrm-field-input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="VD: Hà Nội"
            />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Xóa chi nhánh?"
        message={
          deleteTarget
            ? `Xóa "${deleteTarget.name}"? Hệ thống sẽ chặn nếu còn nhân viên thuộc chi nhánh này.`
            : ''
        }
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
