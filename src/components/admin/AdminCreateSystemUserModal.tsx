import { useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import HrmSelect from '../hr/HrmSelect';
import AdminPasswordField from './AdminPasswordField';
import { showToast } from '../ui/Toast';
import { validatePassword } from '../../lib/validatePassword';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useCreateAdminUser } from '../../hooks/useAdminUsers';
import type { CreateSystemUserDto, SystemUserRole } from '../../constants/systemUsers';

const EMPTY_FORM: CreateSystemUserDto = {
  name: '',
  email: '',
  role: 'storekeeper',
};

interface RoleOption {
  value: string;
  label: string;
}

interface AdminCreateSystemUserModalProps {
  open: boolean;
  onClose: () => void;
  roleOptions: RoleOption[];
}

/** Design read: compact ERP create-account modal - identity + role + password only. */
export default function AdminCreateSystemUserModal({
  open,
  onClose,
  roleOptions,
}: AdminCreateSystemUserModalProps) {
  const createMutation = useCreateAdminUser();
  const [form, setForm] = useState(EMPTY_FORM);
  const [createPassword, setCreatePassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetManualForm = () => {
    setForm(EMPTY_FORM);
    setCreatePassword('');
    setErrors({});
  };

  const close = () => {
    resetManualForm();
    onClose();
  };

  const validateManualForm = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Vui lòng nhập họ tên';
    if (!form.email.trim()) next.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Email không hợp lệ';
    if (!form.role) next.role = 'Vui lòng chọn vai trò';
    const passErr = validatePassword(createPassword);
    if (passErr) next.password = passErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateManualForm()) {
      showToast('warning', 'Vui lòng kiểm tra lại thông tin');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: form.name,
        email: form.email,
        role: form.role,
        password: createPassword,
      });
      showToast('success', 'Đã thêm tài khoản hệ thống - gửi mật khẩu cho người dùng qua kênh nội bộ');
      close();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm tài khoản'));
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title="Thêm tài khoản hệ thống"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={close}>
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={createMutation.isPending}
            onClick={() => void handleCreate()}
          >
            {createMutation.isPending ? 'Đang lưu...' : 'Thêm'}
          </button>
        </>
      }
    >
      <form id="admin-user-create-form" onSubmit={handleCreate} className="space-y-4 modal-form-bordered">
        <p className="text-sm text-[var(--md-on-surface-variant)]">
          Dùng cho tài khoản admin, dịch vụ - không gắn hồ sơ nhân viên HR.
        </p>
        <FormField label="Họ tên" required error={errors.name}>
          <input
            className="form-input"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nguyễn Văn A"
          />
        </FormField>
        <FormField label="Email" required error={errors.email}>
          <input
            type="email"
            className="form-input"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="email@namviet.vn"
          />
        </FormField>
        <FormField label="Vai trò" required error={errors.role}>
          <HrmSelect
            value={form.role}
            onChange={value => setForm(f => ({ ...f, role: value as SystemUserRole }))}
            options={roleOptions}
            placeholder="Chọn vai trò"
            allowEmpty={false}
            aria-label="Vai trò"
          />
        </FormField>
        <AdminPasswordField
          value={createPassword}
          onChange={v => { setCreatePassword(v); setErrors(e => ({ ...e, password: '' })); }}
          error={errors.password}
        />
      </form>
    </Modal>
  );
}
