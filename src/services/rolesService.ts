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

function sortByLabel<T extends { label: string }>(roles: T[]): T[] {
  return [...roles].sort((a, b) => a.label.localeCompare(b.label, 'vi', { sensitivity: 'base' }));
}

export function isSameRoleLabel(a: string, b: string): boolean {
  return a.trim().replace(/\s+/g, ' ').localeCompare(b.trim().replace(/\s+/g, ' '), 'vi', { sensitivity: 'base' }) === 0;
}

export const rolesService = {
  async listActiveOptions(): Promise<{ value: string; label: string }[]> {
    const roles = await apiClient.get<SystemRole[]>(ROLES_ENDPOINT, { activeOnly: true });
    return sortByLabel(roles).map((r) => ({ value: r.code, label: r.label }));
  },

  async listAsync(params: RoleListParams = {}): Promise<SystemRole[]> {
    const roles = await apiClient.get<SystemRole[]>(ROLES_ENDPOINT, {
      search: params.search?.trim() || undefined,
      activeOnly: params.activeOnly ?? false,
    });
    return sortByLabel(roles);
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
