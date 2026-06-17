import { apiClient } from '../lib/apiClient';
import { mockDelay, USE_MOCK } from '../lib/mock';

export interface SystemRole {
  code: string;
  label: string;
  isActive: boolean;
}

const STORAGE_KEY = 'nv-system-roles';
const ROLES_ENDPOINT = '/api/admin/roles';

const SEED_ROLES: SystemRole[] = [
  { code: 'admin', label: 'Quản trị viên', isActive: true },
  { code: 'storekeeper', label: 'Thủ kho (Storekeeper)', isActive: true },
  { code: 'accountant', label: 'Kế toán trưởng', isActive: true },
  { code: 'procurement', label: 'Phòng mua hàng', isActive: true },
  { code: 'pm', label: 'Quản lý dự án (PM)', isActive: true },
  { code: 'hr', label: 'Nhân sự (HR)', isActive: true },
];

function readStore(): SystemRole[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SystemRole[];
  } catch {
    /* ignore */
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ROLES));
  return [...SEED_ROLES];
}

function writeStore(items: SystemRole[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function slugifyCode(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || `role_${Date.now()}`;
}

export interface CreateRoleDto {
  label: string;
  code?: string;
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
      return mockDelay(
        readStore()
          .filter(r => r.isActive)
          .map(r => ({ value: r.code, label: r.label })),
      );
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
      let items = readStore();
      if (params.activeOnly) items = items.filter(r => r.isActive);
      const q = params.search?.trim().toLowerCase();
      if (q) {
        items = items.filter(r =>
          r.label.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
        );
      }
      return mockDelay(items);
    }
    return apiClient.get<SystemRole[]>(ROLES_ENDPOINT, {
      search: params.search?.trim() || undefined,
      activeOnly: params.activeOnly ?? false,
    });
  },

  async create(dto: CreateRoleDto): Promise<SystemRole> {
    if (USE_MOCK) {
      const label = dto.label.trim();
      if (!label) throw new Error('Tên vai trò không được để trống');

      const code = (dto.code?.trim() || slugifyCode(label)).toLowerCase();
      if (!/^[a-z][a-z0-9_]*$/.test(code)) {
        throw new Error('Mã vai trò chỉ gồm chữ thường, số và dấu gạch dưới');
      }

      const items = readStore();
      if (items.some(r => r.code === code)) throw new Error('Mã vai trò đã tồn tại');
      if (items.some(r => r.label.toLowerCase() === label.toLowerCase())) {
        throw new Error('Tên vai trò đã tồn tại');
      }

      const created: SystemRole = { code, label, isActive: true };
      items.push(created);
      writeStore(items);
      return mockDelay(created);
    }

    return apiClient.post<SystemRole>(ROLES_ENDPOINT, {
      label: dto.label.trim(),
      code: dto.code?.trim() || undefined,
    });
  },

  async toggleStatus(code: string): Promise<SystemRole> {
    if (USE_MOCK) {
      const items = readStore();
      const idx = items.findIndex(r => r.code === code);
      if (idx === -1) throw new Error(`Không tìm thấy vai trò "${code}"`);
      items[idx].isActive = !items[idx].isActive;
      writeStore(items);
      return mockDelay(items[idx]);
    }

    return apiClient.patch<SystemRole>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}/toggle`);
  },

  async remove(code: string): Promise<void> {
    if (USE_MOCK) {
      const items = readStore();
      if (!items.some(r => r.code === code)) throw new Error(`Không tìm thấy vai trò "${code}"`);
      writeStore(items.filter(r => r.code !== code));
      return mockDelay(undefined);
    }

    await apiClient.delete<void>(`${ROLES_ENDPOINT}/${encodeURIComponent(code)}`);
  },
};
