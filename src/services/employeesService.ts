import { apiClient } from '../lib/apiClient';
import { fromApi, toApi, type EmployeeApiDto } from '../lib/hrm/employeeApiMapper';
import { USE_MOCK } from '../lib/mock';
import type { CreateEmployeeDto, Employee, UpdateEmployeeDto } from '../types/hr';
import { isActiveEmployee } from '../types/hr';
import { getEmployeeLockReason, isActiveEmployeeStatus } from '../constants/employeeStatus';
import { readStore } from './mocks/employeesMockStore';

const ENDPOINT = '/api/employees';

export function cacheEmployeeStatus(employeeId: string, status: string): void {
  localStorage.setItem(`nv-emp-status-${employeeId}`, status);
}

export async function validateUniqueCode(code: string, excludeId?: string): Promise<boolean> {
  if (USE_MOCK) {
    const mock = await import('./mocks/employeesService.mock');
    return mock.validateUniqueCodeMock(code, excludeId);
  }
  const normalized = code.trim().toUpperCase();
  if (!normalized) return true;
  const res = await apiClient.get<{ available: boolean }>(`${ENDPOINT}/check-code`, {
    code: normalized,
    excludeId: excludeId ?? '',
  });
  return res.available;
}

export async function getSuggestedEmployeeCode(excludeId?: string): Promise<string> {
  if (USE_MOCK) {
    const mock = await import('./mocks/employeesService.mock');
    return mock.getSuggestedEmployeeCodeMock(excludeId);
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
    if (USE_MOCK) {
      const mock = await import('./mocks/employeesService.mock');
      return mock.listEmployeesMock();
    }
    const items = await apiClient.get<EmployeeApiDto[]>(ENDPOINT);
    if (!Array.isArray(items)) return [];
    return items.map(fromApi);
  },

  async getById(id: string): Promise<Employee> {
    if (USE_MOCK) {
      const mock = await import('./mocks/employeesService.mock');
      return mock.getEmployeeMock(id);
    }
    const dto = await apiClient.get<EmployeeApiDto>(`${ENDPOINT}/${id}`);
    cacheEmployeeStatus(id, dto.status);
    return fromApi(dto);
  },

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    if (USE_MOCK) {
      const mock = await import('./mocks/employeesService.mock');
      return mock.createEmployeeMock(dto);
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
      const mock = await import('./mocks/employeesService.mock');
      return mock.updateEmployeeMock(id, dto);
    }
    const current = await this.getById(id);
    const merged: Employee = { ...current, ...dto };
    if (dto.profilePhoto === undefined) merged.profilePhoto = undefined;
    if (merged.status === 'Nghỉ việc' && !merged.resignDate) {
      merged.resignDate = new Date().toISOString().slice(0, 10);
    }
    if (merged.status === 'Đang làm') merged.resignDate = undefined;
    const payload = toApi(merged, id);
    const res = await apiClient.put<EmployeeApiDto>(`${ENDPOINT}/${id}`, payload);
    cacheEmployeeStatus(id, res.status);
    return fromApi(res);
  },

  async listActive(): Promise<Employee[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/employeesService.mock');
      return mock.listActiveEmployeesMock();
    }
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
