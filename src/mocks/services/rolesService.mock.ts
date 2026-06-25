import { mockDelay } from '../index';
import type { CreateRoleDto, RoleListParams, SystemRole, UpdateRoleDto } from '../../services/rolesService';
import { readStore, writeStore } from './rolesMockStore';

function slugifyCode(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || `role_${Date.now()}`;
}

export async function listActiveRoleOptionsMock(): Promise<{ value: string; label: string }[]> {
  return mockDelay(
    readStore()
      .filter(r => r.isActive)
      .map(r => ({ value: r.code, label: r.label })),
  );
}

export async function listRolesMock(params: RoleListParams = {}): Promise<SystemRole[]> {
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

export async function createRoleMock(dto: CreateRoleDto): Promise<SystemRole> {
  const label = dto.label.trim();
  if (!label) throw new Error('Tên vai trò không được để trống');

  const code = slugifyCode(label);
  if (!/^[a-z][a-z0-9_]*$/.test(code)) {
    throw new Error('Tên vai trò không hợp lệ — vui lòng dùng chữ cái và khoảng trắng');
  }

  const items = readStore();
  if (items.some(r => r.code === code)) throw new Error('Vai trò tương tự đã tồn tại — hãy đặt tên khác');
  if (items.some(r => r.label.toLowerCase() === label.toLowerCase())) {
    throw new Error('Tên vai trò đã tồn tại');
  }

  const created: SystemRole = { code, label, isActive: true };
  items.push(created);
  writeStore(items);
  return mockDelay(created);
}

export async function toggleRoleStatusMock(code: string): Promise<SystemRole> {
  const items = readStore();
  const idx = items.findIndex(r => r.code === code);
  if (idx === -1) throw new Error(`Không tìm thấy vai trò "${code}"`);
  items[idx].isActive = !items[idx].isActive;
  writeStore(items);
  return mockDelay(items[idx]);
}

export async function updateRoleLabelMock(code: string, dto: UpdateRoleDto): Promise<SystemRole> {
  const label = dto.label.trim();
  if (!label) throw new Error('Tên vai trò không được để trống');

  const items = readStore();
  const idx = items.findIndex(r => r.code === code);
  if (idx === -1) throw new Error(`Không tìm thấy vai trò "${code}"`);
  if (items.some((r, i) => i !== idx && r.label.toLowerCase() === label.toLowerCase())) {
    throw new Error('Tên vai trò đã tồn tại');
  }

  items[idx].label = label;
  writeStore(items);
  return mockDelay(items[idx]);
}

export async function removeRoleMock(code: string): Promise<void> {
  const items = readStore();
  if (!items.some(r => r.code === code)) throw new Error(`Không tìm thấy vai trò "${code}"`);
  writeStore(items.filter(r => r.code !== code));
  return mockDelay(undefined);
}
