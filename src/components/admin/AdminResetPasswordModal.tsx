import type React from 'react';
import { useState } from 'react';
import Modal from '../ui/Modal';
import AdminPasswordField from './AdminPasswordField';
import { showToast } from '../ui/Toast';
import { validatePassword } from '../../lib/validatePassword';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useResetAdminPassword } from '../../hooks/useAdminUsers';
import type { AdminUserRow } from '../../services/adminUsersService';

interface AdminResetPasswordModalProps {
  user: AdminUserRow | null;
  onClose: () => void;
}

export default function AdminResetPasswordModal({ user, onClose }: AdminResetPasswordModalProps) {
  const resetMutation = useResetAdminPassword();
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const close = () => {
    setResetPassword('');
    setResetError('');
    onClose();
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user?.accountUserId) return;

    const passErr = validatePassword(resetPassword);
    if (passErr) {
      setResetError(passErr);
      showToast('warning', passErr);
      return;
    }

    try {
      await resetMutation.mutateAsync({
        accountUserId: user.accountUserId,
        password: resetPassword,
      });
      showToast('success', `Đã đặt lại mật khẩu cho ${user.fullName}`);
      close();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể đặt lại mật khẩu'));
    }
  };

  return (
    <Modal
      isOpen={!!user}
      onClose={close}
      title="Đặt lại mật khẩu"
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={close}>Hủy</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={resetMutation.isPending}
            onClick={() => void handleResetPassword()}
          >
            {resetMutation.isPending ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
          </button>
        </>
      }
    >
      {user && (
        <form id="admin-reset-password-form" onSubmit={handleResetPassword} className="space-y-4 modal-form-bordered">
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            Tài khoản: <strong>{user.fullName}</strong> ({user.email})
          </p>
          <AdminPasswordField
            value={resetPassword}
            onChange={v => { setResetPassword(v); setResetError(''); }}
            error={resetError}
            label="Mật khẩu mới"
          />
        </form>
      )}
    </Modal>
  );
}
