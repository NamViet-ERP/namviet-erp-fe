import { USE_MOCK } from '../lib/mock';
import { apiClient } from '../lib/apiClient';
import type { CreateSystemUserDto } from '../constants/systemUsers';

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

    const mock = await import('./mocks/adminUsersService.mock');
    return mock.listAdminUsersMock(params);
  },

  async getById(id: string, source: AdminUserSource): Promise<AdminUserRow> {
    if (!USE_MOCK) {
      return apiClient.get<AdminUserRow>(`${USERS_ENDPOINT}/${id}`, { source });
    }

    const mock = await import('./mocks/adminUsersService.mock');
    return mock.getAdminUserMock(id, source);
  },

  async create(dto: CreateManualAccountDto): Promise<AdminUserRow> {
    if (!USE_MOCK) {
      return apiClient.post<AdminUserRow>(`${USERS_ENDPOINT}/system`, dto);
    }

    const mock = await import('./mocks/adminUsersService.mock');
    return mock.createManualAccountMock(dto);
  },

  async provisionAccount(dto: ProvisionAccountDto): Promise<AdminUserRow> {
    if (!USE_MOCK) {
      return apiClient.post<AdminUserRow>(`${USERS_ENDPOINT}/provision`, dto);
    }

    const mock = await import('./mocks/adminUsersService.mock');
    return mock.provisionAccountMock(dto);
  },

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    if (!USE_MOCK) {
      await apiClient.put<void>(`${USERS_ENDPOINT}/${dto.accountUserId}/password`, {
        password: dto.password,
      });
      return;
    }

    const mock = await import('./mocks/adminUsersService.mock');
    return mock.resetPasswordMock(dto);
  },

  async toggleStatus(toggleId: string, enabled: boolean, source: AdminUserSource): Promise<void> {
    if (!USE_MOCK) {
      await apiClient.patch<void>(`${USERS_ENDPOINT}/${toggleId}/status?source=${source}`, { enabled });
      return;
    }

    const mock = await import('./mocks/adminUsersService.mock');
    return mock.toggleAdminUserStatusMock(toggleId, enabled, source);
  },

  async changeRole(dto: ChangeAdminUserRoleDto): Promise<AdminUserRow> {
    if (!USE_MOCK) {
      return apiClient.patch<AdminUserRow>(
        `${USERS_ENDPOINT}/${dto.toggleId}/role?source=${dto.source}`,
        { role: dto.role },
      );
    }

    const mock = await import('./mocks/adminUsersService.mock');
    return mock.changeAdminRoleMock(dto);
  },
};
