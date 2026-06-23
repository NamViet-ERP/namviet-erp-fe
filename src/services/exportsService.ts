import type { Export } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';

export type CreateExportDto = Omit<Export, 'id'>;
export type UpdateExportDto = Partial<CreateExportDto>;

const ENDPOINT = '/api/exports';

export const exportsService = {
  async list(): Promise<Export[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/exportsService.mock');
      return mock.listExportsMock();
    }
    return apiClient.get<Export[]>(ENDPOINT);
  },

  async getById(id: string): Promise<Export> {
    if (USE_MOCK) {
      const mock = await import('./mocks/exportsService.mock');
      return mock.getExportMock(id);
    }
    return apiClient.get<Export>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateExportDto): Promise<Export> {
    if (USE_MOCK) {
      const mock = await import('./mocks/exportsService.mock');
      return mock.createExportMock(dto);
    }
    return apiClient.post<Export>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateExportDto): Promise<Export> {
    if (USE_MOCK) {
      const mock = await import('./mocks/exportsService.mock');
      return mock.updateExportMock(id, dto);
    }
    return apiClient.put<Export>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<Export> {
    if (USE_MOCK) {
      const mock = await import('./mocks/exportsService.mock');
      return mock.updateExportMock(id, {
        status: 'approved',
        approvedBy: 'Lê Thị Hồng',
        approvedAt: new Date().toISOString(),
      });
    }
    return apiClient.post<Export>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<Export> {
    if (USE_MOCK) {
      const mock = await import('./mocks/exportsService.mock');
      return mock.updateExportMock(id, { status: 'pending' });
    }
    return apiClient.post<Export>(`${ENDPOINT}/${id}/submit`);
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/exportsService.mock');
      return mock.removeExportMock(id);
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
