import { apiClient } from '../lib/apiClient';

const ROLES_ENDPOINT = '/api/admin/roles';

export interface PermissionCatalogEntryApiDto {
  key: string;
  module: string;
  resource: string;
  label: string;
}

export interface RolePermissionsApiDto {
  roleCode: string;
  permissions: string[];
}

export interface UpdateRolePermissionsApiDto {
  permissions: string[];
}

export const rolePermissionsService = {
  getCatalog(): Promise<PermissionCatalogEntryApiDto[]> {
    return apiClient.get<PermissionCatalogEntryApiDto[]>(`${ROLES_ENDPOINT}/permissions/catalog`);
  },

  getRolePermissions(code: string): Promise<RolePermissionsApiDto> {
    return apiClient.get<RolePermissionsApiDto>(
      `${ROLES_ENDPOINT}/${encodeURIComponent(code)}/permissions`,
    );
  },

  updateRolePermissions(code: string, permissions: string[]): Promise<RolePermissionsApiDto> {
    return apiClient.put<RolePermissionsApiDto>(
      `${ROLES_ENDPOINT}/${encodeURIComponent(code)}/permissions`,
      { permissions },
    );
  },
};
