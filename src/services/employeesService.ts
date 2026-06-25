import { apiClient } from '../lib/apiClient';
import { fromApi, toApi, type EmployeeApiDto } from '../lib/hrm/employeeApiMapper';
import { resolveMock, USE_MOCK } from '../mocks';
import type { CreateEmployeeDto, Employee, UpdateEmployeeDto } from '../types/hr';
import { isActiveEmployee } from '../types/hr';
import { getEmployeeLockReason, isActiveEmployeeStatus } from '../constants/employeeStatus';
import { readStore } from '../mocks/services/employeesMockStore';

const ENDPOINT = '/api/employees';
const MOCK = () => import('../mocks/services/employeesService.mock');

export function cacheEmployeeStatus(employeeId: string, status: string): void {
  localStorage.setItem(`nv-emp-status-${employeeId}`, status);
}

export async function validateUniqueCode(code: string, excludeId?: string): Promise<boolean> {
  return resolveMock(
    () => MOCK().then((m) => m.validateUniqueCodeMock(code, excludeId)),
    async () => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return true;
      const res = await apiClient.get<{ available: boolean }>(`${ENDPOINT}/check-code`, {
        code: normalized,
        excludeId: excludeId ?? '',
      });
      return res.available;
    },
  );
}

export async function getSuggestedEmployeeCode(excludeId?: string): Promise<string> {
  return resolveMock(
    () => MOCK().then((m) => m.getSuggestedEmployeeCodeMock(excludeId)),
    () => apiClient.get<{ suggestedCode: string }>(`${ENDPOINT}/suggested-code`, {
      excludeId: excludeId ?? '',
    }).then((res) => res.suggestedCode),
  );
}

export function isAccountActiveForEmployee(employeeId?: string): boolean {
  if (!employeeId) return true;
  if (!USE_MOCK) {
    const cached = localStorage.getItem(`nv-emp-status-${employeeId}`);
    if (cached) return isActiveEmployeeStatus(cached);
    return true;
  }
  const emp = readStore().find((e) => e.id === employeeId);
  if (!emp) return true;
  return isActiveEmployee(emp);
}

export function getAccountLockReason(employeeId?: string): string | null {
  if (!employeeId) return null;
  if (!USE_MOCK) {
    const cached = localStorage.getItem(`nv-emp-status-${employeeId}`);
    return getEmployeeLockReason(cached);
  }
  const emp = readStore().find((e) => e.id === employeeId);
  if (!emp || isActiveEmployee(emp)) return null;
  return getEmployeeLockReason(emp.status);
}

export const employeesService = {
  async list(): Promise<Employee[]> {
    return resolveMock(
      () => MOCK().then((m) => m.listEmployeesMock()),
      async () => {
        const items = await apiClient.get<EmployeeApiDto[]>(ENDPOINT);
        if (!Array.isArray(items)) return [];
        return items.map(fromApi);
      },
    );
  },

  async getById(id: string): Promise<Employee> {
    return resolveMock(
      () => MOCK().then((m) => m.getEmployeeMock(id)),
      async () => {
        const dto = await apiClient.get<EmployeeApiDto>(`${ENDPOINT}/${id}`);
        cacheEmployeeStatus(id, dto.status);
        return fromApi(dto);
      },
    );
  },

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    return resolveMock(
      () => MOCK().then((m) => m.createEmployeeMock(dto)),
      async () => {
        const payload = toApi(dto);
        const res = await apiClient.post<EmployeeApiDto>(ENDPOINT, payload);
        return fromApi(res);
      },
    );
  },

  async createOnboard(dto: CreateEmployeeDto): Promise<Employee> {
    return resolveMock(
      () => employeesService.create(dto),
      async () => {
        const payload = toApi(dto);
        const res = await apiClient.post<EmployeeApiDto>(`${ENDPOINT}/onboard`, payload);
        return fromApi(res);
      },
    );
  },

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    if (dto.code?.trim()) {
      const ok = await validateUniqueCode(dto.code, id);
      if (!ok) throw new Error('Mã nhân viên đã tồn tại');
    }
    return resolveMock(
      () => MOCK().then((m) => m.updateEmployeeMock(id, dto)),
      async () => {
        const current = await employeesService.getById(id);
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
    );
  },

  async listActive(): Promise<Employee[]> {
    return resolveMock(
      () => MOCK().then((m) => m.listActiveEmployeesMock()),
      async () => {
        try {
          const items = await apiClient.get<EmployeeApiDto[]>(ENDPOINT, { activeOnly: true });
          return items.map(fromApi);
        } catch (e) {
          console.error('Failed to fetch active employees:', e);
          return [];
        }
      },
    );
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
