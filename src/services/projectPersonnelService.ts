import { apiClient } from '../lib/apiClient';
import { adminUsersService } from './adminUsersService';
import { employeesService } from './employeesService';
import type { ProjectWarehouseKeeperDto } from '../types/wms';

export interface ProjectPersonnelItem {
  id?: string;
  name: string;
  code?: string;
  email?: string;
}

function deduplicateAndSort(items: ProjectPersonnelItem[]): ProjectPersonnelItem[] {
  const seen = new Set<string>();
  const result: ProjectPersonnelItem[] = [];

  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: item.id,
      name: item.name.trim(),
      code: item.code?.trim() || undefined,
      email: item.email?.trim() || undefined,
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export const projectPersonnelService = {
  async getPersonnel(): Promise<ProjectPersonnelItem[]> {
    // 1. Ưu tiên endpoint chuẩn dành riêng cho nhân sự dự án (wms.projects.view:all)
    try {
      const res = await apiClient.get<ProjectPersonnelItem[]>('/api/warehouse/projects/personnel');
      if (Array.isArray(res) && res.length > 0) {
        return deduplicateAndSort(res);
      }
    } catch {
      // Endpoint có thể 404 nếu backend đang chạy debug chưa được build/restart
    }

    // 2. Dự phòng: Thử lấy từ adminUsersService (nếu user có quyền admin)
    try {
      const adminRes = await adminUsersService.list({ pageSize: 100 });
      if (adminRes?.items && adminRes.items.length > 0) {
        const mapped: ProjectPersonnelItem[] = adminRes.items
          .filter(u => u.isActive !== false)
          .map(u => ({
            id: u.id,
            name: u.fullName,
            code: u.employeeCode,
            email: u.email,
          }));
        if (mapped.length > 0) {
          return deduplicateAndSort(mapped);
        }
      }
    } catch {
      // Bỏ qua nếu không có quyền admin.users.view:all
    }

    // 3. Dự phòng: Thử lấy từ employeesService (nếu user có quyền hrm)
    try {
      const empRes = await employeesService.listActive();
      if (Array.isArray(empRes) && empRes.length > 0) {
        const mapped: ProjectPersonnelItem[] = empRes.map(e => ({
          id: e.id,
          name: e.fullName,
          code: e.code,
          email: e.personalEmail,
        }));
        if (mapped.length > 0) {
          return deduplicateAndSort(mapped);
        }
      }
    } catch {
      // Bỏ qua nếu không có quyền hrm.employees.view:all
    }

    // 4. Dự phòng: Lấy từ danh sách thủ kho kho dự án (/api/warehouse/keepers)
    try {
      const keepers = await apiClient.get<ProjectWarehouseKeeperDto[]>('/api/warehouse/keepers');
      if (Array.isArray(keepers) && keepers.length > 0) {
        const mapped: ProjectPersonnelItem[] = keepers.map(k => ({
          id: k.userId,
          name: k.displayName,
        }));
        return deduplicateAndSort(mapped);
      }
    } catch {
      // Bỏ qua nếu lỗi
    }

    return [];
  },
};
