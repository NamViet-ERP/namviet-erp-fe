import { KeyRound, Pencil, UserPlus } from 'lucide-react';
import AdminProvisionAccountModal from '../../components/admin/AdminProvisionAccountModal';
import AdminResetPasswordModal from '../../components/admin/AdminResetPasswordModal';
import HrmNotFound, { HrmLoadingState } from '../../components/hr/HrmNotFound';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader, { BackButton } from '../../components/ui/PageHeader';
import PageShell from '../../components/ui/PageShell';
import AdminUserDetailBoard from './users/AdminUserDetailBoard';
import { useAdminUserDetailController } from './users/useAdminUserDetailController';

export default function AdminUserDetailPage() {
  const vm = useAdminUserDetailController();

  if (vm.isLoading) {
    return (
      <PageShell variant="detail" className="hrm-page admin-user-detail-page">
        <HrmLoadingState />
      </PageShell>
    );
  }
  if (vm.isError || !vm.user) {
    return (
      <HrmNotFound
        message="Không tìm thấy người dùng."
        onBack={vm.goBack}
      />
    );
  }

  const { user } = vm;

  return (
    <PageShell variant="detail" className="hrm-page admin-user-detail-page">
      <div className="admin-user-detail-chrome">
        <BackButton onBack={vm.goBack} />
        <PageHeader
          title={user.fullName}
          subtitle={vm.subtitle}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {user.canProvision && (
                <Button
                  type="button"
                  variant="filled"
                  leftIcon={UserPlus}
                  onClick={() => vm.setShowProvision(true)}
                >
                  Cấp tài khoản
                </Button>
              )}
              {vm.canEditProfile && !vm.editingProfile ? (
                <Button
                  type="button"
                  variant="outlined"
                  leftIcon={Pencil}
                  onClick={vm.startEditProfile}
                >
                  Chỉnh sửa
                </Button>
              ) : null}
              {user.hasAccount && user.accountUserId && (
                <Button
                  type="button"
                  variant="outlined"
                  leftIcon={KeyRound}
                  onClick={() => vm.setShowReset(true)}
                >
                  Đặt lại MK
                </Button>
              )}
            </div>
          }
        />
      </div>

      <AdminUserDetailBoard
        user={user}
        source={vm.source}
        roleOptions={vm.roleOptions}
        editingProfile={vm.editingProfile}
        editName={vm.editName}
        editEmail={vm.editEmail}
        profileErrors={vm.profileErrors}
        isSavingProfile={vm.isSavingProfile}
        onEditNameChange={vm.setEditName}
        onEditEmailChange={vm.setEditEmail}
        onCancelEditProfile={vm.cancelEditProfile}
        onSaveProfile={() => void vm.handleSaveProfile()}
        selectedRole={vm.selectedRole}
        roleDirty={vm.roleDirty}
        isToggling={vm.isToggling}
        isChangingRole={vm.isChangingRole}
        toggleTitle={vm.toggleTitle}
        toggleHint={vm.toggleHint}
        onToggle={next => void vm.handleToggle(next)}
        onSelectedRoleChange={vm.setSelectedRole}
        onChangeRole={() => void vm.handleChangeRole()}
      />

      <AdminProvisionAccountModal
        key={vm.showProvision ? `provision-${user.id}` : 'provision-closed'}
        user={vm.showProvision ? user : null}
        onClose={() => vm.setShowProvision(false)}
        roleOptions={vm.roleOptions}
      />
      <AdminResetPasswordModal
        key={vm.showReset ? `reset-${user.id}` : 'reset-closed'}
        user={vm.showReset ? user : null}
        onClose={() => vm.setShowReset(false)}
      />

      <ConfirmDialog
        isOpen={vm.lockConfirmOpen}
        onClose={() => vm.setLockConfirmOpen(false)}
        onConfirm={() => void vm.handleLockConfirm()}
        title="Khóa tài khoản"
        message={
          <>
            Bạn có chắc muốn khóa tài khoản{' '}
            <strong className="confirm-dialog__emphasis">{user.fullName}</strong>?
            <br />
            <span className="confirm-dialog__subtext">
              Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.
            </span>
          </>
        }
        confirmLabel="Khóa tài khoản"
        cancelLabel="Hủy"
        isLoading={vm.isToggling}
      />
    </PageShell>
  );
}
