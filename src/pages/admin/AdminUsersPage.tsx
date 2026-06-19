import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, UserCog, UserCheck, UserX, UserPlus, KeyRound } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import AdminPasswordField from '../../components/admin/AdminPasswordField';
import { validatePassword } from '../../lib/validatePassword';
import { showToast } from '../../components/ui/Toast';
import {
  type CreateSystemUserDto,
  type SystemUserRole,
} from '../../constants/systemUsers';
import {
  adminUsersListQueryKey,
  useAdminUsers,
  useCreateAdminUser,
  useProvisionAdminAccount,
  useResetAdminPassword,
  useToggleAdminUserStatus,
} from '../../hooks/useAdminUsers';
import { useActiveRoleOptions } from '../../hooks/useRoles';
import { formatAdminDateCell } from '../../lib/hrm/formatters';
import { getApiErrorMessage } from '../../lib/apiClient';
import type { AdminUserListParams, AdminUserRow, AdminUserSource } from '../../services/adminUsersService';

const TABLE_HEADERS = [
  'Mã nhân viên',
  'Họ tên',
  'Email',
  'Số điện thoại',
  'Bộ phận',
  'Chức vụ',
  'Vai trò',
  'Trạng thái',
  'Ngày tạo',
  'Bật/Tắt',
  'Thao tác',
] as const;

type QuickFilter = 'all' | 'pending';
type AccountStatusFilter = '' | 'pending' | 'active' | 'locked';
type SourceFilter = '' | 'employee' | 'manual';

const EMPTY_FORM: CreateSystemUserDto = {
  name: '',
  email: '',
  phone: '',
  employeeCode: '',
  department: '',
  position: '',
  role: 'storekeeper',
};

function statusBadgeClass(user: AdminUserRow): string {
  if (!user.hasAccount) return 'hrm-badge hrm-badge--neutral';
  return user.isActive ? 'hrm-badge hrm-badge--success' : 'hrm-badge hrm-badge--warning';
}

interface AccountSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  title?: string;
}

function AccountSwitch({ checked, disabled, onChange, title }: AccountSwitchProps) {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      className={`hrm-toggle-switch${checked ? ' hrm-toggle-switch--on' : ''}`}
      role="switch"
      aria-checked={checked}
      title={title ?? (checked ? 'Đang bật' : 'Đang tắt')}
    >
      <span className="hrm-toggle-switch__thumb" aria-hidden />
    </button>
  );
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<AccountStatusFilter>('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const resetPaging = () => setPage(1);

  const listParams = useMemo<AdminUserListParams>(() => ({
    page,
    pageSize,
    search: search || undefined,
    pendingOnly: quickFilter === 'pending',
    accountStatus: accountStatusFilter || undefined,
    source: sourceFilter || undefined,
    department: departmentFilter || undefined,
  }), [page, pageSize, search, quickFilter, accountStatusFilter, sourceFilter, departmentFilter]);

  const { data, isLoading, isError, error } = useAdminUsers(listParams);

  const users = data?.items ?? [];
  const summary = data?.summary;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hasFilters = Boolean(
    search || departmentFilter || accountStatusFilter || sourceFilter || quickFilter !== 'all',
  );

  const resetFilters = () => {
    setSearch('');
    setDepartmentFilter('');
    setAccountStatusFilter('');
    setSourceFilter('');
    setQuickFilter('all');
    setPage(1);
  };

  const { data: roleOptions = [] } = useActiveRoleOptions();
  const toggleMutation = useToggleAdminUserStatus(listParams);
  const createMutation = useCreateAdminUser();
  const provisionMutation = useProvisionAdminAccount();
  const resetMutation = useResetAdminPassword();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createPassword, setCreatePassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [provisionTarget, setProvisionTarget] = useState<AdminUserRow | null>(null);
  const [provisionRole, setProvisionRole] = useState<SystemUserRole>('storekeeper');
  const [provisionPassword, setProvisionPassword] = useState('');
  const [provisionErrors, setProvisionErrors] = useState<Record<string, string>>({});

  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const validateManualForm = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Vui lòng nhập họ tên';
    if (!form.email.trim()) next.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Email không hợp lệ';
    const passErr = validatePassword(createPassword);
    if (passErr) next.password = passErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetManualForm = () => {
    setForm(EMPTY_FORM);
    setCreatePassword('');
    setErrors({});
  };

  const openProvision = (user: AdminUserRow) => {
    setProvisionTarget(user);
    setProvisionRole('storekeeper');
    setProvisionPassword('');
    setProvisionErrors({});
  };

  const closeProvision = () => {
    setProvisionTarget(null);
    setProvisionPassword('');
    setProvisionErrors({});
  };

  const openReset = (user: AdminUserRow) => {
    setResetTarget(user);
    setResetPassword('');
    setResetError('');
  };

  const handleRowClick = (user: AdminUserRow) => {
    navigate(`/admin/users/${user.id}?source=${user.source}`);
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateManualForm()) {
      showToast('warning', 'Vui lòng kiểm tra lại thông tin');
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...form,
        phone: form.phone?.trim() || undefined,
        employeeCode: form.employeeCode?.trim() || undefined,
        department: form.department?.trim() || undefined,
        position: form.position?.trim() || undefined,
        password: createPassword,
      });
      showToast('success', 'Đã thêm tài khoản hệ thống — gửi mật khẩu cho người dùng qua kênh nội bộ');
      setShowCreate(false);
      resetManualForm();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể thêm tài khoản'));
    }
  };

  const handleProvision = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!provisionTarget) return;

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
        employeeId: provisionTarget.id,
        role: provisionRole,
        password: provisionPassword,
      });
      showToast('success', `Đã cấp tài khoản cho ${provisionTarget.fullName} — gửi mật khẩu qua kênh nội bộ`);
      closeProvision();
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể cấp tài khoản'));
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!resetTarget?.accountUserId) return;

    const passErr = validatePassword(resetPassword);
    if (passErr) {
      setResetError(passErr);
      showToast('warning', passErr);
      return;
    }

    try {
      await resetMutation.mutateAsync({
        accountUserId: resetTarget.accountUserId,
        password: resetPassword,
      });
      showToast('success', `Đã đặt lại mật khẩu cho ${resetTarget.fullName}`);
      setResetTarget(null);
      setResetPassword('');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể đặt lại mật khẩu'));
    }
  };

  const handleToggle = async (
    toggleId: string,
    source: AdminUserSource,
    next: boolean,
    canToggle: boolean,
    hasAccount: boolean,
  ) => {
    if (!hasAccount) return;
    if (!canToggle) {
      showToast('warning', 'Nhân viên đã nghỉ việc, không thể bật tài khoản');
      return;
    }
    try {
      await toggleMutation.mutateAsync({ toggleId, enabled: next, source });
      const updated = qc.getQueryData(adminUsersListQueryKey(listParams));
      if (updated?.page && updated.page !== page) setPage(updated.page);
      showToast('success', next ? 'Đã bật tài khoản' : 'Đã khóa tài khoản');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Quản lý tài khoản người dùng"
        subtitle="Bấm dòng để xem chi tiết và quản lý tài khoản trong phạm vi Admin."
        actions={
          <button
            type="button"
            className="btn btn-primary flex items-center gap-2 rounded-full px-5"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            Thêm tài khoản hệ thống
          </button>
        }
      />

      <div className="hrm-stat-grid">
        <HrmStatCard label="Tổng dòng" value={summary?.total ?? 0} icon={UserCog} tone="primary" />
        <HrmStatCard label="Chờ cấp tài khoản" value={summary?.pending ?? 0} icon={UserPlus} tone="warning" />
        <HrmStatCard label="Đang hoạt động" value={summary?.active ?? 0} icon={UserCheck} tone="success" />
        <HrmStatCard label="Đã khóa" value={summary?.inactive ?? 0} icon={UserX} tone="warning" />
      </div>

      <HrmPanel noPadding>
        <div className="hrm-list-toolbar">
          <div className="hrm-list-toolbar__filters">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); resetPaging(); }}
              placeholder="Tìm theo tên, mã NV, email..."
            />
            <div className="hrm-list-toolbar__filters-right">
              <input
                className="hrm-filter-input-inline"
                value={departmentFilter}
                onChange={e => { setDepartmentFilter(e.target.value); resetPaging(); }}
                placeholder="Bộ phận"
                aria-label="Lọc bộ phận"
              />
              <div className="hrm-filter-select-wrap">
                <select
                  className="hrm-filter-select"
                  value={accountStatusFilter}
                  onChange={e => { setAccountStatusFilter(e.target.value as AccountStatusFilter); resetPaging(); }}
                  aria-label="Lọc trạng thái tài khoản"
                >
                  <option value="">Tất cả trạng thái TK</option>
                  <option value="pending">Chưa cấp tài khoản</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="locked">Đã khóa</option>
                </select>
              </div>
              <div className="hrm-filter-select-wrap">
                <select
                  className="hrm-filter-select"
                  value={sourceFilter}
                  onChange={e => { setSourceFilter(e.target.value as SourceFilter); resetPaging(); }}
                  aria-label="Lọc nguồn"
                >
                  <option value="">Tất cả nguồn</option>
                  <option value="employee">Nhân viên HR</option>
                  <option value="manual">Tài khoản hệ thống</option>
                </select>
              </div>
              <div className="hrm-filter-quick-chips" role="group" aria-label="Lọc nhanh">
                <button
                  type="button"
                  className={`hrm-status-chip${quickFilter === 'all' ? ' hrm-status-chip--active' : ''}`}
                  onClick={() => { setQuickFilter('all'); resetPaging(); }}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  className={`hrm-status-chip${quickFilter === 'pending' ? ' hrm-status-chip--active' : ''}`}
                  onClick={() => { setQuickFilter('pending'); resetPaging(); }}
                >
                  Chờ cấp TK
                </button>
              </div>
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="hrm-filter-reset">
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full min-w-max border-collapse hrm-table">
            <thead>
              <tr>
                {TABLE_HEADERS.map(h => (
                  <th key={h} className="table-header-cell whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                    <td colSpan={TABLE_HEADERS.length}><div className="hrm-table-skeleton" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length}>
                    <EmptyState message={`Không tải được danh sách: ${getApiErrorMessage(error)}`} icon={UserX} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length}>
                    <EmptyState
                      message={hasFilters ? 'Không có tài khoản phù hợp bộ lọc.' : 'Chưa có dữ liệu người dùng.'}
                      icon={UserCog}
                    />
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={`${user.source}-${user.id}`}
                    className="table-row hrm-table-row--interactive"
                    onClick={() => handleRowClick(user)}
                    title="Xem chi tiết"
                  >
                    <td className="table-cell font-mono text-sm text-[var(--md-primary)]">{user.employeeCode}</td>
                    <td className="table-cell member-name">{user.fullName}</td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell whitespace-nowrap">{user.phone}</td>
                    <td className="table-cell">{user.department}</td>
                    <td className="table-cell">{user.position}</td>
                    <td className="table-cell">{user.role}</td>
                    <td className="table-cell">
                      <span className={statusBadgeClass(user)}>{user.statusLabel}</span>
                    </td>
                    <td className="table-cell whitespace-nowrap">{formatAdminDateCell(user.createdAt)}</td>
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      {user.hasAccount ? (
                        <AccountSwitch
                          checked={user.isActive}
                          disabled={toggleMutation.isPending || !user.canToggle}
                          onChange={n => handleToggle(user.toggleId, user.source, n, user.canToggle, user.hasAccount)}
                          title={
                            !user.canToggle
                              ? 'Nhân viên đã nghỉ việc'
                              : user.isActive
                                ? 'Khóa tài khoản'
                                : 'Mở khóa tài khoản'
                          }
                        />
                      ) : (
                        <span className="text-xs text-[var(--md-on-surface-variant)]">—</span>
                      )}
                    </td>
                    <td className="table-cell whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {user.canProvision && (
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => openProvision(user)}>
                            Cấp tài khoản
                          </button>
                        )}
                        {user.hasAccount && user.accountUserId && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline flex items-center gap-1"
                            onClick={() => openReset(user)}
                          >
                            <KeyRound size={14} />
                            Đặt lại MK
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && !isLoading && (
          <Pagination
            embedded
            itemLabel="tài khoản"
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          />
        )}
      </HrmPanel>

      <Modal
        isOpen={!!provisionTarget}
        onClose={closeProvision}
        title="Cấp tài khoản"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={closeProvision}>Hủy</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={provisionMutation.isPending}
              onClick={() => void handleProvision()}
            >
              {provisionMutation.isPending ? 'Đang lưu...' : 'Cấp tài khoản'}
            </button>
          </>
        }
      >
        {provisionTarget && (
          <form id="admin-provision-form" onSubmit={handleProvision} className="space-y-4">
            <p className="text-sm text-[var(--md-on-surface-variant)]">
              Thông tin lấy từ hồ sơ HR — admin chỉ chọn vai trò và đặt mật khẩu ban đầu.
            </p>
            <FormField label="Họ tên">
              <input className="form-input bg-[var(--md-surface-container-low)]" value={provisionTarget.fullName} readOnly />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Mã nhân viên">
                <input className="form-input bg-[var(--md-surface-container-low)]" value={provisionTarget.employeeCode} readOnly />
              </FormField>
              <FormField label="Email">
                <input className="form-input bg-[var(--md-surface-container-low)]" value={provisionTarget.email} readOnly />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Bộ phận">
                <input className="form-input bg-[var(--md-surface-container-low)]" value={provisionTarget.department} readOnly />
              </FormField>
              <FormField label="Chức vụ">
                <input className="form-input bg-[var(--md-surface-container-low)]" value={provisionTarget.position} readOnly />
              </FormField>
            </div>
            <FormField label="Vai trò hệ thống" required>
              <select
                className="form-select"
                value={provisionRole}
                onChange={e => setProvisionRole(e.target.value as SystemUserRole)}
              >
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
            <AdminPasswordField
              value={provisionPassword}
              onChange={v => { setProvisionPassword(v); setProvisionErrors(e => ({ ...e, password: '' })); }}
              error={provisionErrors.password}
            />
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Đặt lại mật khẩu"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setResetTarget(null)}>Hủy</button>
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
        {resetTarget && (
          <form id="admin-reset-password-form" onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-[var(--md-on-surface-variant)]">
              Tài khoản: <strong>{resetTarget.fullName}</strong> ({resetTarget.email})
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

      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); resetManualForm(); }}
        title="Thêm tài khoản hệ thống"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => { setShowCreate(false); resetManualForm(); }}>
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
        <form id="admin-user-create-form" onSubmit={handleCreate} className="space-y-4">
          <p className="text-sm text-[var(--md-on-surface-variant)]">
            Dùng cho tài khoản admin, dịch vụ… không gắn hồ sơ nhân viên HR.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Số điện thoại">
              <input
                className="form-input"
                value={form.phone ?? ''}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0901234567"
              />
            </FormField>
            <FormField label="Mã nhân viên (tùy chọn)">
              <input
                className="form-input"
                value={form.employeeCode ?? ''}
                onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))}
                placeholder="NV-0008"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Bộ phận">
              <input
                className="form-input"
                value={form.department ?? ''}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="Kế toán"
              />
            </FormField>
            <FormField label="Chức vụ">
              <input
                className="form-input"
                value={form.position ?? ''}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                placeholder="Chuyên viên"
              />
            </FormField>
          </div>
          <FormField label="Vai trò" required>
            <select
              className="form-select"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as SystemUserRole }))}
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <AdminPasswordField
            value={createPassword}
            onChange={v => { setCreatePassword(v); setErrors(e => ({ ...e, password: '' })); }}
            error={errors.password}
          />
        </form>
      </Modal>
    </div>
  );
}
