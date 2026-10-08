import type React from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, KeyRound, Plus, UserCheck, UserCog, Users, UserX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import type { CardAccent } from '../../types';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import HrmPanel from '../../components/hr/HrmPanel';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminAccountSwitch from '../../components/admin/AdminAccountSwitch';
import AdminCreateSystemUserModal from '../../components/admin/AdminCreateSystemUserModal';
import AdminProvisionAccountModal from '../../components/admin/AdminProvisionAccountModal';
import AdminResetPasswordModal from '../../components/admin/AdminResetPasswordModal';
import { showToast } from '../../components/ui/Toast';
import {
  adminUsersListQueryKey,
  useAdminUsers,
  useToggleAdminUserStatus,
} from '../../hooks/useAdminUsers';
import { useActiveRoleOptions } from '../../hooks/useRoles';
import { formatAdminDateCell } from '../../lib/hrm/formatters';
import { getApiErrorMessage } from '../../lib/apiClient';
import { UI_ERROR } from '../../lib/uiMessages';
import { DEFAULT_LIST_PAGE_SIZE } from '../../constants/pagination';
import type { AdminUserListParams, AdminUserPagedResult, AdminUserRow } from '../../services/adminUsersService';
import { getSessionUser } from '../../constants/systemUsers';
import { isCurrentAdminUserRow, adminUserToggleKey } from '../../lib/admin/isCurrentAdminUser';

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
type AccountKpi = 'total' | 'pending' | 'active' | 'locked';

function cellDash(value?: string): string {
  if (!value || value === '—' || value.trim() === '') return '-';
  return value;
}

function currentKpi(quick: QuickFilter, status: AccountStatusFilter): AccountKpi {
  if (quick === 'pending' || status === 'pending') return 'pending';
  if (status === 'active') return 'active';
  if (status === 'locked') return 'locked';
  return 'total';
}

function statusBadgeClass(user: AdminUserRow): string {
  if (!user.hasAccount) return 'badge badge-pending';
  return user.isActive ? 'badge badge-success' : 'badge badge-error';
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
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);

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

  const { data, isPending, isError, error } = useAdminUsers(listParams);

  const users = data?.items ?? [];
  const summary = data?.summary;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const displayPage = totalPages > 0 ? Math.min(page, totalPages) : page;

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

  const applyKpi = (kpi: AccountKpi) => {
    if (kpi === 'pending') {
      setQuickFilter('pending');
      setAccountStatusFilter('');
    } else if (kpi === 'active') {
      setQuickFilter('all');
      setAccountStatusFilter('active');
    } else if (kpi === 'locked') {
      setQuickFilter('all');
      setAccountStatusFilter('locked');
    } else {
      setQuickFilter('all');
      setAccountStatusFilter('');
    }
    setPage(1);
  };

  const activeKpi = currentKpi(quickFilter, accountStatusFilter);

  const { data: roleOptions = [] } = useActiveRoleOptions();
  const toggleMutation = useToggleAdminUserStatus(listParams);

  const [showCreate, setShowCreate] = useState(false);
  const [provisionTarget, setProvisionTarget] = useState<AdminUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);
  const [lockConfirmTarget, setLockConfirmTarget] = useState<AdminUserRow | null>(null);

  const sessionUser = getSessionUser();
  const isSelfAccount = (user: AdminUserRow) => isCurrentAdminUserRow(sessionUser, user);
  const togglingKey = toggleMutation.isPending && toggleMutation.variables
    ? `${toggleMutation.variables.source}:${toggleMutation.variables.toggleId}`
    : null;

  const handleRowClick = (user: AdminUserRow) => {
    navigate(`/admin/users/${user.id}?source=${user.source}`);
  };

  const handleRowNavigate = (user: AdminUserRow, e: React.MouseEvent<HTMLTableRowElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="switch"]')) return;
    handleRowClick(user);
  };

  const executeToggle = async (user: AdminUserRow, next: boolean) => {
    try {
      await toggleMutation.mutateAsync({ toggleId: user.toggleId, enabled: next, source: user.source });
      const updated = qc.getQueryData<AdminUserPagedResult>(adminUsersListQueryKey(listParams));
      if (updated?.page && updated.page !== page) setPage(updated.page);
      showToast('success', next ? 'Đã bật tài khoản' : 'Đã khóa tài khoản');
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể thay đổi trạng thái'));
      throw err;
    }
  };

  const requestToggle = (user: AdminUserRow, next: boolean) => {
    if (!user.hasAccount) return;
    if (!user.canToggle) {
      showToast('warning', 'Nhân viên đã nghỉ việc, không thể bật tài khoản');
      return;
    }
    if (!next && isSelfAccount(user)) {
      showToast('warning', 'Không thể khóa tài khoản đang đăng nhập.');
      return;
    }
    if (!next) {
      setLockConfirmTarget(user);
      return;
    }
    void executeToggle(user, true);
  };

  const handleLockConfirm = async () => {
    if (!lockConfirmTarget) return;
    try {
      await executeToggle(lockConfirmTarget, false);
      setLockConfirmTarget(null);
    } catch {
      /* toast shown in executeToggle */
    }
  };

  const kpiItems: { key: AccountKpi; label: string; value: number; icon: typeof Users; accent: CardAccent }[] = [
    { key: 'total', label: 'Tổng', value: summary?.total ?? 0, icon: Users, accent: 'info' },
    { key: 'pending', label: 'Chờ cấp', value: summary?.pending ?? 0, icon: Clock, accent: 'warning' },
    { key: 'active', label: 'Hoạt động', value: summary?.active ?? 0, icon: UserCheck, accent: 'success' },
    { key: 'locked', label: 'Đã khóa', value: summary?.inactive ?? 0, icon: UserX, accent: 'danger' },
  ];

  return (
    <div className="hrm-page admin-users-page">
      <PageHeader
        title="Quản lý tài khoản người dùng"
        subtitle="Bấm dòng để mở chi tiết."
        actions={
          <button
            type="button"
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} aria-hidden />
            Thêm tài khoản hệ thống
          </button>
        }
      />

      <div className="dashboard-kpi-grid admin-users-kpis" role="list" aria-label="Tóm tắt tài khoản">
        {kpiItems.map(item => (
          <Card
            key={item.key}
            title={item.label}
            value={item.value}
            accent={item.accent}
            icon={item.icon}
            selected={activeKpi === item.key}
            onClick={() => applyKpi(item.key)}
          />
        ))}
      </div>

      <HrmPanel noPadding className="admin-users-board">
        <div className="hrm-list-toolbar">
          <div className="admin-users-toolbar">
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); resetPaging(); }}
              placeholder="Tìm theo tên, mã NV, email..."
            />
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
                value={sourceFilter}
                onChange={e => { setSourceFilter(e.target.value as SourceFilter); resetPaging(); }}
                aria-label="Lọc nguồn"
              >
                <option value="">Tất cả nguồn</option>
                <option value="employee">Nhân viên HR</option>
                <option value="manual">Tài khoản hệ thống</option>
              </select>
            </div>
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="hrm-filter-reset">
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto table-scroll hrm-table-wrap">
          <table className="w-full min-w-max border-collapse hrm-table admin-users-table">
            <thead>
              <tr>
                <th className="table-header-cell admin-users-col-code">Mã nhân viên</th>
                <th className="table-header-cell">Họ tên</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell admin-users-col-phone">Số điện thoại</th>
                <th className="table-header-cell">Bộ phận</th>
                <th className="table-header-cell">Chức vụ</th>
                <th className="table-header-cell">Vai trò</th>
                <th className="table-header-cell admin-users-col-status">Trạng thái</th>
                <th className="table-header-cell admin-users-col-date">Ngày tạo</th>
                <th className="table-header-cell admin-users-col-toggle">Bật/Tắt</th>
                <th className="table-header-cell admin-users-col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <TableSkeletonRows colSpan={TABLE_HEADERS.length} />
              ) : isError ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length}>
                    <EmptyState message={getApiErrorMessage(error, UI_ERROR.loadUsers)} icon={UserX} />
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
                    onClick={e => handleRowNavigate(user, e)}
                    title="Xem chi tiết"
                  >
                    <td className="table-cell admin-users-col-code">
                      {user.employeeCode && user.employeeCode !== '—' ? (
                        <EntityCodeLink
                          code={user.employeeCode}
                          to={`/admin/users/${user.id}?source=${user.source}`}
                        />
                      ) : (
                        <span className="entity-code">-</span>
                      )}
                    </td>
                    <td className="table-cell member-name">{user.fullName}</td>
                    <td className="table-cell">
                      <span className="admin-users-email">{cellDash(user.email)}</span>
                    </td>
                    <td className="table-cell whitespace-nowrap">{cellDash(user.phone)}</td>
                    <td className="table-cell">{cellDash(user.department)}</td>
                    <td className="table-cell">{cellDash(user.position)}</td>
                    <td className="table-cell">{cellDash(user.role)}</td>
                    <td className="table-cell">
                      <span className={statusBadgeClass(user)}>{user.statusLabel}</span>
                    </td>
                    <td className="table-cell whitespace-nowrap tabular-nums">
                      {cellDash(formatAdminDateCell(user.createdAt))}
                    </td>
                    <td
                      className="table-cell text-center"
                      onClick={e => e.stopPropagation()}
                      onMouseDown={e => e.stopPropagation()}
                    >
                      {user.hasAccount ? (
                        <AdminAccountSwitch
                          checked={user.isActive}
                          disabled={
                            !user.canToggle
                            || togglingKey === adminUserToggleKey(user)
                          }
                          onChange={n => requestToggle(user, n)}
                          title={
                            user.isActive && isSelfAccount(user)
                              ? 'Không thể khóa tài khoản đang đăng nhập'
                              : !user.canToggle
                                ? 'Nhân viên đã nghỉ việc'
                                : user.isActive
                                  ? 'Khóa tài khoản'
                                  : 'Mở khóa tài khoản'
                          }
                        />
                      ) : (
                        <span className="admin-users-empty">-</span>
                      )}
                    </td>
                    <td className="table-cell whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="admin-users-row-actions">
                        {user.canProvision && (
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => setProvisionTarget(user)}>
                            Cấp tài khoản
                          </button>
                        )}
                        {user.hasAccount && user.accountUserId && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline flex items-center gap-1"
                            onClick={() => setResetTarget(user)}
                          >
                            <KeyRound size={14} aria-hidden />
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

        {totalCount > 0 && !isPending && (
          <Pagination
            embedded
            itemLabel="tài khoản"
            currentPage={displayPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          />
        )}
      </HrmPanel>

      <AdminProvisionAccountModal
        key={provisionTarget?.id ?? 'closed'}
        user={provisionTarget}
        onClose={() => setProvisionTarget(null)}
        roleOptions={roleOptions}
      />
      <AdminResetPasswordModal
        key={resetTarget?.id ?? 'closed'}
        user={resetTarget}
        onClose={() => setResetTarget(null)}
      />
      <AdminCreateSystemUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        roleOptions={roleOptions}
      />

      <ConfirmDialog
        isOpen={lockConfirmTarget !== null}
        onClose={() => setLockConfirmTarget(null)}
        onConfirm={() => void handleLockConfirm()}
        title="Khóa tài khoản"
        message={
          <>
            Bạn có chắc muốn khóa tài khoản{' '}
            <strong className="confirm-dialog__emphasis">{lockConfirmTarget?.fullName}</strong>?
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
