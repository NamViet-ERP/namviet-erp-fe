import type React from 'react';
import { useState } from 'react';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import Modal from '../../../components/ui/Modal';
import { showToast } from '../../../components/ui/Toast';
import { useUpdateRole } from '../../../hooks/useRoles';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { isSameRoleLabel, type SystemRole } from '../../../services/rolesService';

interface AdminRoleEditModalProps {
  target: SystemRole | null;
  allRoles: SystemRole[];
  onClose: () => void;
}

export default function AdminRoleEditModal({ target, allRoles, onClose }: AdminRoleEditModalProps) {
  const updateMutation = useUpdateRole();
  const [editLabel, setEditLabel] = useState(target?.label ?? '');

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!target) return;
    const val = editLabel.trim();
    if (!val) {
      showToast('warning', 'Vui lòng nhập tên vai trò');
      return;
    }
    if (val === target.label) {
      onClose();
      return;
    }
    if (allRoles.some(role => role.code !== target.code && isSameRoleLabel(role.label, val))) {
      showToast('warning', 'Tên vai trò đã tồn tại.');
      return;
    }

    try {
      await updateMutation.mutateAsync({ code: target.code, label: val });
      showToast('success', `Đã đổi tên vai trò thành "${val}"`);
      onClose();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể đổi tên vai trò'));
    }
  };

  return (
    <Modal
      isOpen={target !== null}
      onClose={onClose}
      title="Sửa tên vai trò"
      size="sm"
      footer={
        <>
          <Button type="button" variant="outlined" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="filled"
            disabled={updateMutation.isPending}
            onClick={() => void handleSave()}
          >
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </>
      }
    >
      {target && (
        <form id="admin-role-edit-form" onSubmit={handleSave} className="space-y-4 modal-form-bordered">
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
  );
}
