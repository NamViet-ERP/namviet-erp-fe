import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Save } from 'lucide-react';
import PermissionGate from '../../components/auth/PermissionGate';
import { HrmBackButton } from '../../components/hr/HrmPageChrome';
import HrmPanel from '../../components/hr/HrmPanel';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { showToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import {
  usePermissionCatalog,
  useRolePermissions,
  useUpdateRolePermissions,
} from '../../hooks/useRolePermissions';
import { useRoles } from '../../hooks/useRoles';
import { getApiErrorMessage } from '../../lib/apiClient';
import {
  filterPermissionGroups,
  groupPermissionCatalog,
} from '../../lib/permissions/groupPermissionCatalog';
import PermissionFilterToolbar from './rolePermissions/PermissionFilterToolbar';
import PermissionMatrixTable from './rolePermissions/PermissionMatrixTable';
import PermissionModuleRail from './rolePermissions/PermissionModuleRail';
import {
  countSelected,
  keysOfGroup,
  setsEqual,
  type ActionFilter,
  type StatusFilter,
} from './rolePermissions/rolePermissionHelpers';

export default function AdminRolePermissionsPage() {
  const navigate = useNavigate();
  const { code = '' } = useParams<{ code: string }>();
  const { has: hasPermission } = usePermission();
  const canEdit = hasPermission('admin.roles.permissions.update');

  const { data: roles = [] } = useRoles();
  const roleLabel = roles.find(r => r.code === code)?.label ?? code;

  const catalogQuery = usePermissionCatalog();
  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const catalogLoading = catalogQuery.isLoading;
  const {
    data: rolePermissions,
    isLoading: permissionsLoading,
    isError,
    error,
  } = useRolePermissions(code);
  const updateMutation = useUpdateRolePermissions(code);

  const [search, setSearch] = useState('');
  const [searchCrossModules, setSearchCrossModules] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [baseline, setBaseline] = useState<Set<string>>(new Set());
  const [syncedPermissions, setSyncedPermissions] = useState(rolePermissions);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [syncedCode, setSyncedCode] = useState(code);

  if (code !== syncedCode) {
    setSyncedCode(code);
    setSearch('');
    setStatusFilter('all');
    setActionFilter('all');
    setSearchCrossModules(false);
  }

  if (rolePermissions !== syncedPermissions) {
    setSyncedPermissions(rolePermissions);
    if (rolePermissions?.permissions) {
      const next = new Set(rolePermissions.permissions);
      setSelected(next);
      setBaseline(next);
    }
  }

  const groups = useMemo(() => groupPermissionCatalog(catalog), [catalog]);

  const visibleGroups = useMemo(() => {
    return filterPermissionGroups(groups, {
      search,
      status: statusFilter,
      selectedKeys: selected,
      actionFilter,
    });
  }, [groups, search, statusFilter, selected, actionFilter]);

  const activeGroup =
    visibleGroups.find(g => g.module === activeModule) ??
    visibleGroups[0] ??
    null;

  const isDirty = !setsEqual(selected, baseline);
  const grantedCount = selected.size;
  const totalCount = catalog.length;
  const loading = catalogLoading || permissionsLoading;

  const displayGroups = useMemo(() => {
    if (searchCrossModules) return visibleGroups;
    return activeGroup ? [activeGroup] : [];
  }, [searchCrossModules, visibleGroups, activeGroup]);

  const inViewKeys = useMemo(() => {
    return displayGroups.flatMap(g => keysOfGroup(g));
  }, [displayGroups]);

  const inViewCheckedCount = countSelected(inViewKeys, selected);
  const allInViewChecked =
    inViewKeys.length > 0 && inViewCheckedCount === inViewKeys.length;
  const someInViewChecked =
    inViewCheckedCount > 0 && !allInViewChecked;

  const matchingPermissionsCount = useMemo(() => {
    return visibleGroups.reduce(
      (sum, g) => sum + g.resources.reduce((rSum, r) => rSum + r.entries.length, 0),
      0,
    );
  }, [visibleGroups]);

  const isFiltered =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    actionFilter !== 'all' ||
    searchCrossModules;

  const togglePermission = (key: string, checked: boolean) => {
    if (!canEdit) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleKeys = (keys: string[], checked: boolean) => {
    if (!canEdit) return;
    setSelected(prev => {
      const next = new Set(prev);
      for (const key of keys) {
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  };

  const handleReset = () => setSelected(new Set(baseline));

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setActionFilter('all');
    setSearchCrossModules(false);
  };

  const handleSave = async () => {
    if (!canEdit || !isDirty) return;
    try {
      await updateMutation.mutateAsync({ permissions: [...selected].sort() });
      const saved = new Set(selected);
      setBaseline(saved);
      showToast('success', `Đã lưu quyền cho vai trò "${roleLabel}"`);
    } catch (err: unknown) {
      showToast('error', getApiErrorMessage(err, 'Không thể lưu ma trận quyền'));
    }
  };

  if (!code) {
    return (
      <div className="hrm-page">
        <EmptyState message="Không tìm thấy mã vai trò." />
      </div>
    );
  }

  const subtitle = isDirty
    ? `${grantedCount}/${totalCount} quyền đang bật · Chưa lưu`
    : `${grantedCount}/${totalCount} quyền đang bật`;

  const showSplit = !loading && !isError && groups.length > 0;

  return (
    <div className="hrm-page admin-role-permissions-page">
      <div className="admin-role-permissions-chrome">
        <HrmBackButton onBack={() => navigate('/admin/settings')} />
        <PageHeader
          title={roleLabel}
          subtitle={subtitle}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-outline flex items-center gap-2"
                disabled={!isDirty || updateMutation.isPending}
                onClick={handleReset}
              >
                <RotateCcw size={16} aria-hidden />
                Hoàn tác
              </button>
              <PermissionGate permission="admin.roles.permissions.update">
                <button
                  type="button"
                  className="btn btn-primary flex items-center gap-2"
                  disabled={!isDirty || updateMutation.isPending}
                  onClick={() => void handleSave()}
                >
                  <Save size={16} aria-hidden />
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </PermissionGate>
            </div>
          }
        />
      </div>

      {!canEdit && (
        <p className="admin-role-permissions-page__readonly-note">
          Bạn chỉ có quyền xem ma trận quyền. Liên hệ quản trị viên để chỉnh sửa.
        </p>
      )}

      <HrmPanel noPadding className="admin-role-permissions-board">
        <PermissionFilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchCrossModules={searchCrossModules}
          onSearchCrossModulesChange={setSearchCrossModules}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          actionFilter={actionFilter}
          onActionFilterChange={setActionFilter}
          totalCount={totalCount}
          grantedCount={grantedCount}
          isFiltered={isFiltered}
          matchingPermissionsCount={matchingPermissionsCount}
          onResetFilters={handleResetFilters}
        />

        {loading ? (
          <div
            className="admin-role-permissions-split"
            aria-busy="true"
            aria-live="polite"
          >
            <div className="admin-role-permissions-rail" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="hrm-table-skeleton admin-role-permissions-rail__skel"
                />
              ))}
            </div>
            <div className="admin-role-permissions-pane">
              <div className="admin-role-permissions-pane__body table-scroll">
                <table className="w-full border-collapse hrm-table">
                  <tbody>
                    <TableSkeletonRows colSpan={3} rows={8} />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="admin-role-permissions-empty">
            <EmptyState
              message={getApiErrorMessage(
                error,
                'Không tải được quyền của vai trò.',
              )}
            />
          </div>
        ) : displayGroups.length === 0 ? (
          <div className="admin-role-permissions-empty">
            <EmptyState
              message={
                isFiltered
                  ? 'Không tìm thấy quyền nào phù hợp bộ lọc hiện tại.'
                  : 'Catalog quyền trống.'
              }
            />
          </div>
        ) : showSplit ? (
          <div className="admin-role-permissions-split">
            <PermissionModuleRail
              groups={groups}
              visibleGroups={visibleGroups}
              activeGroup={activeGroup}
              selected={selected}
              searchCrossModules={searchCrossModules}
              isFiltered={isFiltered}
              onSelectModule={module => {
                setSearchCrossModules(false);
                setActiveModule(module);
              }}
            />
            <PermissionMatrixTable
              displayGroups={displayGroups}
              activeGroup={activeGroup}
              search={search}
              searchCrossModules={searchCrossModules}
              selected={selected}
              canEdit={canEdit}
              inViewKeys={inViewKeys}
              inViewCheckedCount={inViewCheckedCount}
              allInViewChecked={allInViewChecked}
              someInViewChecked={someInViewChecked}
              onTogglePermission={togglePermission}
              onToggleKeys={toggleKeys}
            />
          </div>
        ) : null}
      </HrmPanel>

      <p className="admin-role-permissions-page__footer-note text-xs text-[var(--md-on-surface-variant)]">
        Quyền được gán theo vai trò - người dùng kế thừa từ role đã chọn khi cấp tài khoản.{' '}
        <Link to="/admin/users" className="hrm-settings-link inline-flex">
          Quản lý người dùng
        </Link>
      </p>
    </div>
  );
}
