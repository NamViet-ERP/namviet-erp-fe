import type { Transfer } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';

export type CreateTransferDto = Omit<Transfer, 'id'>;
export type UpdateTransferDto = Partial<CreateTransferDto>;

const ENDPOINT = '/api/transfers';

export const transfersService = {
  async list(): Promise<Transfer[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/transfersService.mock');
      return mock.listTransfersMock();
    }
    return apiClient.get<Transfer[]>(ENDPOINT);
  },

  async getById(id: string): Promise<Transfer> {
    if (USE_MOCK) {
      const mock = await import('./mocks/transfersService.mock');
      return mock.getTransferMock(id);
    }
    return apiClient.get<Transfer>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateTransferDto): Promise<Transfer> {
    if (USE_MOCK) {
      const mock = await import('./mocks/transfersService.mock');
      return mock.createTransferMock(dto);
    }
    return apiClient.post<Transfer>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateTransferDto): Promise<Transfer> {
    if (USE_MOCK) {
      const mock = await import('./mocks/transfersService.mock');
      return mock.updateTransferMock(id, dto);
    }
    return apiClient.put<Transfer>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<Transfer> {
    if (USE_MOCK) {
      const mock = await import('./mocks/transfersService.mock');
      return mock.updateTransferMock(id, {
        status: 'approved',
        approvedBy: 'Lê Thị Hồng',
        approvedAt: new Date().toISOString(),
      });
    }
    return apiClient.post<Transfer>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<Transfer> {
    if (USE_MOCK) {
      const mock = await import('./mocks/transfersService.mock');
      return mock.updateTransferMock(id, { status: 'pending' });
    }
    return apiClient.post<Transfer>(`${ENDPOINT}/${id}/submit`);
  },

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/transfersService.mock');
      return mock.removeTransferMock(id);
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
