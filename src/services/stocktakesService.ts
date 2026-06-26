import type { Stocktake } from '../types';
import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';

export type CreateStocktakeDto = Omit<Stocktake, 'id'>;
export type UpdateStocktakeDto = Partial<CreateStocktakeDto>;

const ENDPOINT = '/api/stocktakes';

export const stocktakesService = {
  async list(): Promise<Stocktake[]> {
    return resolveMock(
      () => import('../mocks/services/stocktakesService.mock').then((m) => m.listStocktakesMock()),
      () => apiClient.get<Stocktake[]>(ENDPOINT),
    );
  },
  async getById(id: string): Promise<Stocktake> {
    return resolveMock(
      () => import('../mocks/services/stocktakesService.mock').then((m) => m.getStocktakeMock(id)),
      () => apiClient.get<Stocktake>(`${ENDPOINT}/${id}`),
    );
  },
  async create(dto: CreateStocktakeDto): Promise<Stocktake> {
    return resolveMock(
      () => import('../mocks/services/stocktakesService.mock').then((m) => m.createStocktakeMock(dto)),
      () => apiClient.post<Stocktake>(ENDPOINT, dto),
    );
  },
  async update(id: string, dto: UpdateStocktakeDto): Promise<Stocktake> {
    return resolveMock(
      () => import('../mocks/services/stocktakesService.mock').then((m) => m.updateStocktakeMock(id, dto)),
      () => apiClient.put<Stocktake>(`${ENDPOINT}/${id}`, dto),
    );
  },
  async remove(id: string): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/stocktakesService.mock').then((m) => m.removeStocktakeMock(id)),
      async () => { await apiClient.delete<void>(`${ENDPOINT}/${id}`); },
    );
  },
  async approve(id: string): Promise<Stocktake> {
    return resolveMock(
      () => import('../mocks/services/stocktakesService.mock').then((m) => m.approveStocktakeMock(id)),
      () => apiClient.post<Stocktake>(`${ENDPOINT}/${id}/approve`),
    );
  },
};
