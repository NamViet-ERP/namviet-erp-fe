import { apiClient } from '../lib/apiClient';
import { fromApi, toApi, type EmployeeApiDto } from '../lib/hrm/employeeApiMapper';
import { suggestNextEmployeeCode } from '../lib/hrm/suggestedEmployeeCode';
import { USE_MOCK, mockDelay } from '../lib/mock';
import type { CreateEmployeeDto, Employee, UpdateEmployeeDto } from '../types/hr';
import { isActiveEmployee } from '../types/hr';
import { getEmployeeLockReason, isActiveEmployeeStatus } from '../constants/employeeStatus';
import { mockEmployees } from '../data/employees';

const ENDPOINT = '/api/employees';
const STORAGE_KEY = 'nv-employee-data';

function readStore(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Employee[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to read employee store from localStorage:', e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockEmployees));
  return [...mockEmployees];
}

function writeStore(items: Employee[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function cacheEmployeeStatus(employeeId: string, status: string): void {
  localStorage.setItem(`nv-emp-status-${employeeId}`, status);
}

export async function validateUniqueCode(code: string, excludeId?: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return true;
  if (USE_MOCK) {
    return !readStore().some(
      e => e.id !== excludeId && e.code?.trim().toUpperCase() === normalized,
    );
  }
  const res = await apiClient.get<{ available: boolean }>(`${ENDPOINT}/check-code`, {
    code: normalized,
    excludeId: excludeId ?? '',
  });
  return res.available;
}

export async function getSuggestedEmployeeCode(excludeId?: string): Promise<string> {
  if (USE_MOCK) {
    const codes = readStore()
      .filter(e => e.id !== excludeId && e.status === 'Đang làm')
      .map(e => e.code);
    return suggestNextEmployeeCode(codes);
  }
  const res = await apiClient.get<{ suggestedCode: string }>(`${ENDPOINT}/suggested-code`, {
    excludeId: excludeId ?? '',
  });
  return res.suggestedCode;
}

export function isAccountActiveForEmployee(employeeId?: string): boolean {
  if (!employeeId) return true;
  if (!USE_MOCK) {
    const cached = localStorage.getItem(`nv-emp-status-${employeeId}`);
    if (cached) return isActiveEmployeeStatus(cached);
    return true;
  }
  const emp = readStore().find(e => e.id === employeeId);
  if (!emp) return true;
  return isActiveEmployee(emp);
}

export function getAccountLockReason(employeeId?: string): string | null {
  if (!employeeId) return null;
  if (!USE_MOCK) {
    const cached = localStorage.getItem(`nv-emp-status-${employeeId}`);
    return getEmployeeLockReason(cached);
  }
  const emp = readStore().find(e => e.id === employeeId);
  if (!emp || isActiveEmployee(emp)) return null;
  return getEmployeeLockReason(emp.status);
}

export const employeesService = {
  async list(): Promise<Employee[]> {
    if (USE_MOCK) return mockDelay(readStore());
    const items = await apiClient.get<EmployeeApiDto[]>(ENDPOINT);
    if (!Array.isArray(items)) return [];
    return items.map(fromApi);
  },

  async getById(id: string): Promise<Employee> {
    if (USE_MOCK) {
      const found = readStore().find(e => e.id === id);
      if (!found) throw new Error(`Không tìm thấy nhân viên ${id}`);
      return mockDelay(found);
    }
    const dto = await apiClient.get<EmployeeApiDto>(`${ENDPOINT}/${id}`);
    cacheEmployeeStatus(id, dto.status);
    return fromApi(dto);
  },

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    if (USE_MOCK) {
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
    const payload = toApi(dto);
    const res = await apiClient.post<EmployeeApiDto>(ENDPOINT, payload);
    return fromApi(res);
  },

  async createOnboard(dto: CreateEmployeeDto): Promise<Employee> {
    if (USE_MOCK) return this.create(dto);
    const payload = toApi(dto);
    const res = await apiClient.post<EmployeeApiDto>(`${ENDPOINT}/onboard`, payload);
    return fromApi(res);
  },

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    if (dto.code?.trim()) {
      const ok = await validateUniqueCode(dto.code, id);
      if (!ok) throw new Error('Mã nhân viên đã tồn tại');
    }
    if (USE_MOCK) {
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
    const payload = toApi({ ...dto, fullName: dto.fullName ?? '' } as CreateEmployeeDto, id);
    const res = await apiClient.put<EmployeeApiDto>(`${ENDPOINT}/${id}`, payload);
    cacheEmployeeStatus(id, res.status);
    return fromApi(res);
  },

  async listActive(): Promise<Employee[]> {
    if (USE_MOCK) return mockDelay(readStore().filter(isActiveEmployee));
    try {
      const items = await apiClient.get<EmployeeApiDto[]>(ENDPOINT, { activeOnly: true });
      return items.map(fromApi);
    } catch (e) {
      console.error('Failed to fetch active employees:', e);
      return [];
    }
  },

  async getByIdIfActive(id: string): Promise<Employee | undefined> {
    try {
      const emp = await this.getById(id);
      return isActiveEmployee(emp) ? emp : undefined;
    } catch (e) {
      console.error('Failed to fetch active employee:', e);
      return undefined;
    }
  },
};
