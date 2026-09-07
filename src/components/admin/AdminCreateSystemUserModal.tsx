import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import HrmSelect from '../hr/HrmSelect';
import AdminPasswordField from './AdminPasswordField';
import { showToast } from '../ui/Toast';
import { validatePassword } from '../../lib/validatePassword';
import { validateSystemAccountCode } from '../../lib/admin/suggestedSystemCode';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useCreateAdminUser, useSuggestedSystemCode } from '../../hooks/useAdminUsers';
import type { CreateSystemUserDto, SystemUserRole } from '../../constants/systemUsers';
import { ADMIN_EMAIL_PLACEHOLDER } from '../../constants/branding';

const EMPTY_FORM: CreateSystemUserDto = {
  name: '',
  email: '',
  employeeCode: '',
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

/** Design read: compact ERP create-account modal - identity + system code + role + password. */
export default function AdminCreateSystemUserModal({
  open,
  onClose,
  roleOptions,
}: AdminCreateSystemUserModalProps) {
  const createMutation = useCreateAdminUser();
  const { data: suggestedCode } = useSuggestedSystemCode(open);
  const [form, setForm] = useState(EMPTY_FORM);
  const [codeTouched, setCodeTouched] = useState(false);
  const [createPassword, setCreatePassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !suggestedCode || codeTouched) return;
    setForm(f => (f.employeeCode === suggestedCode ? f : { ...f, employeeCode: suggestedCode }));
  }, [open, suggestedCode, codeTouched]);

  const resetManualForm = () => {
    setForm(EMPTY_FORM);
    setCodeTouched(false);
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
    const codeErr = validateSystemAccountCode(form.employeeCode ?? '');
    if (codeErr) next.employeeCode = codeErr;
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
        employeeCode: form.employeeCode?.trim(),
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
      subtitle="Tài khoản admin hoặc dịch vụ - không gắn hồ sơ nhân viên HR."
      size="md"
      headerCompact
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
      <form id="admin-user-create-form" onSubmit={handleCreate} className="admin-users-create-form modal-form-bordered">
        <FormField label="Họ tên" required error={errors.name}>
          <input
            className="form-input"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nguyễn Văn A"
          />
        </FormField>
        <FormField label="Mã tài khoản" required error={errors.employeeCode}>
          <input
            className="form-input font-mono"
            value={form.employeeCode ?? ''}
            onChange={e => {
              setCodeTouched(true);
              setForm(f => ({ ...f, employeeCode: e.target.value }));
              setErrors(err => ({ ...err, employeeCode: '' }));
            }}
            placeholder="SYS-0001"
            maxLength={50}
            autoComplete="off"
            spellCheck={false}
            aria-label="Mã tài khoản hệ thống"
          />
        </FormField>
        <FormField label="Email" required error={errors.email} className="admin-users-create-form__full">
          <input
            type="email"
            className="form-input"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder={ADMIN_EMAIL_PLACEHOLDER}
          />
        </FormField>
        <FormField label="Vai trò" required error={errors.role} className="admin-users-create-form__full">
          <HrmSelect
            value={form.role}
            onChange={value => setForm(f => ({ ...f, role: value as SystemUserRole }))}
            options={roleOptions}
            placeholder="Chọn vai trò"
            allowEmpty={false}
            aria-label="Vai trò"
          />
        </FormField>
        <div className="admin-users-create-form__full">
          <AdminPasswordField
            value={createPassword}
            onChange={v => { setCreatePassword(v); setErrors(e => ({ ...e, password: '' })); }}
            error={errors.password}
          />
        </div>
      </form>
    </Modal>
  );
}
