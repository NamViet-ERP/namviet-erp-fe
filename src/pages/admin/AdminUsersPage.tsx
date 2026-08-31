import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, UserCog, UserCheck, UserX, UserPlus, KeyRound } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import EntityCodeLink from '../../components/ui/EntityCodeLink';
import TabFilter from '../../components/ui/TabFilter';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
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
import type { TabItem } from '../../types';

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

const QUICK_TABS: TabItem[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ cấp TK' },
];

function statusBadgeClass(user: AdminUserRow): string {
  if (!user.hasAccount) return 'badge badge-neutral';
  return user.isActive ? 'badge badge-success' : 'badge badge-warning';
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
        <div className="px-4 pt-3 pb-1 border-b border-[var(--md-outline-variant02)]">
          <TabFilter
            tabs={QUICK_TABS.map(tab => (
              tab.id === 'all'
                ? { ...tab, count: summary?.total }
                : { ...tab, count: summary?.pending }
            ))}
            activeTab={quickFilter}
            onChange={id => { setQuickFilter(id as QuickFilter); resetPaging(); }}
          />
        </div>
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
              {isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hrm-table-skeleton-row" aria-hidden>
                    <td colSpan={TABLE_HEADERS.length}><div className="hrm-table-skeleton" /></td>
                  </tr>
                ))
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
                    <td className="table-cell">
                      {user.employeeCode ? (
                        <EntityCodeLink
                          code={user.employeeCode}
                          to={`/admin/users/${user.id}?source=${user.source}`}
                        />
                      ) : (
                        <span className="entity-code">—</span>
                      )}
                    </td>
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
                        <span className="text-xs text-[var(--md-on-surface-variant)]">—</span>
                      )}
                    </td>
                    <td className="table-cell whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2 justify-center">
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
        user={provisionTarget}
        onClose={() => setProvisionTarget(null)}
        roleOptions={roleOptions}
      />
      <AdminResetPasswordModal
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
