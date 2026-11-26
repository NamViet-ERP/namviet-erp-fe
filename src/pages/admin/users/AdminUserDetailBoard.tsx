import AdminAccountSwitch from '../../../components/admin/AdminAccountSwitch';
import HrmSelect from '../../../components/hr/HrmSelect';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import SectionCard from '../../../components/ui/SectionCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatAdminDateCell } from '../../../lib/hrm/formatters';
import type { AdminUserRow, AdminUserSource } from '../../../services/adminUsersService';

interface AdminUserDetailBoardProps {
  user: AdminUserRow;
  source: AdminUserSource;
  roleOptions: { value: string; label: string }[];
  editingProfile: boolean;
  editName: string;
  editEmail: string;
  profileErrors: Record<string, string>;
  isSavingProfile: boolean;
  onEditNameChange: (value: string) => void;
  onEditEmailChange: (value: string) => void;
  onCancelEditProfile: () => void;
  onSaveProfile: () => void;
  selectedRole: string;
  roleDirty: boolean;
  isToggling: boolean;
  isChangingRole: boolean;
  toggleTitle: string;
  toggleHint: string | null;
  onToggle: (next: boolean) => void;
  onSelectedRoleChange: (role: string) => void;
  onChangeRole: () => void;
}

function dash(value?: string): string {
  if (!value || value === '—' || value.trim() === '') return '-';
  return value;
}

export default function AdminUserDetailBoard({
  user, source, roleOptions, editingProfile, editName, editEmail, profileErrors, isSavingProfile,
  onEditNameChange, onEditEmailChange, onCancelEditProfile, onSaveProfile, selectedRole,
  roleDirty, isToggling, isChangingRole, toggleTitle, toggleHint, onToggle,
  onSelectedRoleChange, onChangeRole,
}: AdminUserDetailBoardProps) {
  return (
    <SectionCard noPadding className="admin-user-detail-board">
      <header className="admin-user-detail-board__head">
        <h2 className="admin-user-detail-board__title">Tài khoản hệ thống</h2>
        <StatusBadge
          tone={!user.hasAccount ? 'warning' : user.isActive ? 'success' : 'error'}
          label={user.statusLabel}
        />
      </header>

      {editingProfile ? (
        <div className="admin-user-detail-profile-edit">
          <FormField label="Họ tên" required error={profileErrors.name}>
            <input
              id="admin-user-edit-name"
              className="form-input"
              value={editName}
              onChange={e => onEditNameChange(e.target.value)}
              disabled={isSavingProfile}
              autoComplete="name"
            />
          </FormField>
          <FormField label="Email đăng nhập" required error={profileErrors.email}>
            <input
              id="admin-user-edit-email"
              type="email"
              className="form-input"
              value={editEmail}
              onChange={e => onEditEmailChange(e.target.value)}
              disabled={isSavingProfile}
              autoComplete="email"
            />
          </FormField>
          <div className="admin-user-detail-profile-edit__actions">
            <Button type="button" variant="outlined" disabled={isSavingProfile} onClick={onCancelEditProfile}>
              Hủy
            </Button>
            <Button type="button" variant="filled" disabled={isSavingProfile} onClick={onSaveProfile}>
              {isSavingProfile ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      ) : (
        <dl
          className={
            source === 'manual'
              ? 'admin-user-detail-facts admin-user-detail-facts--cols-4'
              : 'admin-user-detail-facts admin-user-detail-facts--cols-3'
          }
        >
          <div><dt>Họ tên</dt><dd>{dash(user.fullName)}</dd></div>
          <div><dt>Email đăng nhập</dt><dd className="admin-user-detail-facts__mono">{dash(user.email)}</dd></div>
          <div><dt>Loại</dt><dd>{source === 'manual' ? 'Tài khoản hệ thống' : 'Nhân viên HR'}</dd></div>
          {source === 'employee' ? (
            <>
              <div><dt>Số điện thoại</dt><dd>{dash(user.phone)}</dd></div>
              <div><dt>Bộ phận</dt><dd>{dash(user.department)}</dd></div>
              <div><dt>Chức vụ</dt><dd>{dash(user.position)}</dd></div>
            </>
          ) : null}
          <div>
            <dt>{source === 'manual' ? 'Ngày tạo' : 'Ngày tạo / vào làm'}</dt>
            <dd className="tabular-nums">{dash(formatAdminDateCell(user.createdAt))}</dd>
          </div>
        </dl>
      )}

      {user.hasAccount ? (
        <div
          className={
            source === 'manual'
              ? 'admin-user-detail-actions admin-user-detail-actions--cols-4'
              : 'admin-user-detail-actions admin-user-detail-actions--cols-3'
          }
        >
          <div className="admin-user-detail-actions__block">
            <span className="admin-user-detail-actions__label">Tài khoản</span>
            <div className="admin-user-detail-actions__row">
              <AdminAccountSwitch
                checked={user.isActive}
                disabled={isToggling || !user.canToggle}
                onChange={onToggle}
                title={toggleTitle}
              />
            </div>
            {toggleHint && <p className="admin-user-detail-actions__hint">{toggleHint}</p>}
          </div>

          <div className="admin-user-detail-actions__block">
            <div className="admin-user-detail-role">
              <span className="admin-user-detail-actions__label" id="admin-user-role-label">Vai trò</span>
              <div className="admin-user-detail-actions__row">
                <HrmSelect
                  aria-label="Vai trò"
                  value={selectedRole}
                  onChange={onSelectedRoleChange}
                  options={roleOptions}
                  allowEmpty={false}
                  disabled={isChangingRole}
                />
                <Button type="button" variant="filled" disabled={isChangingRole || !roleDirty} onClick={onChangeRole}>
                  {isChangingRole ? 'Đang lưu...' : 'Lưu vai trò'}
                </Button>
              </div>
              {roleDirty && <p className="admin-user-detail-actions__hint admin-user-detail-actions__dirty">Chưa lưu</p>}
            </div>
          </div>
        </div>
      ) : (
        <p className="admin-user-detail-pending">
          Chưa có tài khoản hệ thống.
          {user.canProvision ? ' Dùng Cấp tài khoản ở trên để tạo.' : ''}
        </p>
      )}
    </SectionCard>
  );
}
