import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { KeyRound, UserPlus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { HrmBackButton } from '../../components/hr/HrmPageChrome';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmNotFound, { HrmLoadingState } from '../../components/hr/HrmNotFound';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminPasswordField from '../../components/admin/AdminPasswordField';
import AdminAccountSwitch from '../../components/admin/AdminAccountSwitch';
import HrmSelect from '../../components/hr/HrmSelect';
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
import type { AdminUserRow, AdminUserSource } from '../../services/adminUsersService';
import { type SystemUserRole } from '../../constants/systemUsers';
import { getSessionUser } from '../../constants/systemUsers';
import { isCurrentAdminUserRow } from '../../lib/admin/isCurrentAdminUser';

function parseSource(value: string | null): AdminUserSource {
  return value === 'manual' ? 'manual' : 'employee';
}

function dash(value?: string): string {
  if (!value || value === '—' || value.trim() === '') return '-';
  return value;
}

function statusBadgeClass(user: AdminUserRow): string {
  if (!user.hasAccount) return 'badge badge-pending';
  return user.isActive ? 'badge badge-success' : 'badge badge-error';
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
  const [prevRoleCode, setPrevRoleCode] = useState<string | undefined>(undefined);

  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);

  const sessionUser = getSessionUser();

  if (user?.roleCode !== prevRoleCode) {
    setPrevRoleCode(user?.roleCode);
    setSelectedRole(user?.roleCode ?? '');
  }

  if (isLoading) {
    return (
      <div className="hrm-page admin-user-detail-page">
        <HrmLoadingState />
      </div>
    );
  }
  if (isError || !user) {
    return (
      <HrmNotFound
        message="Không tìm thấy người dùng."
        onBack={() => navigate('/admin/users')}
      />
    );
  }

  const subtitle = user.employeeCode !== '—'
    ? `Mã NV: ${user.employeeCode}`
    : source === 'manual'
      ? 'Tài khoản hệ thống'
      : 'Chưa có mã nhân viên';

  const isSelfAccount = isCurrentAdminUserRow(sessionUser, user);
  const roleDirty = Boolean(user.hasAccount && selectedRole && selectedRole !== user.roleCode);

  const handleToggle = async (next: boolean) => {
    if (!user.hasAccount) return;
    if (!user.canToggle) {
      showToast('warning', 'Nhân viên đã nghỉ việc, không thể bật tài khoản');
      return;
    }
    if (!next && isSelfAccount) {
      showToast('warning', 'Không thể khóa tài khoản đang đăng nhập.');
      return;
    }
    if (!next) {
      setLockConfirmOpen(true);
      return;
    }
    try {
      await toggleMutation.mutateAsync({
        toggleId: user.toggleId,
        enabled: next,
        source: user.source,
      });
      showToast('success', 'Đã bật tài khoản');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  const handleLockConfirm = async () => {
    try {
      await toggleMutation.mutateAsync({
        toggleId: user.toggleId,
        enabled: false,
        source: user.source,
      });
      showToast('success', 'Đã khóa tài khoản');
      setLockConfirmOpen(false);
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

  const toggleTitle = user.isActive && isSelfAccount
    ? 'Không thể khóa tài khoản đang đăng nhập'
    : !user.canToggle
      ? 'Nhân viên đã nghỉ việc'
      : user.isActive
        ? 'Khóa tài khoản'
        : 'Mở khóa tài khoản';

  const toggleHint = !user.canToggle
    ? 'Nhân viên đã nghỉ việc, không thể bật tài khoản.'
    : user.isActive && isSelfAccount
      ? 'Không thể khóa tài khoản đang đăng nhập.'
      : null;

  return (
    <div className="hrm-page admin-user-detail-page">
      <div className="admin-user-detail-chrome">
        <HrmBackButton onBack={() => navigate('/admin/users')} />
        <PageHeader
          title={user.fullName}
          subtitle={subtitle}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {user.canProvision && (
                <button
                  type="button"
                  className="btn btn-primary flex items-center gap-2"
                  onClick={() => setShowProvision(true)}
                >
                  <UserPlus size={16} aria-hidden />
                  Cấp tài khoản
                </button>
              )}
              {user.hasAccount && user.accountUserId && (
                <button
                  type="button"
                  className="btn btn-outline flex items-center gap-2"
                  onClick={() => setShowReset(true)}
                >
                  <KeyRound size={16} aria-hidden />
                  Đặt lại MK
                </button>
              )}
            </div>
          }
        />
      </div>

      <HrmPanel noPadding className="admin-user-detail-board">
        <header className="admin-user-detail-board__head">
          <h2 className="admin-user-detail-board__title">Tài khoản hệ thống</h2>
          <span className={statusBadgeClass(user)}>{user.statusLabel}</span>
        </header>

        <dl className="admin-user-detail-facts">
          <div>
            <dt>Email đăng nhập</dt>
            <dd className="admin-user-detail-facts__mono">{dash(user.email)}</dd>
          </div>
          <div>
            <dt>Số điện thoại</dt>
            <dd>{dash(user.phone)}</dd>
          </div>
          <div>
            <dt>Loại</dt>
            <dd>{source === 'manual' ? 'Tài khoản hệ thống' : 'Nhân viên HR'}</dd>
          </div>
          <div>
            <dt>Bộ phận</dt>
            <dd>{dash(user.department)}</dd>
          </div>
          <div>
            <dt>Chức vụ</dt>
            <dd>{dash(user.position)}</dd>
          </div>
          <div>
            <dt>Ngày tạo / vào làm</dt>
            <dd className="tabular-nums">{dash(formatAdminDateCell(user.createdAt))}</dd>
          </div>
        </dl>

        {user.hasAccount ? (
          <div className="admin-user-detail-actions">
            <div className="admin-user-detail-actions__block">
              <span className="admin-user-detail-actions__label">Tài khoản</span>
              <div className="admin-user-detail-actions__row">
                <AdminAccountSwitch
                  checked={user.isActive}
                  disabled={toggleMutation.isPending || !user.canToggle}
                  onChange={handleToggle}
                  title={toggleTitle}
                />
              </div>
              {toggleHint && (
                <p className="admin-user-detail-actions__hint">{toggleHint}</p>
              )}
            </div>

            <div className="admin-user-detail-actions__block">
              <div className="admin-user-detail-role">
                <span className="admin-user-detail-actions__label" id="admin-user-role-label">Vai trò</span>
                <div className="admin-user-detail-actions__row">
                  <HrmSelect
                    aria-label="Vai trò"
                    value={selectedRole}
                    onChange={setSelectedRole}
                    options={roleOptions}
                    allowEmpty={false}
                    disabled={changeRoleMutation.isPending}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={changeRoleMutation.isPending || !roleDirty}
                    onClick={() => void handleChangeRole()}
                  >
                    {changeRoleMutation.isPending ? 'Đang lưu...' : 'Lưu vai trò'}
                  </button>
                </div>
                {roleDirty && (
                  <p className="admin-user-detail-actions__hint admin-user-detail-actions__dirty">
                    Chưa lưu
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="admin-user-detail-pending">
            Chưa có tài khoản hệ thống.
            {user.canProvision ? ' Dùng Cấp tài khoản ở trên để tạo.' : ''}
          </p>
        )}
      </HrmPanel>

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
        <form id="admin-detail-provision-form" onSubmit={handleProvision} className="space-y-4 modal-form-bordered">
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
        <form id="admin-detail-reset-form" onSubmit={handleReset} className="space-y-4 modal-form-bordered">
          <AdminPasswordField
            value={resetPassword}
            onChange={v => { setResetPassword(v); setResetError(''); }}
            error={resetError}
            label="Mật khẩu mới"
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={lockConfirmOpen}
        onClose={() => setLockConfirmOpen(false)}
        onConfirm={() => void handleLockConfirm()}
        title="Khóa tài khoản"
        message={
          <>
            Bạn có chắc muốn khóa tài khoản{' '}
            <strong className="confirm-dialog__emphasis">{user.fullName}</strong>?
            <br />
            <span className="confirm-dialog__subtext">Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.</span>
          </>
        }
        confirmLabel="Khóa tài khoản"
        cancelLabel="Hủy"
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
}
