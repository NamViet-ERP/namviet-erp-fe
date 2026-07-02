import { apiClient } from '../lib/apiClient';

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
  async listActiveOptions(): Promise<{ value: string; label: string }[]> {
    const roles = await apiClient.get<SystemRole[]>(ROLES_ENDPOINT, { activeOnly: true });
    return roles.map((r) => ({ value: r.code, label: r.label }));
  },

  async listAsync(params: RoleListParams = {}): Promise<SystemRole[]> {
    return apiClient.get<SystemRole[]>(ROLES_ENDPOINT, {
      search: params.search?.trim() || undefined,
      activeOnly: params.activeOnly ?? false,
    });
  },

  async create(dto: CreateRoleDto): Promise<SystemRole> {
    return apiClient.post<SystemRole>(ROLES_ENDPOINT, { label: dto.label.trim() });
  },

  async toggleStatus(code: string): Promise<SystemRole> {
    return apiClient.patch<SystemRole>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}/toggle`);
  },

  async updateLabel(code: string, dto: UpdateRoleDto): Promise<SystemRole> {
    return apiClient.patch<SystemRole>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}`, {
      label: dto.label.trim(),
    });
  },

  async remove(code: string): Promise<void> {
    await apiClient.delete<void>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}`);
  },
};
