import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { showToast } from '../../../components/ui/Toast';
import { getSessionUser } from '../../../constants/systemUsers';
import {
  useAdminUser,
  useChangeAdminUserRole,
  useToggleAdminUserStatus,
  useUpdateAdminUserProfile,
} from '../../../hooks/useAdminUsers';
import { useActiveRoleOptions } from '../../../hooks/useRoles';
import { isCurrentAdminUserRow } from '../../../lib/admin/isCurrentAdminUser';
import { getApiErrorMessage } from '../../../lib/apiClient';
import type { AdminUserSource } from '../../../services/adminUsersService';

interface RoleDraft {
  userId: string;
  baseRoleCode: string;
  roleCode: string;
}

function parseSource(value: string | null): AdminUserSource {
  return value === 'manual' ? 'manual' : 'employee';
}

export function useAdminUserDetailController() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const source = parseSource(searchParams.get('source'));
  const navigate = useNavigate();

  const { data: user, isLoading, isError } = useAdminUser(id, source);
  const { data: roleOptions = [] } = useActiveRoleOptions();
  const toggleMutation = useToggleAdminUserStatus();
  const changeRoleMutation = useChangeAdminUserRole();
  const updateProfileMutation = useUpdateAdminUserProfile();

  const [showProvision, setShowProvision] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null);
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const sessionUser = getSessionUser();
  const userRoleCode = user?.roleCode ?? '';
  const selectedRole =
    user &&
    roleDraft &&
    roleDraft.userId === user.id &&
    roleDraft.baseRoleCode === userRoleCode
      ? roleDraft.roleCode
      : userRoleCode;

  const setSelectedRole = (nextRole: string) => {
    if (!user) return;
    setRoleDraft({
      userId: user.id,
      baseRoleCode: user.roleCode ?? '',
      roleCode: nextRole,
    });
  };

  const goBack = () => navigate('/admin/users');

  const isSelfAccount = user ? isCurrentAdminUserRow(sessionUser, user) : false;
  const roleDirty = Boolean(user?.hasAccount && selectedRole && selectedRole !== user.roleCode);
  const canEditProfile = Boolean(user && source === 'manual' && user.hasAccount);

  const subtitle = !user
    ? ''
    : user.employeeCode !== '—'
      ? `Mã NV: ${user.employeeCode}`
      : source === 'manual'
        ? 'Tài khoản hệ thống'
        : 'Chưa có mã nhân viên';

  const toggleTitle = !user
    ? ''
    : user.isActive && isSelfAccount
      ? 'Không thể khóa tài khoản đang đăng nhập'
      : !user.canToggle
        ? 'Nhân viên đã nghỉ việc'
        : user.isActive
          ? 'Khóa tài khoản'
          : 'Mở khóa tài khoản';

  const toggleHint = !user
    ? null
    : !user.canToggle
      ? 'Nhân viên đã nghỉ việc, không thể bật tài khoản.'
      : user.isActive && isSelfAccount
        ? 'Không thể khóa tài khoản đang đăng nhập.'
        : null;

  const startEditProfile = () => {
    if (!user) return;
    setEditName(user.fullName === '—' ? '' : user.fullName);
    setEditEmail(user.email === '—' ? '' : user.email);
    setProfileErrors({});
    setEditingProfile(true);
  };

  const cancelEditProfile = () => {
    setEditingProfile(false);
    setProfileErrors({});
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();
    const nextErrors: Record<string, string> = {};
    if (!name) nextErrors.name = 'Họ tên là bắt buộc.';
    if (!email || !email.includes('@')) nextErrors.email = 'Email không hợp lệ.';
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await updateProfileMutation.mutateAsync({
        toggleId: user.toggleId,
        source,
        name,
        email,
      });
      showToast('success', 'Đã cập nhật hồ sơ tài khoản');
      setEditingProfile(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không cập nhật được hồ sơ'));
    }
  };

  const handleToggle = async (next: boolean) => {
    if (!user?.hasAccount) return;
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
    if (!user) return;
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
    if (!user?.hasAccount || !selectedRole || selectedRole === user.roleCode) return;
    try {
      await changeRoleMutation.mutateAsync({
        toggleId: user.toggleId,
        source: user.source,
        role: selectedRole,
      });
      setRoleDraft(null);
      showToast('success', 'Đã cập nhật vai trò');
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Không thể đổi vai trò'));
    }
  };

  return {
    source,
    user,
    isLoading,
    isError,
    roleOptions,
    subtitle,
    canEditProfile,
    showProvision,
    setShowProvision,
    showReset,
    setShowReset,
    lockConfirmOpen,
    setLockConfirmOpen,
    editingProfile,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    profileErrors,
    selectedRole,
    setSelectedRole,
    roleDirty,
    toggleTitle,
    toggleHint,
    isToggling: toggleMutation.isPending,
    isChangingRole: changeRoleMutation.isPending,
    isSavingProfile: updateProfileMutation.isPending,
    goBack,
    startEditProfile,
    cancelEditProfile,
    handleSaveProfile,
    handleToggle,
    handleLockConfirm,
    handleChangeRole,
  };
}
