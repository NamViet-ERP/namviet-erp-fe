import type { MouseEvent } from 'react';
import { KeyRound, UserCog, UserX } from 'lucide-react';
import AdminAccountSwitch from '../../../components/admin/AdminAccountSwitch';
import Button from '../../../components/ui/Button';
import EntityCodeLink from '../../../components/ui/EntityCodeLink';
import StatusBadge from '../../../components/ui/StatusBadge';
import TableShell from '../../../components/ui/TableShell';
import type { ListPageSize } from '../../../constants/pagination';
import { getInteractiveRowProps } from '../../../lib/a11y/interactiveRow';
import { adminUserToggleKey } from '../../../lib/admin/isCurrentAdminUser';
import { getApiErrorMessage } from '../../../lib/apiClient';
import { formatAdminDateCell } from '../../../lib/hrm/formatters';
import { UI_ERROR } from '../../../lib/uiMessages';
import type { AdminUserRow } from '../../../services/adminUsersService';

interface AdminUsersTableProps {
  users: AdminUserRow[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  hasFilters: boolean;
  displayPage: number;
  totalPages: number;
  pageSize: ListPageSize;
  totalCount: number;
  togglingKey: string | null;
  isSelfAccount: (user: AdminUserRow) => boolean;
  onRowNavigate: (user: AdminUserRow) => void;
  onRequestToggle: (user: AdminUserRow, next: boolean) => void;
  onProvision: (user: AdminUserRow) => void;
  onResetPassword: (user: AdminUserRow) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ListPageSize) => void;
}

function cellDash(value?: string): string {
  if (!value || value === '—' || value.trim() === '') return '-';
  return value;
}

function toggleButtonTitle(user: AdminUserRow, isSelf: boolean): string {
  if (user.isActive && isSelf) return 'Không thể khóa tài khoản đang đăng nhập';
  if (!user.canToggle) return 'Nhân viên đã nghỉ việc';
  return user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
}

function renderToggleCell(
  user: AdminUserRow,
  isSelf: boolean,
  togglingKey: string | null,
  onRequestToggle: (user: AdminUserRow, next: boolean) => void,
) {
  if (!user.hasAccount) return <span className="admin-users-empty">-</span>;
  return (
    <AdminAccountSwitch
      checked={user.isActive}
      disabled={!user.canToggle || togglingKey === adminUserToggleKey(user)}
      onChange={next => onRequestToggle(user, next)}
      title={toggleButtonTitle(user, isSelf)}
    />
  );
}

export default function AdminUsersTable({
  users, isPending, isError, error, hasFilters, displayPage, totalPages, pageSize, totalCount,
  togglingKey, isSelfAccount, onRowNavigate, onRequestToggle, onProvision, onResetPassword,
  onPageChange, onPageSizeChange,
}: AdminUsersTableProps) {
  const handleRowClick = (user: AdminUserRow, e: MouseEvent<HTMLTableRowElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="switch"]')) return;
    onRowNavigate(user);
  };

  const emptyMessage = isError
    ? getApiErrorMessage(error, UI_ERROR.loadUsers)
    : hasFilters
      ? 'Không có tài khoản phù hợp bộ lọc.'
      : 'Chưa có dữ liệu người dùng.';

  const pagination = totalCount > 0 && !isPending
    ? {
        embedded: true,
        itemLabel: 'tài khoản',
        currentPage: displayPage,
        totalPages,
        pageSize,
        totalItems: totalCount,
        onPageChange,
        onPageSizeChange,
      }
    : undefined;

  return (
    <TableShell
      tableClassName="w-full min-w-max border-collapse hrm-table admin-users-table"
      colSpan={11}
      loading={isPending}
      isEmpty={isError || users.length === 0}
      emptyMessage={emptyMessage}
      emptyIcon={isError ? UserX : UserCog}
      pagination={pagination}
      header={
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
      }
    >
      {users.map(user => (
        <tr
          key={`${user.source}-${user.id}`}
          className="table-row hrm-table-row--interactive"
          onClick={e => handleRowClick(user, e)}
          {...getInteractiveRowProps(() => onRowNavigate(user), `Xem chi tiết tài khoản ${user.fullName}`)}
          title="Xem chi tiết"
        >
          <td className="table-cell admin-users-col-code">
            {user.employeeCode && user.employeeCode !== '—' ? (
              <EntityCodeLink code={user.employeeCode} to={`/admin/users/${user.id}?source=${user.source}`} />
            ) : (
              <span className="entity-code">-</span>
            )}
          </td>
          <td className="table-cell member-name">{user.fullName}</td>
          <td className="table-cell"><span className="admin-users-email">{cellDash(user.email)}</span></td>
          <td className="table-cell whitespace-nowrap">{cellDash(user.phone)}</td>
          <td className="table-cell">{cellDash(user.department)}</td>
          <td className="table-cell">{cellDash(user.position)}</td>
          <td className="table-cell">{cellDash(user.role)}</td>
          <td className="table-cell">
            <StatusBadge tone={!user.hasAccount ? 'warning' : user.isActive ? 'success' : 'error'} label={user.statusLabel} />
          </td>
          <td className="table-cell whitespace-nowrap tabular-nums">{cellDash(formatAdminDateCell(user.createdAt))}</td>
          <td
            className="table-cell text-center"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            {renderToggleCell(user, isSelfAccount(user), togglingKey, onRequestToggle)}
          </td>
          <td className="table-cell whitespace-nowrap" onClick={e => e.stopPropagation()}>
            <div className="admin-users-row-actions">
              {user.canProvision && (
                <Button type="button" variant="filled" size="sm" onClick={() => onProvision(user)}>
                  Cấp tài khoản
                </Button>
              )}
              {user.hasAccount && user.accountUserId && (
                <Button type="button" variant="outlined" size="sm" leftIcon={KeyRound} onClick={() => onResetPassword(user)}>
                  Đặt lại MK
                </Button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </TableShell>
  );
}
