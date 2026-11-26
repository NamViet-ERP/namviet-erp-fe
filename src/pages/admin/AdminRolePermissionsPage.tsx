import { Link } from 'react-router-dom';
import { RotateCcw, Save } from 'lucide-react';
import PermissionGate from '../../components/auth/PermissionGate';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader, { BackButton } from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SectionCard from '../../components/ui/SectionCard';
import TableSkeletonRows from '../../components/ui/TableSkeletonRows';
import { getApiErrorMessage } from '../../lib/apiClient';
import PermissionFilterToolbar from './rolePermissions/PermissionFilterToolbar';
import PermissionMatrixTable from './rolePermissions/PermissionMatrixTable';
import PermissionModuleRail from './rolePermissions/PermissionModuleRail';
import { useRolePermissionsController } from './rolePermissions/useRolePermissionsController';

export default function AdminRolePermissionsPage() {
  const vm = useRolePermissionsController();

  if (!vm.code) {
    return (
      <PageShell variant="detail" className="hrm-page">
        <EmptyState message="Không tìm thấy mã vai trò." />
      </PageShell>
    );
  }

  const subtitle = vm.isDirty
    ? `${vm.grantedCount}/${vm.totalCount} quyền đang bật · Chưa lưu`
    : `${vm.grantedCount}/${vm.totalCount} quyền đang bật`;

  const showSplit = !vm.loading && !vm.isError && vm.groups.length > 0;

  return (
    <PageShell variant="detail" className="hrm-page admin-role-permissions-page">
      <div className="admin-role-permissions-chrome">
        <BackButton onBack={vm.goBack} />
        <PageHeader
          title={vm.roleLabel}
          subtitle={subtitle}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outlined"
                leftIcon={RotateCcw}
                disabled={!vm.isDirty || vm.isSaving}
                onClick={vm.handleReset}
              >
                Hoàn tác
              </Button>
              <PermissionGate permission="admin.roles.permissions.update">
                <Button
                  type="button"
                  variant="filled"
                  leftIcon={Save}
                  disabled={!vm.isDirty || vm.isSaving}
                  onClick={() => void vm.handleSave()}
                >
                  {vm.isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </PermissionGate>
            </div>
          }
        />
      </div>

      {!vm.canEdit && (
        <p className="admin-role-permissions-page__readonly-note">
          Bạn chỉ có quyền xem ma trận quyền. Liên hệ quản trị viên để chỉnh sửa.
        </p>
      )}

      <SectionCard noPadding className="admin-role-permissions-board">
        <PermissionFilterToolbar
          search={vm.search}
          onSearchChange={vm.setSearch}
          searchCrossModules={vm.searchCrossModules}
          onSearchCrossModulesChange={vm.setSearchCrossModules}
          statusFilter={vm.statusFilter}
          onStatusFilterChange={vm.setStatusFilter}
          actionFilter={vm.actionFilter}
          onActionFilterChange={vm.setActionFilter}
          totalCount={vm.totalCount}
          grantedCount={vm.grantedCount}
          isFiltered={vm.isFiltered}
          matchingPermissionsCount={vm.matchingPermissionsCount}
          onResetFilters={vm.handleResetFilters}
        />

        {vm.loading ? (
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
        ) : vm.isError ? (
          <div className="admin-role-permissions-empty">
            <EmptyState
              message={getApiErrorMessage(
                vm.error,
                'Không tải được quyền của vai trò.',
              )}
            />
          </div>
        ) : vm.displayGroups.length === 0 ? (
          <div className="admin-role-permissions-empty">
            <EmptyState
              message={
                vm.isFiltered
                  ? 'Không tìm thấy quyền nào phù hợp bộ lọc hiện tại.'
                  : 'Catalog quyền trống.'
              }
            />
          </div>
        ) : showSplit ? (
          <div className="admin-role-permissions-split">
            <PermissionModuleRail
              groups={vm.groups}
              visibleGroups={vm.visibleGroups}
              activeGroup={vm.activeGroup}
              selected={vm.selected}
              searchCrossModules={vm.searchCrossModules}
              isFiltered={vm.isFiltered}
              onSelectModule={vm.selectModule}
            />
            <PermissionMatrixTable
              displayGroups={vm.displayGroups}
              activeGroup={vm.activeGroup}
              search={vm.search}
              searchCrossModules={vm.searchCrossModules}
              selected={vm.selected}
              canEdit={vm.canEdit}
              inViewKeys={vm.inViewKeys}
              inViewCheckedCount={vm.inViewCheckedCount}
              allInViewChecked={vm.allInViewChecked}
              someInViewChecked={vm.someInViewChecked}
              onTogglePermission={vm.togglePermission}
              onToggleKeys={vm.toggleKeys}
            />
          </div>
        ) : null}
      </SectionCard>

      <p className="admin-role-permissions-page__footer-note text-xs text-[var(--md-on-surface-variant)]">
        Quyền được gán theo vai trò - người dùng kế thừa từ role đã chọn khi cấp tài khoản.{' '}
        <Link to="/admin/users" className="hrm-settings-link inline-flex">
          Quản lý người dùng
        </Link>
      </p>
    </PageShell>
  );
}
