import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';
import { readStore } from './mocks/rolesMockStore';

export interface SystemRole {
  code: string;
  label: string;
  isActive: boolean;
}

const ROLES_ENDPOINT = '/api/admin/roles';

export interface CreateRoleDto {
  label: string;
}

export interface UpdateRoleDto {
  label: string;
}

export interface RoleListParams {
  search?: string;
  activeOnly?: boolean;
}

export const rolesService = {
  list(): SystemRole[] {
    return readStore();
  },

  async listActiveOptions(): Promise<{ value: string; label: string }[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/rolesService.mock');
      return mock.listActiveRoleOptionsMock();
    }
    const roles = await apiClient.get<SystemRole[]>(ROLES_ENDPOINT, { activeOnly: true });
    return roles.map(r => ({ value: r.code, label: r.label }));
  },

  getLabel(code: string): string | undefined {
    return readStore().find(r => r.code === code)?.label;
  },

  getActiveLabel(code: string): string | undefined {
    const role = readStore().find(r => r.code === code);
    return role?.isActive ? role.label : undefined;
  },

  async listAsync(params: RoleListParams = {}): Promise<SystemRole[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/rolesService.mock');
      return mock.listRolesMock(params);
    }
    return apiClient.get<SystemRole[]>(ROLES_ENDPOINT, {
      search: params.search?.trim() || undefined,
      activeOnly: params.activeOnly ?? false,
    });
  },

  async create(dto: CreateRoleDto): Promise<SystemRole> {
    if (USE_MOCK) {
      const mock = await import('./mocks/rolesService.mock');
      return mock.createRoleMock(dto);
    }

    return apiClient.post<SystemRole>(ROLES_ENDPOINT, {
      label: dto.label.trim(),
    });
  },

  async toggleStatus(code: string): Promise<SystemRole> {
    if (USE_MOCK) {
      const mock = await import('./mocks/rolesService.mock');
      return mock.toggleRoleStatusMock(code);
    }

    return apiClient.patch<SystemRole>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}/toggle`);
  },

  async updateLabel(code: string, dto: UpdateRoleDto): Promise<SystemRole> {
    if (USE_MOCK) {
      const mock = await import('./mocks/rolesService.mock');
      return mock.updateRoleLabelMock(code, dto);
    }

    return apiClient.patch<SystemRole>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}`, {
      label: dto.label.trim(),
    });
  },

  async remove(code: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/rolesService.mock');
      return mock.removeRoleMock(code);
    }

    await apiClient.delete<void>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}`);
  },
};
