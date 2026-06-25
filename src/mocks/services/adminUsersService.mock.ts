import { mockDelay } from '../index';
import { compareEmployeeCodeNewestFirst } from '../../lib/hrm/suggestedEmployeeCode';
import {
  createSystemUser,
  getSessionUser,
  getSystemUserByEmployeeId,
  getSystemUsers,
  isEmployeeLoginActive,
  isUserAccountActive,
  setAccountEnabled,
  setUserPassword,
  type SystemUser,
} from '../../constants/systemUsers';
import { isCurrentAdminUserRow } from '../../lib/admin/isCurrentAdminUser';
import { employeesService } from '../../services/employeesService';
import type { Employee } from '../../types/hr';
import type {
  AdminUserListParams,
  AdminUserListSummary,
  AdminUserPagedResult,
  AdminUserRow,
  AdminUserSource,
  ChangeAdminUserRoleDto,
  CreateManualAccountDto,
  ProvisionAccountDto,
  ResetPasswordDto,
} from '../../services/adminUsersService';

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

function buildSummary(rows: AdminUserRow[]): AdminUserListSummary {
  return {
    total: rows.length,
    pending: rows.filter(u => u.source === 'employee' && !u.hasAccount).length,
    active: rows.filter(u => u.hasAccount && u.isActive).length,
    inactive: rows.filter(u => u.hasAccount && !u.isActive).length,
  };
}

function matchesAccountStatus(
  row: AdminUserRow,
  status: NonNullable<AdminUserListParams['accountStatus']>,
): boolean {
  if (status === 'pending') return !row.hasAccount;
  if (status === 'active') return row.hasAccount && row.isActive;
  return row.hasAccount && !row.isActive;
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

  filtered = [...filtered].sort((a, b) =>
    compareEmployeeCodeNewestFirst({ code: a.employeeCode }, { code: b.employeeCode }),
  );

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  return { items, totalCount, page, pageSize, totalPages, summary };
}

export async function listAdminUsersMock(
  params: AdminUserListParams = {},
): Promise<AdminUserPagedResult> {
  return mockList(params);
}

export async function getAdminUserMock(id: string, source: AdminUserSource): Promise<AdminUserRow> {
  const allRows = await buildAllMockRows();
  const row = allRows.find(u => u.id === id && u.source === source);
  if (!row) throw new Error('Không tìm thấy người dùng');
  return mockDelay(row);
}

export async function createManualAccountMock(dto: CreateManualAccountDto): Promise<AdminUserRow> {
  const user = createSystemUser(dto);
  setUserPassword(user.id, dto.password);
  return mockDelay(buildManualRow(user));
}

export async function provisionAccountMock(dto: ProvisionAccountDto): Promise<AdminUserRow> {
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
}

export async function resetPasswordMock(dto: ResetPasswordDto): Promise<void> {
  const exists = getSystemUsers().some(u => u.id === dto.accountUserId);
  if (!exists) throw new Error('Không tìm thấy tài khoản');
  setUserPassword(dto.accountUserId, dto.password);
  return mockDelay(undefined);
}

export async function toggleAdminUserStatusMock(
  toggleId: string,
  enabled: boolean,
  source: AdminUserSource,
): Promise<void> {
  if (source === 'employee') {
    const employee = await employeesService.getById(toggleId);
    if (employee.status === 'Nghỉ việc') {
      throw new Error('Không thể bật tài khoản cho nhân viên đã nghỉ việc');
    }
    if (!getSystemUserByEmployeeId(toggleId)) {
      throw new Error('Nhân viên chưa được cấp tài khoản');
    }
  }

  if (!enabled) {
    const session = getSessionUser();
    if (session) {
      const row =
        source === 'employee'
          ? {
              id: toggleId,
              accountUserId: getSystemUserByEmployeeId(toggleId)?.id,
              source,
              email: getSystemUserByEmployeeId(toggleId)?.email,
              employeeCode: undefined,
            }
          : {
              id: toggleId,
              accountUserId: toggleId,
              source,
              email: getSystemUsers().find(u => u.id === toggleId)?.email,
              employeeCode: getSystemUsers().find(u => u.id === toggleId)?.employeeCode,
            };
      if (isCurrentAdminUserRow(session, row)) {
        throw new Error('Không thể khóa tài khoản đang đăng nhập.');
      }
    }
  }

  setAccountEnabled(toggleId, enabled);
  return mockDelay(undefined);
}

export async function changeAdminRoleMock(dto: ChangeAdminUserRoleDto): Promise<AdminUserRow> {
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
}
