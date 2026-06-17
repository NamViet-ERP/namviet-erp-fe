import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { KeyRound, UserPlus } from 'lucide-react';
import DetailSection from '../../components/hr/DetailSection';
import DetailFieldGrid from '../../components/hr/DetailFieldGrid';
import { FieldView } from '../../components/hr/DetailFields';
import { HrmDetailHeader } from '../../components/hr/HrmPageChrome';
import HrmNotFound, { HrmLoadingState } from '../../components/hr/HrmNotFound';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import AdminPasswordField from '../../components/admin/AdminPasswordField';
import { validatePassword } from '../../lib/validatePassword';
import { showToast } from '../../components/ui/Toast';
import {
  useAdminUser,
  useChangeAdminUserRole,
  useProvisionAdminAccount,
  useResetAdminPassword,
  useToggleAdminUserStatus,
} from '../../hooks/useAdminUsers';
import { useActiveRoleOptions } from '../../hooks/useRoles';
import { formatAdminDateCell } from '../../lib/hrm/formatters';
import { getApiErrorMessage } from '../../lib/apiClient';
import type { AdminUserSource } from '../../services/adminUsersService';
import { type SystemUserRole } from '../../constants/systemUsers';

function parseSource(value: string | null): AdminUserSource {
  return value === 'manual' ? 'manual' : 'employee';
}

interface IOSSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  title?: string;
}

function IOSSwitch({ checked, disabled, onChange, title }: IOSSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => { if (!disabled) onChange(!checked); }}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[var(--md-primary)]' : 'switch-track-off bg-[var(--md-outline)]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      role="switch"
      aria-checked={checked}
      title={title}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full switch-thumb bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const source = parseSource(searchParams.get('source'));
  const navigate = useNavigate();

  const { data: user, isLoading, isError } = useAdminUser(id, source);
  const { data: roleOptions = [] } = useActiveRoleOptions();
  const provisionMutation = useProvisionAdminAccount();
  const resetMutation = useResetAdminPassword();
  const toggleMutation = useToggleAdminUserStatus();
  const changeRoleMutation = useChangeAdminUserRole();

  const [showProvision, setShowProvision] = useState(false);
  const [provisionRole, setProvisionRole] = useState<SystemUserRole>('storekeeper');
  const [provisionPassword, setProvisionPassword] = useState('');
  const [provisionErrors, setProvisionErrors] = useState<Record<string, string>>({});

  const [showReset, setShowReset] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    if (user?.roleCode) setSelectedRole(user.roleCode);
  }, [user?.roleCode]);

  if (isLoading) return <HrmLoadingState />;
  if (isError || !user) {
    return (
      <HrmNotFound
        message="Không tìm thấy người dùng."
        onBack={() => navigate('/admin/users')}
      />
    );
  }

  const title = user.fullName;
  const subtitle = user.employeeCode !== '—'
    ? `Mã NV: ${user.employeeCode}`
    : source === 'manual'
      ? 'Tài khoản hệ thống'
      : 'Chưa có mã nhân viên';

  const handleToggle = async (next: boolean) => {
    if (!user.hasAccount) return;
    if (!user.canToggle) {
      showToast('warning', 'Nhân viên đã nghỉ việc, không thể bật tài khoản');
      return;
    }
    try {
      await toggleMutation.mutateAsync({
        toggleId: user.toggleId,
        enabled: next,
        source: user.source,
      });
      showToast('success', next ? 'Đã bật tài khoản' : 'Đã khóa tài khoản');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const handleChangeRole = async () => {
    if (!user.hasAccount || !selectedRole || selectedRole === user.roleCode) return;
    try {
      await changeRoleMutation.mutateAsync({
        toggleId: user.toggleId,
        source: user.source,
        role: selectedRole,
      });
      showToast('success', 'Đã cập nhật vai trò');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể đổi vai trò'));
    }
  };

  const handleProvision = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
      showToast('success', `Đã cấp tài khoản cho ${user.fullName}`);
      setShowProvision(false);
      setProvisionPassword('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể cấp tài khoản'));
    }
  };

  const handleReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user.accountUserId) return;
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
      showToast('success', 'Đã đặt lại mật khẩu');
      setShowReset(false);
      setResetPassword('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể đặt lại mật khẩu'));
    }
  };

  return (
    <div className="hrm-page w-full">
      <HrmDetailHeader
        onBack={() => navigate('/admin/users')}
        title={title}
        subtitle={subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            {user.canProvision && (
              <button type="button" className="btn btn-primary flex items-center gap-2" onClick={() => setShowProvision(true)}>
                <UserPlus size={16} />
                Cấp tài khoản
              </button>
            )}
            {user.hasAccount && user.accountUserId && (
              <button type="button" className="btn btn-outline flex items-center gap-2" onClick={() => setShowReset(true)}>
                <KeyRound size={16} />
                Đặt lại MK
              </button>
            )}
          </div>
        }
      />

      <DetailSection title="Tài khoản hệ thống">
        <DetailFieldGrid>
          <FieldView label="Loại" value={source === 'manual' ? 'Tài khoản hệ thống' : 'Nhân viên HR'} />
          <FieldView label="Trạng thái" value={user.statusLabel} />
          <FieldView label="Email đăng nhập" value={user.email} />
          <FieldView label="Số điện thoại" value={user.phone} />
          <FieldView label="Bộ phận" value={user.department} />
          <FieldView label="Chức vụ" value={user.position} />
          <FieldView label="Ngày tạo / vào làm" value={formatAdminDateCell(user.createdAt)} />
          <div className="col-span-full flex items-center gap-3 pt-1">
            <span className="text-sm text-[var(--md-on-surface-variant)]">Bật/Tắt tài khoản</span>
            {user.hasAccount ? (
              <IOSSwitch
                checked={user.isActive}
                disabled={toggleMutation.isPending || !user.canToggle}
                onChange={handleToggle}
                title={!user.canToggle ? 'Nhân viên đã nghỉ việc' : undefined}
              />
            ) : (
              <span className="text-sm text-[var(--md-on-surface-variant)]">—</span>
            )}
          </div>
          {user.hasAccount && (
            <div className="col-span-full flex flex-wrap items-end gap-3 pt-2">
              <FormField label="Vai trò hệ thống" className="min-w-[220px] flex-1">
                <select
                  className="form-select"
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  disabled={changeRoleMutation.isPending}
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormField>
              <button
                type="button"
                className="btn btn-primary h-10"
                disabled={changeRoleMutation.isPending || !selectedRole || selectedRole === user.roleCode}
                onClick={handleChangeRole}
              >
                {changeRoleMutation.isPending ? 'Đang lưu...' : 'Lưu vai trò'}
              </button>
            </div>
          )}
        </DetailFieldGrid>
      </DetailSection>

      <Modal
        isOpen={showProvision}
        onClose={() => { setShowProvision(false); setProvisionPassword(''); setProvisionErrors({}); }}
        title="Cấp tài khoản"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowProvision(false)}>Hủy</button>
            <button type="button" className="btn btn-primary" disabled={provisionMutation.isPending} onClick={() => void handleProvision()}>
              {provisionMutation.isPending ? 'Đang lưu...' : 'Cấp tài khoản'}
            </button>
          </>
        }
      >
        <form id="admin-detail-provision-form" onSubmit={handleProvision} className="space-y-4">
          <FormField label="Vai trò hệ thống" required>
            <select className="form-select" value={provisionRole} onChange={e => setProvisionRole(e.target.value as SystemUserRole)}>
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <AdminPasswordField value={provisionPassword} onChange={setProvisionPassword} error={provisionErrors.password} />
        </form>
      </Modal>

      <Modal
        isOpen={showReset}
        onClose={() => { setShowReset(false); setResetPassword(''); setResetError(''); }}
        title="Đặt lại mật khẩu"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setShowReset(false)}>Hủy</button>
            <button type="button" className="btn btn-primary" disabled={resetMutation.isPending} onClick={() => void handleReset()}>
              {resetMutation.isPending ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </button>
          </>
        }
      >
        <form id="admin-detail-reset-form" onSubmit={handleReset} className="space-y-4">
          <AdminPasswordField
            value={resetPassword}
            onChange={v => { setResetPassword(v); setResetError(''); }}
            error={resetError}
            label="Mật khẩu mới"
          />
        </form>
      </Modal>
    </div>
  );
}
