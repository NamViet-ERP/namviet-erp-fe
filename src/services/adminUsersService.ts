import { mockDelay, USE_MOCK } from '../lib/mock';
import { apiClient } from '../lib/apiClient';
import {
  createSystemUser,
  getSystemUserByEmployeeId,
  getSystemUsers,
  isEmployeeLoginActive,
  isUserAccountActive,
  setAccountEnabled,
  setUserPassword,
  type CreateSystemUserDto,
  type SystemUser,
} from '../constants/systemUsers';
import { employeesService } from './employeesService';
import type { Employee } from '../types/hr';

const USERS_ENDPOINT = '/api/admin/users';

export type AdminUserSource = 'employee' | 'manual';

export interface AdminUserRow {
  id: string;
  toggleId: string;
  accountUserId?: string;
  source: AdminUserSource;
  hasAccount: boolean;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  roleCode: string;
  statusLabel: string;
  isActive: boolean;
  canToggle: boolean;
  canProvision: boolean;
  createdAt: string;
}

export interface ChangeAdminUserRoleDto {
  toggleId: string;
  source: AdminUserSource;
  role: string;
}

export interface ProvisionAccountDto {
  employeeId: string;
  role: string;
  password: string;
}

export interface CreateManualAccountDto extends CreateSystemUserDto {
  password: string;
}

export interface ResetPasswordDto {
  accountUserId: string;
  password: string;
}

export interface AdminUserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  pendingOnly?: boolean;
  accountStatus?: '' | 'pending' | 'active' | 'locked';
  source?: '' | 'employee' | 'manual';
  department?: string;
}

export interface AdminUserListSummary {
  total: number;
  pending: number;
  active: number;
  inactive: number;
}

export interface AdminUserPagedResult {
  items: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: AdminUserListSummary;
}

interface AdminUserPagedApiDto {
  items: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: AdminUserListSummary;
}

function matchesSearch(row: AdminUserRow, search: string): boolean {
  const q = search.toLowerCase();
  return (
    row.fullName.toLowerCase().includes(q) ||
    row.email.toLowerCase().includes(q) ||
    row.employeeCode.toLowerCase().includes(q) ||
    row.phone.toLowerCase().includes(q) ||
    row.department.toLowerCase().includes(q) ||
    row.position.toLowerCase().includes(q) ||
    row.role.toLowerCase().includes(q) ||
    row.statusLabel.toLowerCase().includes(q)
  );
}

async function buildAllMockRows(): Promise<AdminUserRow[]> {
  const employees = await employeesService.list();
  const employeeIds = new Set(employees.map(e => e.id));
  const allUsers = getSystemUsers();

  const employeeRows = employees.map(emp =>
    buildEmployeeRow(emp, getSystemUserByEmployeeId(emp.id)),
  );

  const manualRows = allUsers
    .filter(u => !u.employeeId || !employeeIds.has(u.employeeId))
    .map(buildManualRow);

  return [...employeeRows, ...manualRows];
}

function buildSummary(rows: AdminUserRow[]): AdminUserListSummary {
  return {
    total: rows.length,
    pending: rows.filter(u => u.source === 'employee' && !u.hasAccount).length,
    active: rows.filter(u => u.hasAccount && u.isActive).length,
    inactive: rows.filter(u => u.hasAccount && !u.isActive).length,
  };
}

function matchesAccountStatus(row: AdminUserRow, status: NonNullable<AdminUserListParams['accountStatus']>): boolean {
  if (status === 'pending') return !row.hasAccount;
  if (status === 'active') return row.hasAccount && row.isActive;
  return row.hasAccount && !row.isActive;
}

export function rowMatchesListFilters(row: AdminUserRow, params: AdminUserListParams): boolean {
  if (params.pendingOnly && !(row.source === 'employee' && !row.hasAccount)) return false;
  if (params.search?.trim() && !matchesSearch(row, params.search)) return false;
  if (params.accountStatus && !matchesAccountStatus(row, params.accountStatus)) return false;
  if (params.source && row.source !== params.source) return false;
  if (params.department?.trim()) {
    const q = params.department.trim().toLowerCase();
    if (!row.department.toLowerCase().includes(q)) return false;
  }
  return true;
}

async function mockList(params: AdminUserListParams): Promise<AdminUserPagedResult> {
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const allRows = await buildAllMockRows();
  const summary = buildSummary(allRows);

  let filtered = allRows;
  if (params.pendingOnly) {
    filtered = filtered.filter(u => u.source === 'employee' && !u.hasAccount);
  }
  const q = params.search?.trim();
  if (q) filtered = filtered.filter(u => matchesSearch(u, q));
  if (params.accountStatus) filtered = filtered.filter(u => matchesAccountStatus(u, params.accountStatus!));
  if (params.source) filtered = filtered.filter(u => u.source === params.source);
  const dept = params.department?.trim();
  if (dept) filtered = filtered.filter(u => u.department.toLowerCase().includes(dept.toLowerCase()));

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  return { items, totalCount, page, pageSize, totalPages, summary };
}

function buildEmployeeRow(employee: Employee, linkedUser?: SystemUser): AdminUserRow {
  const resigned = employee.status === 'Nghỉ việc';

  if (!linkedUser) {
    return {
      id: employee.id,
      toggleId: employee.id,
      source: 'employee',
      hasAccount: false,
      employeeCode: employee.code ?? '—',
      fullName: employee.fullName,
      email: employee.personalEmail ?? '—',
      phone: employee.personalPhone ?? '—',
      department: employee.department ?? '—',
      position: employee.position ?? '—',
      role: '—',
      roleCode: '—',
      statusLabel: 'Chưa cấp tài khoản',
      isActive: false,
      canToggle: false,
      canProvision: !resigned,
      createdAt: employee.joinDate,
    };
  }

  const isActive = isEmployeeLoginActive(employee);
  return {
    id: employee.id,
    toggleId: employee.id,
    accountUserId: linkedUser.id,
    source: 'employee',
    hasAccount: true,
    employeeCode: employee.code ?? '—',
    fullName: employee.fullName,
    email: linkedUser.email ?? employee.personalEmail ?? '—',
    phone: employee.personalPhone ?? linkedUser.phone ?? '—',
    department: employee.department ?? '—',
    position: employee.position ?? '—',
    role: linkedUser.roleLabel,
    roleCode: linkedUser.role,
    statusLabel: isActive ? 'Hoạt động' : 'Khóa',
    isActive,
    canToggle: !resigned,
    canProvision: false,
    createdAt: employee.joinDate,
  };
}

function buildManualRow(user: SystemUser): AdminUserRow {
  const isActive = isUserAccountActive(user);
  return {
    id: user.id,
    toggleId: user.id,
    accountUserId: user.id,
    source: 'manual',
    hasAccount: true,
    employeeCode: user.employeeCode ?? '—',
    fullName: user.name,
    email: user.email,
    phone: user.phone ?? '—',
    department: user.department ?? '—',
    position: user.position ?? '—',
    role: user.roleLabel,
    roleCode: user.role,
    statusLabel: isActive ? 'Hoạt động' : 'Khóa',
    isActive,
    canToggle: true,
    canProvision: false,
    createdAt: user.createdAt,
  };
}

export const adminUsersService = {
  async list(params: AdminUserListParams = {}): Promise<AdminUserPagedResult> {
    if (!USE_MOCK) {
      return apiClient.get<AdminUserPagedApiDto>(USERS_ENDPOINT, {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
        search: params.search?.trim() || undefined,
        pendingOnly: params.pendingOnly ?? false,
        accountStatus: params.accountStatus || undefined,
        source: params.source || undefined,
        department: params.department?.trim() || undefined,
      });
    }

    return mockDelay(mockList(params));
  },

  async getById(id: string, source: AdminUserSource): Promise<AdminUserRow> {
    if (!USE_MOCK) {
      return apiClient.get<AdminUserRow>(`${USERS_ENDPOINT}/${id}`, { source });
    }

    const allRows = await buildAllMockRows();
    const row = allRows.find(u => u.id === id && u.source === source);
    if (!row) throw new Error('Không tìm thấy người dùng');
    return mockDelay(row);
  },

  async create(dto: CreateManualAccountDto): Promise<AdminUserRow> {
    if (!USE_MOCK) {
      return apiClient.post<AdminUserRow>(`${USERS_ENDPOINT}/system`, dto);
    }

    const user = createSystemUser(dto);
    setUserPassword(user.id, dto.password);
    return mockDelay(buildManualRow(user));
  },

  async provisionAccount(dto: ProvisionAccountDto): Promise<AdminUserRow> {
    if (!USE_MOCK) {
      return apiClient.post<AdminUserRow>(`${USERS_ENDPOINT}/provision`, dto);
    }

    const employee = await employeesService.getById(dto.employeeId);
    if (employee.status === 'Nghỉ việc') {
      throw new Error('Không thể cấp tài khoản cho nhân viên đã nghỉ việc');
    }
    if (getSystemUserByEmployeeId(dto.employeeId)) {
      throw new Error('Nhân viên đã có tài khoản hệ thống');
    }

    const email = employee.personalEmail?.trim();
    if (!email) throw new Error('Nhân viên chưa có email — cập nhật hồ sơ HR trước');

    const user = createSystemUser({
      name: employee.fullName,
      email,
      phone: employee.personalPhone,
      employeeCode: employee.code,
      department: employee.department,
      position: employee.position,
      role: dto.role,
      employeeId: dto.employeeId,
    });
    setUserPassword(user.id, dto.password);
    setAccountEnabled(employee.id, true);

    return mockDelay(buildEmployeeRow(employee, user));
  },

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    if (!USE_MOCK) {
      await apiClient.put<void>(`${USERS_ENDPOINT}/${dto.accountUserId}/password`, {
        password: dto.password,
      });
      return;
    }

    const exists = getSystemUsers().some(u => u.id === dto.accountUserId);
    if (!exists) throw new Error('Không tìm thấy tài khoản');

    setUserPassword(dto.accountUserId, dto.password);
    return mockDelay(undefined);
  },

  async toggleStatus(toggleId: string, enabled: boolean, source: AdminUserSource): Promise<void> {
    if (!USE_MOCK) {
      await apiClient.patch<void>(`${USERS_ENDPOINT}/${toggleId}/status?source=${source}`, { enabled });
      return;
    }

    if (source === 'employee') {
      const employee = await employeesService.getById(toggleId);
      if (employee.status === 'Nghỉ việc') {
        throw new Error('Không thể bật tài khoản cho nhân viên đã nghỉ việc');
      }
      if (!getSystemUserByEmployeeId(toggleId)) {
        throw new Error('Nhân viên chưa được cấp tài khoản');
      }
    }

    setAccountEnabled(toggleId, enabled);
    return mockDelay(undefined);
  },

  async changeRole(dto: ChangeAdminUserRoleDto): Promise<AdminUserRow> {
    if (!USE_MOCK) {
      return apiClient.patch<AdminUserRow>(
        `${USERS_ENDPOINT}/${dto.toggleId}/role?source=${dto.source}`,
        { role: dto.role },
      );
    }

    if (dto.source === 'employee') {
      const employee = await employeesService.getById(dto.toggleId);
      const linked = getSystemUserByEmployeeId(dto.toggleId);
      if (!linked) throw new Error('Không tìm thấy tài khoản');
      linked.role = dto.role as SystemUser['role'];
      return mockDelay(buildEmployeeRow(employee, linked));
    }

    const user = getSystemUsers().find(u => u.id === dto.toggleId);
    if (!user) throw new Error('Không tìm thấy tài khoản');
    user.role = dto.role as SystemUser['role'];
    return mockDelay(buildManualRow(user));
  },
};
