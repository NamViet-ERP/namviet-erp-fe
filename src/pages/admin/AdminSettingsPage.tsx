import { useState } from 'react';
import { Shield, Plus, Trash2, Search } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../components/ui/Toast';
import { useRoles, useCreateRole, useDeleteRole, useToggleRoleStatus } from '../../hooks/useRoles';

export default function AdminSettingsPage() {
  const [label, setLabel] = useState('');
  const [code, setCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ code: string; label: string } | null>(null);

  const { data: roles = [], isLoading } = useRoles({ search: searchTerm || undefined });
  const createMutation = useCreateRole();
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
      await createMutation.mutateAsync({
        label: val,
        code: code.trim() || undefined,
      });
      showToast('success', `Đã thêm vai trò "${val}"`);
      setLabel('');
      setCode('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể thêm vai trò';
      showToast('error', message);
    }
  };

  const handleToggle = async (roleCode: string) => {
    try {
      await toggleMutation.mutateAsync(roleCode);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể thay đổi trạng thái';
      showToast('error', message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.code);
      showToast('success', `Đã xóa vai trò "${deleteTarget.label}"`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể xóa vai trò';
      showToast('error', message);
    }
  };

  const filtered = roles;

  return (
    <div className="animate-fade-in hrm-page">
      <PageHeader eyebrow="" title="THIẾT LẬP VAI TRÒ" subtitle="Tạo và quản lý vai trò hệ thống dùng khi phân quyền người dùng" />

      <div className="rounded-2xl p-6 shadow-card max-w-4xl" style={{ background: 'var(--md-surface-container)', border: '1px solid var(--md-outline-variant)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--md-primary-container)', border: '1px solid var(--md-outline-variant)' }}>
            <Shield size={20} style={{ color: 'var(--md-primary)' }} />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: 'var(--md-on-surface)' }}>Danh sách vai trò</h3>
            <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Bật/tắt hoặc xóa vai trò — vai trò tắt sẽ không hiện khi thêm người dùng</p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 mb-6">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Tên vai trò (vd. Trưởng phòng Kho)"
            className="hrm-field-input"
            disabled={createMutation.isPending}
          />
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Mã (tùy chọn)"
            className="hrm-field-input font-mono text-sm"
            disabled={createMutation.isPending}
          />
          <button type="submit" className="btn btn-primary flex items-center justify-center gap-2 px-5" disabled={createMutation.isPending}>
            <Plus size={18} />
            <span>Thêm</span>
          </button>
        </form>

        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-3 flex items-center text-[var(--md-on-surface-variant)]">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã vai trò..."
            className="hrm-field-input pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
            {searchTerm ? 'Không tìm thấy vai trò phù hợp.' : 'Chưa có vai trò nào.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
            {filtered.map(role => (
              <div
                key={role.code}
                className={`admin-role-card flex items-center justify-between p-3 transition-all ${role.isActive ? '' : 'admin-role-card--inactive'}`}
              >
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--md-on-surface)' }}>{role.label}</p>
                  <p className="text-xs font-mono truncate" style={{ color: 'var(--md-on-surface-variant)' }}>{role.code}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(role.code)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${role.isActive ? 'bg-[var(--md-primary)]' : 'switch-track-off bg-[var(--md-outline)]'}`}
                    role="switch"
                    aria-checked={role.isActive}
                    title={role.isActive ? 'Đang bật' : 'Đang tắt'}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full switch-thumb bg-white shadow ring-0 transition duration-200 ease-in-out ${role.isActive ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ code: role.code, label: role.label })}
                    className="text-[var(--md-error)] p-1 rounded-lg hover:bg-[var(--md-error-container)] transition-colors"
                    title="Xóa vai trò"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 flex justify-between items-center text-xs" style={{ borderTop: '1px solid var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}>
          <span>Tổng số: <strong>{roles.length}</strong> vai trò</span>
          {searchTerm && <span>Tìm thấy: <strong>{filtered.length}</strong></span>}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa vai trò"
        message={
          <>
            Bạn có chắc muốn xóa vai trò{' '}
            <strong style={{ color: 'var(--md-on-surface)' }}>&ldquo;{deleteTarget?.label}&rdquo;</strong>?
            <br />
            <span style={{ fontSize: '0.8125rem', opacity: 0.85 }}>Hành động này không thể hoàn tác.</span>
          </>
        }
        confirmLabel="Xóa vĩnh viễn"
        cancelLabel="Hủy bỏ"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
