import { isSystemRoleAccount } from '../lib/projectPersonnel';
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
    if (!item.name || isSystemRoleAccount(item.name)) continue;
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

function isFallbackableError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    return status === 403 || status === 404;
  }
  const msg = err instanceof Error ? err.message : '';
  return msg.includes('403') || msg.includes('404');
}

export const projectPersonnelService = {
  async getPersonnel(): Promise<ProjectPersonnelItem[]> {
    let anySucceeded = false;
    let firstUnexpectedError: unknown = null;
    let lastError: unknown = null;

    const recordError = (err: unknown) => {
      lastError = err;
      if (!isFallbackableError(err) && firstUnexpectedError === null) {
        firstUnexpectedError = err;
      }
    };

    // 1. Ưu tiên endpoint chuẩn dành riêng cho nhân sự dự án (wms.projects.view:all)
    try {
      const res = await apiClient.get<ProjectPersonnelItem[]>('/api/warehouse/projects/personnel');
      if (Array.isArray(res)) {
        anySucceeded = true;
        if (res.length > 0) return deduplicateAndSort(res);
      }
    } catch (err) {
      recordError(err);
    }

    // 2. Dự phòng: Thử lấy từ adminUsersService (nếu user có quyền admin)
    try {
      const adminRes = await adminUsersService.list({ pageSize: 100 });
      if (adminRes?.items) {
        anySucceeded = true;
        if (adminRes.items.length > 0) {
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
      }
    } catch (err) {
      recordError(err);
    }

    // 3. Dự phòng: Thử lấy từ employeesService (nếu user có quyền hrm)
    try {
      const empRes = await employeesService.listActive();
      if (Array.isArray(empRes)) {
        anySucceeded = true;
        if (empRes.length > 0) {
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
      }
    } catch (err) {
      recordError(err);
    }

    // 4. Dự phòng: Lấy từ danh sách thủ kho kho dự án (/api/warehouse/keepers)
    try {
      const keepers = await apiClient.get<ProjectWarehouseKeeperDto[]>('/api/warehouse/keepers');
      if (Array.isArray(keepers)) {
        anySucceeded = true;
        if (keepers.length > 0) {
          const mapped: ProjectPersonnelItem[] = keepers.map(k => ({
            id: k.userId,
            name: k.displayName,
          }));
          return deduplicateAndSort(mapped);
        }
      }
    } catch (err) {
      recordError(err);
    }

    if (!anySucceeded && (firstUnexpectedError ?? lastError)) {
      throw firstUnexpectedError ?? lastError;
    }

    return [];
  },
};
