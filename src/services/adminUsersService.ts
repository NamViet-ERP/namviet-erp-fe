import { mockDelay, USE_MOCK } from '../lib/mock';
import {
  createSystemUser,
  getSystemUserByEmployeeId,
  getSystemUsers,
  isEmployeeLoginActive,
  isUserAccountActive,
  setAccountEnabled,
  type CreateSystemUserDto,
  type SystemUser,
} from '../constants/systemUsers';
import { employeesService } from './employeesService';
import type { Employee } from '../types/hr';

export type AdminUserSource = 'employee' | 'manual';

export interface AdminUserRow {
  id: string;
  toggleId: string;
  source: AdminUserSource;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  statusLabel: string;
  isActive: boolean;
  canToggle: boolean;
  createdAt: string;
}

function buildEmployeeRow(employee: Employee, linkedUser?: SystemUser): AdminUserRow {
  const isActive = isEmployeeLoginActive(employee);
  return {
    id: employee.id,
    toggleId: employee.id,
    source: 'employee',
    employeeCode: employee.code ?? '—',
    fullName: employee.fullName,
    email: linkedUser?.email ?? employee.personalEmail ?? '—',
    phone: employee.personalPhone ?? linkedUser?.phone ?? '—',
    department: employee.department ?? '—',
    position: employee.position ?? '—',
    role: linkedUser?.roleLabel ?? 'Chưa phân quyền',
    statusLabel: isActive ? 'Hoạt động' : 'Khóa',
    isActive,
    canToggle: employee.status !== 'Nghỉ việc',
    createdAt: employee.joinDate,
  };
}

function buildManualRow(user: SystemUser): AdminUserRow {
  const isActive = isUserAccountActive(user);
  return {
    id: user.id,
    toggleId: user.id,
    source: 'manual',
    employeeCode: user.employeeCode ?? '—',
    fullName: user.name,
    email: user.email,
    phone: user.phone ?? '—',
    department: user.department ?? '—',
    position: user.position ?? '—',
    role: user.roleLabel,
    statusLabel: isActive ? 'Hoạt động' : 'Khóa',
    isActive,
    canToggle: true,
    createdAt: user.createdAt,
  };
}

export const adminUsersService = {
  async list(): Promise<AdminUserRow[]> {
    if (!USE_MOCK) {
      throw new Error('API quản lý người dùng chưa được triển khai');
    }

    const employees = await employeesService.list();
    const employeeIds = new Set(employees.map(e => e.id));
    const allUsers = getSystemUsers();

    const employeeRows = employees.map(emp =>
      buildEmployeeRow(emp, getSystemUserByEmployeeId(emp.id)),
    );

    const manualRows = allUsers
      .filter(u => !u.employeeId || !employeeIds.has(u.employeeId))
      .map(buildManualRow);

    return mockDelay([...employeeRows, ...manualRows]);
  },

  async create(dto: CreateSystemUserDto): Promise<AdminUserRow> {
    if (!USE_MOCK) {
      throw new Error('API quản lý người dùng chưa được triển khai');
    }

    const user = createSystemUser(dto);
    return mockDelay(buildManualRow(user));
  },

  async toggleStatus(toggleId: string, enabled: boolean, source: AdminUserSource): Promise<void> {
    if (!USE_MOCK) {
      throw new Error('API quản lý người dùng chưa được triển khai');
    }

    if (source === 'employee') {
      const employee = await employeesService.getById(toggleId);
      if (employee.status === 'Nghỉ việc') {
        throw new Error('Không thể bật tài khoản cho nhân viên đã nghỉ việc');
      }
    }

    setAccountEnabled(toggleId, enabled);
    return mockDelay(undefined);
  },
};
