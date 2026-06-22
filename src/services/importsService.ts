import type { Import } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';

export type CreateImportDto = Omit<Import, 'id'>;
export type UpdateImportDto = Partial<CreateImportDto>;

const ENDPOINT = '/api/imports';

export const importsService = {
  async list(): Promise<Import[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/importsService.mock');
      return mock.listImportsMock();
    }
    return apiClient.get<Import[]>(ENDPOINT);
  },

  async getById(id: string): Promise<Import> {
    if (USE_MOCK) {
      const mock = await import('./mocks/importsService.mock');
      return mock.getImportMock(id);
    }
    return apiClient.get<Import>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateImportDto): Promise<Import> {
    if (USE_MOCK) {
      const mock = await import('./mocks/importsService.mock');
      return mock.createImportMock(dto);
    }
    return apiClient.post<Import>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateImportDto): Promise<Import> {
    if (USE_MOCK) {
      const mock = await import('./mocks/importsService.mock');
      return mock.updateImportMock(id, dto);
    }
    return apiClient.put<Import>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<Import> {
    if (USE_MOCK) {
      const mock = await import('./mocks/importsService.mock');
      return mock.updateImportMock(id, {
        status: 'approved',
        warehouseApproval: 'approved',
        approvedBy: 'Lê Thị Hồng',
        approvedAt: new Date().toISOString(),
      });
    }
    return apiClient.post<Import>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<Import> {
    if (USE_MOCK) {
      const mock = await import('./mocks/importsService.mock');
      return mock.updateImportMock(id, { status: 'pending' });
    }
    return apiClient.post<Import>(`${ENDPOINT}/${id}/submit`);
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/importsService.mock');
      return mock.removeImportMock(id);
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
