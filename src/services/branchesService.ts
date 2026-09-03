import { apiClient } from '../lib/apiClient';
import type { BranchApiDto, UpsertBranchRequest } from '../types/api/hrApi';

export type { BranchApiDto, UpsertBranchRequest };

const BASE = '/api/hr/branches';

export const branchesService = {
  list(activeOnly = false): Promise<BranchApiDto[]> {
    return apiClient.get<BranchApiDto[]>(BASE, { activeOnly });
  },

  getById(id: number): Promise<BranchApiDto> {
    return apiClient.get<BranchApiDto>(`${BASE}/${id}`);
  },

  create(body: UpsertBranchRequest): Promise<{ id: number }> {
    return apiClient.post<{ id: number }>(BASE, body);
  },

  update(id: number, body: UpsertBranchRequest): Promise<void> {
    return apiClient.put<void>(`${BASE}/${id}`, body);
  },

  remove(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE}/${id}`);
  },
};
