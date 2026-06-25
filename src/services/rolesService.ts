import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';
import { readStore } from '../mocks/services/rolesMockStore';

export interface SystemRole {
  code: string;
  label: string;
  isActive: boolean;
}

const ROLES_ENDPOINT = '/api/admin/roles';
const MOCK = () => import('../mocks/services/rolesService.mock');

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
    return resolveMock(
      () => MOCK().then((m) => m.listActiveRoleOptionsMock()),
      async () => {
        const roles = await apiClient.get<SystemRole[]>(ROLES_ENDPOINT, { activeOnly: true });
        return roles.map((r) => ({ value: r.code, label: r.label }));
      },
    );
  },

  getLabel(code: string): string | undefined {
    return readStore().find((r) => r.code === code)?.label;
  },

  getActiveLabel(code: string): string | undefined {
    const role = readStore().find((r) => r.code === code);
    return role?.isActive ? role.label : undefined;
  },

  async listAsync(params: RoleListParams = {}): Promise<SystemRole[]> {
    return resolveMock(
      () => MOCK().then((m) => m.listRolesMock(params)),
      () => apiClient.get<SystemRole[]>(ROLES_ENDPOINT, {
        search: params.search?.trim() || undefined,
        activeOnly: params.activeOnly ?? false,
      }),
    );
  },

  async create(dto: CreateRoleDto): Promise<SystemRole> {
    return resolveMock(
      () => MOCK().then((m) => m.createRoleMock(dto)),
      () => apiClient.post<SystemRole>(ROLES_ENDPOINT, { label: dto.label.trim() }),
    );
  },

  async toggleStatus(code: string): Promise<SystemRole> {
    return resolveMock(
      () => MOCK().then((m) => m.toggleRoleStatusMock(code)),
      () => apiClient.patch<SystemRole>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}/toggle`),
    );
  },

  async updateLabel(code: string, dto: UpdateRoleDto): Promise<SystemRole> {
    return resolveMock(
      () => MOCK().then((m) => m.updateRoleLabelMock(code, dto)),
      () => apiClient.patch<SystemRole>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}`, {
        label: dto.label.trim(),
      }),
    );
  },

  async remove(code: string): Promise<void> {
    return resolveMock(
      () => MOCK().then((m) => m.removeRoleMock(code)),
      async () => { await apiClient.delete<void>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}`); },
    );
  },
};
