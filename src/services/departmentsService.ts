import { apiClient } from '../lib/apiClient';
import type {
  AssignDepartmentMembersRequest,
  DepartmentApiDto,
  DepartmentMemberApiDto,
} from '../types/api/hrApi';

export type { DepartmentApiDto, DepartmentMemberApiDto };

export interface UpsertDepartmentRequest {
  code: string;
  name: string;
  parentId?: number | null;
  block?: string | null;
}

const BASE = '/api/hr/departments';

export const departmentsService = {
  list(activeOnly = false): Promise<DepartmentApiDto[]> {
    return apiClient.get<DepartmentApiDto[]>(BASE, { activeOnly });
  },

  getById(id: number): Promise<DepartmentApiDto> {
    return apiClient.get<DepartmentApiDto>(`${BASE}/${id}`);
  },

  listMembers(id: number): Promise<DepartmentMemberApiDto[]> {
    return apiClient.get<DepartmentMemberApiDto[]>(`${BASE}/${id}/employees`);
  },

  create(body: UpsertDepartmentRequest): Promise<{ id: number }> {
    return apiClient.post<{ id: number }>(BASE, body);
  },

  update(id: number, body: UpsertDepartmentRequest): Promise<void> {
    return apiClient.put<void>(`${BASE}/${id}`, body);
  },

  remove(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },

  assignEmployees(id: number, employeeIds: number[]): Promise<{ assigned: number; departmentId: number }> {
    const body: AssignDepartmentMembersRequest = { employeeIds };
    return apiClient.post<{ assigned: number; departmentId: number }>(`${BASE}/${id}/employees`, body);
  },
};
