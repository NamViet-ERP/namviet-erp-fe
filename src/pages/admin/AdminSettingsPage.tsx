import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Plus, Trash2, UserCog, Pencil, KeyRound } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import HrmPanel from '../../components/hr/HrmPanel';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_LOADING } from '../../lib/uiMessages';
import type { SystemRole } from '../../services/rolesService';
import { useRoles, useCreateRole, useDeleteRole, useToggleRoleStatus, useUpdateRole } from '../../hooks/useRoles';

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [label, setLabel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ code: string; label: string } | null>(null);
  const [editTarget, setEditTarget] = useState<SystemRole | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const { data: roles = [], isLoading } = useRoles({ search: searchTerm || undefined });
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();
  const toggleMutation = useToggleRoleStatus();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = label.trim();
    if (!val) {
      showToast('warning', 'Vui lòng nhập tên vai trò');
      return;
    }

    try {
      await createMutation.mutateAsync({ label: val });
      showToast('success', `Đã thêm vai trò "${val}"`);
      setLabel('');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm vai trò'));
    }
  };

  const handleToggle = async (roleCode: string) => {
    try {
      await toggleMutation.mutateAsync(roleCode);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.code);
      showToast('success', `Đã xóa vai trò "${deleteTarget.label}"`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể xóa vai trò'));
    }
  };

  const openEdit = (role: SystemRole) => {
    setEditTarget(role);
    setEditLabel(role.label);
  };

  const handleEditSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editTarget) return;
    const val = editLabel.trim();
    if (!val) {
      showToast('warning', 'Vui lòng nhập tên vai trò');
      return;
    }
    if (val === editTarget.label) {
      setEditTarget(null);
      return;
    }

    try {
      await updateMutation.mutateAsync({ code: editTarget.code, label: val });
      showToast('success', `Đã đổi tên vai trò thành "${val}"`);
      setEditTarget(null);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể đổi tên vai trò'));
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        eyebrow="Admin"
        title="Thiết lập vai trò"
        subtitle="Tạo và quản lý vai trò hệ thống dùng khi phân quyền người dùng."
      />

      <div className="hrm-settings-grid hrm-settings-grid--recruitment">
        <HrmPanel className="hrm-settings-card hrm-settings-card--featured">
          <div className="hrm-settings-card__head">
            <div className="hrm-settings-card__icon hrm-settings-card__icon--primary">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="hrm-settings-card__title">Danh sách vai trò</h2>
              <p className="hrm-settings-card__desc">
                Sửa tên, bật/tắt hoặc xóa vai trò — vai trò tắt sẽ không hiện khi cấp tài khoản.
              </p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="hrm-recruitment-add-form hrm-admin-role-add-form">
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Tên vai trò (VD: Trưởng phòng Kho)"
              className="hrm-field-input flex-1"
              disabled={createMutation.isPending}
            />
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2 rounded-xl px-4 h-10 shrink-0"
              disabled={createMutation.isPending}
            >
              <Plus size={18} />
              Thêm
            </button>
          </form>

          <div className="hrm-recruitment-position-search">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tìm theo tên vai trò..."
            />
          </div>

          {isLoading ? (
            <div className="hrm-recruitment-positions-empty">{UI_LOADING.roles}</div>
          ) : roles.length === 0 ? (
            <div className="hrm-recruitment-positions-empty">
              {searchTerm ? 'Không tìm thấy vai trò phù hợp.' : 'Chưa có vai trò nào.'}
            </div>
          ) : (
            <div className="hrm-recruitment-positions-grid">
              {roles.map(role => (
                <div
                  key={role.code}
                  className={`hrm-recruitment-position-card hrm-admin-role-card hrm-admin-role-card--stacked${role.isActive ? '' : ' hrm-recruitment-position-card--inactive'}`}
                >
                  <div className="hrm-admin-role-card__text min-w-0">
                    <span className="hrm-recruitment-position-card__name" title={role.label}>
                      {role.label}
                    </span>
                  </div>
                  <div className="hrm-admin-role-card__toolbar">
                    <div className="hrm-admin-role-card__tool-group">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/settings/roles/${encodeURIComponent(role.code)}/permissions`)}
                        className="hrm-admin-role-card__tool"
                        title="Ma trận quyền"
                        aria-label={`Ma trận quyền ${role.label}`}
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(role)}
                        className="hrm-admin-role-card__tool"
                        title="Sửa tên vai trò"
                        aria-label={`Sửa tên vai trò ${role.label}`}
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                    <span className="hrm-admin-role-card__tool-divider" aria-hidden />
                    <button
                      type="button"
                      onClick={() => handleToggle(role.code)}
                      className={`hrm-toggle-switch hrm-admin-role-card__toggle${role.isActive ? ' hrm-toggle-switch--on' : ''}`}
                      role="switch"
                      aria-checked={role.isActive}
                      title={role.isActive ? 'Đang bật' : 'Đang tắt'}
                    >
                      <span className="hrm-toggle-switch__thumb" aria-hidden />
                    </button>
                    <span className="hrm-admin-role-card__tool-divider" aria-hidden />
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ code: role.code, label: role.label })}
                      className="hrm-admin-role-card__tool hrm-admin-role-card__tool--danger"
                      title="Xóa vai trò"
                      aria-label={`Xóa vai trò ${role.label}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="hrm-recruitment-positions-meta">
            Tổng <strong>{roles.length}</strong> vai trò
            {searchTerm && (
              <> · Đang lọc theo &ldquo;{searchTerm}&rdquo;</>
            )}
          </p>
        </HrmPanel>

        <HrmPanel className="hrm-settings-card">
          <div className="hrm-settings-card__head">
            <div className="hrm-settings-card__icon hrm-settings-card__icon--neutral">
              <UserCog size={20} />
            </div>
            <div>
              <h2 className="hrm-settings-card__title">Hướng dẫn vận hành</h2>
            </div>
          </div>
          <ul className="hrm-settings-list">
            <li><strong>Quyền hạn:</strong> Mở ma trận quyền theo catalog hệ thống (61 quyền pilot).</li>
            <li><strong>Sửa tên:</strong> Chỉ đổi tên hiển thị — quyền và người dùng đang gán không đổi.</li>
            <li><strong>Bật:</strong> Vai trò hiển thị khi cấp tài khoản hoặc đổi quyền.</li>
            <li><strong>Tắt:</strong> Ẩn khỏi danh sách chọn — không xóa người dùng đang dùng vai trò đó.</li>
            <li><strong>Xóa:</strong> Gỡ vai trò khỏi hệ thống; chỉ thực hiện khi không còn gán cho ai.</li>
          </ul>
          <Link to="/admin/users" className="hrm-settings-link">
            <UserCog size={15} />
            Đi tới quản lý người dùng
          </Link>
        </HrmPanel>
      </div>

      <Modal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Sửa tên vai trò"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setEditTarget(null)}>Hủy</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={updateMutation.isPending}
              onClick={() => void handleEditSave()}
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        {editTarget && (
          <form id="admin-role-edit-form" onSubmit={handleEditSave} className="space-y-4 modal-form-bordered">
            <FormField label="Tên vai trò" required>
              <input
                className="form-input"
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                placeholder="VD: Admin"
                autoFocus
              />
            </FormField>
            <p className="text-xs text-[var(--md-on-surface-variant)]">
              Chỉ đổi tên hiển thị. Quyền hệ thống và tài khoản đang dùng vai trò này không thay đổi.
            </p>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa vai trò"
        message={
          <>
            Bạn có chắc muốn xóa vai trò{' '}
            <strong className="confirm-dialog__emphasis">&ldquo;{deleteTarget?.label}&rdquo;</strong>?
            <br />
            <span className="confirm-dialog__subtext">Hành động này không thể hoàn tác.</span>
          </>
        }
        confirmLabel="Xóa vĩnh viễn"
        cancelLabel="Hủy bỏ"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
