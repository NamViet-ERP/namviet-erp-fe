import { Plus } from 'lucide-react';
import AdminCreateSystemUserModal from '../../components/admin/AdminCreateSystemUserModal';
import AdminProvisionAccountModal from '../../components/admin/AdminProvisionAccountModal';
import AdminResetPasswordModal from '../../components/admin/AdminResetPasswordModal';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import SearchBar from '../../components/ui/SearchBar';
import SectionCard from '../../components/ui/SectionCard';
import SelectField from '../../components/ui/SelectField';
import AdminUsersTable from './users/AdminUsersTable';
import {
  SOURCE_FILTER_OPTIONS,
  useAdminUsersController,
} from './users/useAdminUsersController';

export default function AdminUsersPage() {
  const vm = useAdminUsersController();

  return (
    <PageShell variant="list" className="hrm-page admin-users-page">
      <PageHeader
        title="Quản lý tài khoản người dùng"
        subtitle="Bấm dòng để mở chi tiết."
        actions={
          <Button
            type="button"
            variant="filled"
            leftIcon={Plus}
            onClick={() => vm.setShowCreate(true)}
          >
            Thêm tài khoản hệ thống
          </Button>
        }
      />

      <div className="dashboard-kpi-grid admin-users-kpis" role="list" aria-label="Tóm tắt tài khoản">
        {vm.kpiItems.map(item => (
          <Card
            key={item.key}
            title={item.label}
            value={item.value}
            accent={item.accent}
            icon={item.icon}
            selected={vm.activeKpi === item.key}
            onClick={() => vm.applyKpi(item.key)}
          />
        ))}
      </div>

      <SectionCard noPadding className="admin-users-board">
        <div className="hrm-list-toolbar">
          <div className="admin-users-toolbar">
            <SearchBar
              value={vm.search}
              onChange={vm.handleSearchChange}
              placeholder="Tìm theo tên, mã NV, email..."
            />
            <input
              className="hrm-filter-input-inline"
              value={vm.departmentFilter}
              onChange={e => vm.handleDepartmentChange(e.target.value)}
              placeholder="Bộ phận"
              aria-label="Lọc bộ phận"
            />
            <SelectField
              variant="hrm"
              className="hrm-filter-select-wrap"
              selectClassName="hrm-filter-select"
              aria-label="Lọc nguồn"
              placeholder="Tất cả nguồn"
              value={vm.sourceFilter}
              onChange={vm.handleSourceChange}
              options={SOURCE_FILTER_OPTIONS}
            />
            {vm.hasFilters && (
              <button type="button" onClick={vm.resetFilters} className="hrm-filter-reset">
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <AdminUsersTable
          users={vm.users}
          isPending={vm.isPending}
          isError={vm.isError}
          error={vm.error}
          hasFilters={vm.hasFilters}
          displayPage={vm.displayPage}
          totalPages={vm.totalPages}
          pageSize={vm.pageSize}
          totalCount={vm.totalCount}
          togglingKey={vm.togglingKey}
          isSelfAccount={vm.isSelfAccount}
          onRowNavigate={vm.handleUserNavigate}
          onRequestToggle={vm.requestToggle}
          onProvision={vm.setProvisionTarget}
          onResetPassword={vm.setResetTarget}
          onPageChange={vm.setPage}
          onPageSizeChange={vm.handlePageSizeChange}
        />
      </SectionCard>

      <AdminProvisionAccountModal
        key={vm.provisionTarget ? `provision-${vm.provisionTarget.id}` : 'provision-closed'}
        user={vm.provisionTarget}
        onClose={() => vm.setProvisionTarget(null)}
        roleOptions={vm.roleOptions}
      />
      <AdminResetPasswordModal
        key={vm.resetTarget ? `reset-${vm.resetTarget.id}` : 'reset-closed'}
        user={vm.resetTarget}
        onClose={() => vm.setResetTarget(null)}
      />
      <AdminCreateSystemUserModal
        open={vm.showCreate}
        onClose={() => vm.setShowCreate(false)}
        roleOptions={vm.roleOptions}
      />

      <ConfirmDialog
        isOpen={vm.lockConfirmTarget !== null}
        onClose={() => vm.setLockConfirmTarget(null)}
        onConfirm={() => void vm.handleLockConfirm()}
        title="Khóa tài khoản"
        message={
          <>
            Bạn có chắc muốn khóa tài khoản{' '}
            <strong className="confirm-dialog__emphasis">{vm.lockConfirmTarget?.fullName}</strong>?
            <br />
            <span className="confirm-dialog__subtext">
              Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.
            </span>
          </>
        }
        confirmLabel="Khóa tài khoản"
        cancelLabel="Hủy"
        isLoading={vm.togglePending}
      />
    </PageShell>
  );
}
