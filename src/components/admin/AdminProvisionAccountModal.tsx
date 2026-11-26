import type React from 'react';
import { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import SelectField from '../ui/SelectField';
import AdminPasswordField from './AdminPasswordField';
import { showToast } from '../ui/Toast';
import { validatePassword } from '../../lib/validatePassword';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useProvisionAdminAccount } from '../../hooks/useAdminUsers';
import type { SystemUserRole } from '../../constants/systemUsers';
import type { AdminUserRow } from '../../services/adminUsersService';

interface RoleOption {
  value: string;
  label: string;
}

interface AdminProvisionAccountModalProps {
  user: AdminUserRow | null;
  onClose: () => void;
  roleOptions: RoleOption[];
}

export default function AdminProvisionAccountModal({
  user,
  onClose,
  roleOptions,
}: AdminProvisionAccountModalProps) {
  const provisionMutation = useProvisionAdminAccount();
  const [provisionRole, setProvisionRole] = useState<SystemUserRole>('storekeeper');
  const [provisionPassword, setProvisionPassword] = useState('');
  const [provisionErrors, setProvisionErrors] = useState<Record<string, string>>({});

  const close = () => {
    setProvisionPassword('');
    setProvisionErrors({});
    setProvisionRole('storekeeper');
    onClose();
  };

  const handleProvision = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return;

    const next: Record<string, string> = {};
    const passErr = validatePassword(provisionPassword);
    if (passErr) next.password = passErr;
    setProvisionErrors(next);
    if (Object.keys(next).length > 0) {
      showToast('warning', passErr ?? 'Vui lòng kiểm tra lại mật khẩu');
      return;
    }

    try {
      await provisionMutation.mutateAsync({
        employeeId: user.id,
        role: provisionRole,
        password: provisionPassword,
      });
      showToast('success', `Đã cấp tài khoản cho ${user.fullName} — gửi mật khẩu qua kênh nội bộ`);
      close();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể cấp tài khoản'));
    }
  };

  return (
    <Modal
      isOpen={!!user}
      onClose={close}
      title="Cấp tài khoản"
      size="xl"
      footer={
        <>
          <Button type="button" variant="outlined" onClick={close}>Hủy</Button>
          <Button
            type="button"
            variant="filled"
            disabled={provisionMutation.isPending}
            onClick={() => void handleProvision()}
          >
            {provisionMutation.isPending ? 'Đang lưu...' : 'Cấp tài khoản'}
          </Button>
        </>
      }
    >
      {user && (
        <form id="admin-provision-form" onSubmit={handleProvision} className="space-y-4 modal-form-bordered">
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            Thông tin lấy từ hồ sơ HR — admin chỉ chọn vai trò và đặt mật khẩu ban đầu.
          </p>
          <FormField label="Họ tên">
            <input className="form-input" value={user.fullName} readOnly />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Mã nhân viên">
              <input className="form-input" value={user.employeeCode} readOnly />
            </FormField>
            <FormField label="Email">
              <input className="form-input" value={user.email} readOnly />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Bộ phận">
              <input className="form-input" value={user.department} readOnly />
            </FormField>
            <FormField label="Chức vụ">
              <input className="form-input" value={user.position} readOnly />
            </FormField>
          </div>
          <SelectField
            variant="form"
            label="Vai trò hệ thống"
            required
            aria-label="Vai trò hệ thống"
            value={provisionRole}
            onChange={v => setProvisionRole(v as SystemUserRole)}
            options={roleOptions}
          />
          <AdminPasswordField
            value={provisionPassword}
            onChange={v => { setProvisionPassword(v); setProvisionErrors(e => ({ ...e, password: '' })); }}
            error={provisionErrors.password}
          />
        </form>
      )}
    </Modal>
  );
}
