import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, UserCheck, Users, UserX } from 'lucide-react';
import type { CardAccent } from '../../../types';
import {
  adminUsersListQueryKey,
  useAdminUsers,
  useToggleAdminUserStatus,
} from '../../../hooks/useAdminUsers';
import { useActiveRoleOptions } from '../../../hooks/useRoles';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { isCurrentAdminUserRow } from '../../../lib/admin/isCurrentAdminUser';
import { DEFAULT_LIST_PAGE_SIZE, type ListPageSize } from '../../../constants/pagination';
import { getSessionUser } from '../../../constants/systemUsers';
import type {
  AdminUserListParams,
  AdminUserPagedResult,
  AdminUserRow,
} from '../../../services/adminUsersService';
import { showToast } from '../../../components/ui/Toast';

export type QuickFilter = 'all' | 'pending';
export type AccountStatusFilter = '' | 'pending' | 'active' | 'locked';
export type SourceFilter = '' | 'employee' | 'manual';
export type AccountKpi = 'total' | 'pending' | 'active' | 'locked';

export interface AdminUserKpiItem {
  key: AccountKpi;
  label: string;
  value: number;
  icon: typeof Users;
  accent: CardAccent;
}

export const SOURCE_FILTER_OPTIONS = [
  { value: 'employee', label: 'Nhân viên HR' },
  { value: 'manual', label: 'Tài khoản hệ thống' },
] as const;

function currentKpi(quick: QuickFilter, status: AccountStatusFilter): AccountKpi {
  if (quick === 'pending' || status === 'pending') return 'pending';
  if (status === 'active') return 'active';
  if (status === 'locked') return 'locked';
  return 'total';
}

export function useAdminUsersController() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<AccountStatusFilter>('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ListPageSize>(DEFAULT_LIST_PAGE_SIZE);

  const [showCreate, setShowCreate] = useState(false);
  const [provisionTarget, setProvisionTarget] = useState<AdminUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);
  const [lockConfirmTarget, setLockConfirmTarget] = useState<AdminUserRow | null>(null);

  const listParams = useMemo<AdminUserListParams>(
    () => ({
      page,
      pageSize,
      search: search || undefined,
      pendingOnly: quickFilter === 'pending',
      accountStatus: accountStatusFilter || undefined,
      source: sourceFilter || undefined,
      department: departmentFilter || undefined,
    }),
    [page, pageSize, search, quickFilter, accountStatusFilter, sourceFilter, departmentFilter],
  );

  const { data, isPending, isError, error } = useAdminUsers(listParams);
  const { data: roleOptions = [] } = useActiveRoleOptions();
  const toggleMutation = useToggleAdminUserStatus(listParams);

  const users = data?.items ?? [];
  const summary = data?.summary;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const displayPage = totalPages > 0 ? Math.min(page, totalPages) : page;
  const activeKpi = currentKpi(quickFilter, accountStatusFilter);

  const hasFilters = Boolean(
    search || departmentFilter || accountStatusFilter || sourceFilter || quickFilter !== 'all',
  );

  const sessionUser = getSessionUser();
  const isSelfAccount = (user: AdminUserRow) => isCurrentAdminUserRow(sessionUser, user);
  const togglingKey =
    toggleMutation.isPending && toggleMutation.variables
      ? `${toggleMutation.variables.source}:${toggleMutation.variables.toggleId}`
      : null;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentFilter(value);
    setPage(1);
  };

  const handleSourceChange = (value: string) => {
    setSourceFilter(value as SourceFilter);
    setPage(1);
  };

  const handlePageSizeChange = (nextSize: ListPageSize) => {
    setPageSize(nextSize);
    setPage(1);
  };

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

  const handleUserNavigate = (user: AdminUserRow) => {
    navigate(`/admin/users/${user.id}?source=${user.source}`);
  };

  const executeToggle = async (user: AdminUserRow, next: boolean) => {
    try {
      await toggleMutation.mutateAsync({
        toggleId: user.toggleId,
        enabled: next,
        source: user.source,
      });
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

  const kpiItems: AdminUserKpiItem[] = [
    { key: 'total', label: 'Tổng', value: summary?.total ?? 0, icon: Users, accent: 'info' },
    { key: 'pending', label: 'Chờ cấp', value: summary?.pending ?? 0, icon: Clock, accent: 'warning' },
    { key: 'active', label: 'Hoạt động', value: summary?.active ?? 0, icon: UserCheck, accent: 'success' },
    { key: 'locked', label: 'Đã khóa', value: summary?.inactive ?? 0, icon: UserX, accent: 'danger' },
  ];

  return {
    search,
    departmentFilter,
    sourceFilter,
    pageSize,
    users,
    totalCount,
    totalPages,
    displayPage,
    isPending,
    isError,
    error,
    hasFilters,
    activeKpi,
    kpiItems,
    roleOptions,
    showCreate,
    setShowCreate,
    provisionTarget,
    setProvisionTarget,
    resetTarget,
    setResetTarget,
    lockConfirmTarget,
    setLockConfirmTarget,
    togglingKey,
    togglePending: toggleMutation.isPending,
    isSelfAccount,
    setPage,
    handleSearchChange,
    handleDepartmentChange,
    handleSourceChange,
    handlePageSizeChange,
    resetFilters,
    applyKpi,
    handleUserNavigate,
    requestToggle,
    handleLockConfirm,
  };
}
