import { useMemo, useState } from 'react';
import { Plus, UserCog, UserCheck, UserX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import HrmPanel from '../../components/hr/HrmPanel';
import HrmStatCard from '../../components/hr/HrmStatCard';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import { showToast } from '../../components/ui/Toast';
import {
  type CreateSystemUserDto,
  type SystemUserRole,
} from '../../constants/systemUsers';
import {
  useAdminUsers,
  useCreateAdminUser,
  useToggleAdminUserStatus,
} from '../../hooks/useAdminUsers';
import { useActiveRoleOptions } from '../../hooks/useRoles';
import type { AdminUserSource } from '../../services/adminUsersService';

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
] as const;

const EMPTY_FORM: CreateSystemUserDto = {
  name: '',
  email: '',
  phone: '',
  employeeCode: '',
  department: '',
  position: '',
  role: 'storekeeper',
};

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

interface IOSSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  title?: string;
}

function IOSSwitch({ checked, disabled, onChange, title }: IOSSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[var(--md-primary)]' : 'bg-gray-400 dark:bg-gray-600'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      role="switch"
      aria-checked={checked}
      title={title ?? (checked ? 'Đang bật' : 'Đang tắt')}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const { data: roleOptions = [] } = useActiveRoleOptions();
  const toggleMutation = useToggleAdminUserStatus();
  const createMutation = useCreateAdminUser();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateSystemUserDto>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
  }), [users]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employeeCode.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.position.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q),
    );
  }, [users, search]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Vui lòng nhập họ tên';
    if (!form.email.trim()) next.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Email không hợp lệ';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        ...form,
        phone: form.phone?.trim() || undefined,
        employeeCode: form.employeeCode?.trim() || undefined,
        department: form.department?.trim() || undefined,
        position: form.position?.trim() || undefined,
      });
      showToast('success', 'Đã thêm người dùng');
      setShowCreate(false);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể thêm người dùng';
      showToast('error', message);
    }
  };

  const handleToggle = async (
    toggleId: string,
    source: AdminUserSource,
    next: boolean,
    canToggle: boolean,
  ) => {
    if (!canToggle) {
      showToast('warning', 'Nhân viên đã nghỉ việc, không thể bật tài khoản');
      return;
    }
    try {
      await toggleMutation.mutateAsync({ toggleId, enabled: next, source });
      showToast('success', next ? 'Đã bật tài khoản' : 'Đã khóa tài khoản');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể thay đổi trạng thái';
      showToast('error', message);
    }
  };

  return (
    <div className="hrm-page">
      <PageHeader
        title="Quản lý người dùng"
        subtitle="Đồng bộ từ quản lý nhân viên; có thể thêm tài khoản thủ công (admin, dịch vụ...)"
        actions={
          <button type="button" className="btn btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Thêm người dùng
          </button>
        }
      />

      <div className="hrm-stat-grid">
        <HrmStatCard label="Tổng người dùng" value={stats.total} icon={UserCog} tone="primary" />
        <HrmStatCard label="Đang hoạt động" value={stats.active} icon={UserCheck} tone="success" />
        <HrmStatCard label="Đã khóa" value={stats.inactive} icon={UserX} tone="warning" />
      </div>

      <HrmPanel>
        <div className="hrm-filter-bar">
          <div className="flex-1 min-w-[220px]">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo tên, mã NV, email, bộ phận..."
            />
          </div>
        </div>
      </HrmPanel>

      <HrmPanel noPadding>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse hrm-table">
            <thead>
              <tr>
                {TABLE_HEADERS.map(h => (
                  <th key={h} className="table-header-cell whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={TABLE_HEADERS.length} className="hrm-empty">Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={TABLE_HEADERS.length} className="hrm-empty">Không có người dùng phù hợp.</td></tr>
              ) : (
                filtered.map(user => (
                  <tr key={`${user.source}-${user.id}`} className="table-row">
                    <td className="table-cell font-mono text-sm text-[var(--md-primary)]">{user.employeeCode}</td>
                    <td className="table-cell font-semibold">{user.fullName}</td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell whitespace-nowrap">{user.phone}</td>
                    <td className="table-cell">{user.department}</td>
                    <td className="table-cell">{user.position}</td>
                    <td className="table-cell">{user.role}</td>
                    <td className="table-cell">
                      <span className={user.isActive ? 'hrm-badge hrm-badge--success' : 'hrm-badge hrm-badge--warning'}>
                        {user.statusLabel}
                      </span>
                    </td>
                    <td className="table-cell whitespace-nowrap">{fmtDate(user.createdAt)}</td>
                    <td className="table-cell text-center">
                      <IOSSwitch
                        checked={user.isActive}
                        disabled={toggleMutation.isPending || !user.canToggle}
                        onChange={next => handleToggle(user.toggleId, user.source, next, user.canToggle)}
                        title={
                          !user.canToggle
                            ? 'Nhân viên đã nghỉ việc'
                            : user.isActive
                              ? 'Khóa tài khoản'
                              : 'Mở khóa tài khoản'
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </HrmPanel>

      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); resetForm(); }}
        title="Thêm người dùng"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={() => { setShowCreate(false); resetForm(); }}>
              Hủy
            </button>
            <button
              type="submit"
              form="admin-user-create-form"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Thêm'}
            </button>
          </>
        }
      >
        <form id="admin-user-create-form" onSubmit={handleCreate} className="space-y-4">
          <FormField label="Họ tên" required error={errors.name}>
            <input
              className="form-input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nguyễn Văn A"
            />
          </FormField>

          <FormField label="Email" required error={errors.email}>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@namviet.vn"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Số điện thoại">
              <input
                className="form-input"
                value={form.phone ?? ''}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="0901234567"
              />
            </FormField>

            <FormField label="Mã nhân viên">
              <input
                className="form-input"
                value={form.employeeCode ?? ''}
                onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))}
                placeholder="NV-0008"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Bộ phận">
              <input
                className="form-input"
                value={form.department ?? ''}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="Kế toán"
              />
            </FormField>

            <FormField label="Chức vụ">
              <input
                className="form-input"
                value={form.position ?? ''}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                placeholder="Chuyên viên"
              />
            </FormField>
          </div>

          <FormField label="Vai trò" required>
            <select
              className="form-select"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as SystemUserRole }))}
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
