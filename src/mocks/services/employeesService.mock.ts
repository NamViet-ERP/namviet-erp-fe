import { mockDelay } from '../index';
import { suggestNextEmployeeCode } from '../../lib/hrm/suggestedEmployeeCode';
import type { CreateEmployeeDto, Employee, UpdateEmployeeDto } from '../../types/hr';
import { isActiveEmployee } from '../../types/hr';
import { readStore, writeStore } from './employeesMockStore';

export async function listEmployeesMock(): Promise<Employee[]> {
  return mockDelay(readStore());
}

export async function getEmployeeMock(id: string): Promise<Employee> {
  const found = readStore().find(e => e.id === id);
  if (!found) throw new Error(`Không tìm thấy nhân viên ${id}`);
  return mockDelay(found);
}

export async function createEmployeeMock(dto: CreateEmployeeDto): Promise<Employee> {
  const created: Employee = {
    ...dto,
    id: 'emp_' + Date.now(),
    status: dto.status ?? 'Đang làm',
  };
  const items = readStore();
  items.unshift(created);
  writeStore(items);
  return mockDelay(created);
}

export async function updateEmployeeMock(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
  const items = readStore();
  const idx = items.findIndex(e => e.id === id);
  if (idx === -1) throw new Error(`Không tìm thấy nhân viên ${id}`);
  const next: Employee = { ...items[idx], ...dto };
  if (next.status === 'Nghỉ việc' && !next.resignDate) {
    next.resignDate = new Date().toISOString().slice(0, 10);
  }
  if (next.status === 'Đang làm') next.resignDate = undefined;
  items[idx] = next;
  writeStore(items);
  return mockDelay(items[idx]);
}

export async function listActiveEmployeesMock(): Promise<Employee[]> {
  return mockDelay(readStore().filter(isActiveEmployee));
}

export async function validateUniqueCodeMock(code: string, excludeId?: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return true;
  return !readStore().some(
    e => e.id !== excludeId && e.code?.trim().toUpperCase() === normalized,
  );
}

export async function getSuggestedEmployeeCodeMock(excludeId?: string): Promise<string> {
  const codes = readStore()
    .filter(e => e.id !== excludeId && e.status === 'Đang làm')
    .map(e => e.code);
  return suggestNextEmployeeCode(codes);
}
