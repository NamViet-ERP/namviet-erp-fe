import type { Adjustment } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';

export type CreateAdjustmentDto = Omit<Adjustment, 'id'>;
export type UpdateAdjustmentDto = Partial<CreateAdjustmentDto>;

const ENDPOINT = '/api/adjustments';

export const adjustmentsService = {
  async list(): Promise<Adjustment[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/adjustmentsService.mock');
      return mock.listAdjustmentsMock();
    }
    return apiClient.get<Adjustment[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Adjustment> {
    if (USE_MOCK) {
      const mock = await import('./mocks/adjustmentsService.mock');
      return mock.getAdjustmentMock(id);
    }
    return apiClient.get<Adjustment>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateAdjustmentDto): Promise<Adjustment> {
    if (USE_MOCK) {
      const mock = await import('./mocks/adjustmentsService.mock');
      return mock.createAdjustmentMock(dto);
    }
    return apiClient.post<Adjustment>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateAdjustmentDto): Promise<Adjustment> {
    if (USE_MOCK) {
      const mock = await import('./mocks/adjustmentsService.mock');
      return mock.updateAdjustmentMock(id, dto);
    }
    return apiClient.put<Adjustment>(`${ENDPOINT}/${id}`, dto);
  },
  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/adjustmentsService.mock');
      return mock.removeAdjustmentMock(id);
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
