import type { Adjustment } from '../types';
import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';

export type CreateAdjustmentDto = Omit<Adjustment, 'id'>;
export type UpdateAdjustmentDto = Partial<CreateAdjustmentDto>;

const ENDPOINT = '/api/adjustments';

export const adjustmentsService = {
  async list(): Promise<Adjustment[]> {
    return resolveMock(
      () => import('../mocks/services/adjustmentsService.mock').then((m) => m.listAdjustmentsMock()),
      () => apiClient.get<Adjustment[]>(ENDPOINT),
    );
  },
  async getById(id: string): Promise<Adjustment> {
    return resolveMock(
      () => import('../mocks/services/adjustmentsService.mock').then((m) => m.getAdjustmentMock(id)),
      () => apiClient.get<Adjustment>(`${ENDPOINT}/${id}`),
    );
  },
  async create(dto: CreateAdjustmentDto): Promise<Adjustment> {
    return resolveMock(
      () => import('../mocks/services/adjustmentsService.mock').then((m) => m.createAdjustmentMock(dto)),
      () => apiClient.post<Adjustment>(ENDPOINT, dto),
    );
  },
  async update(id: string, dto: UpdateAdjustmentDto): Promise<Adjustment> {
    return resolveMock(
      () => import('../mocks/services/adjustmentsService.mock').then((m) => m.updateAdjustmentMock(id, dto)),
      () => apiClient.put<Adjustment>(`${ENDPOINT}/${id}`, dto),
    );
  },
  async remove(id: string): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/adjustmentsService.mock').then((m) => m.removeAdjustmentMock(id)),
      async () => { await apiClient.delete<void>(`${ENDPOINT}/${id}`); },
    );
  },
};
