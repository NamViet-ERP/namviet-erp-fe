import type { Stocktake } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';

export type CreateStocktakeDto = Omit<Stocktake, 'id'>;
export type UpdateStocktakeDto = Partial<CreateStocktakeDto>;

const ENDPOINT = '/api/stocktakes';

export const stocktakesService = {
  async list(): Promise<Stocktake[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/stocktakesService.mock');
      return mock.listStocktakesMock();
    }
    return apiClient.get<Stocktake[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Stocktake> {
    if (USE_MOCK) {
      const mock = await import('./mocks/stocktakesService.mock');
      return mock.getStocktakeMock(id);
    }
    return apiClient.get<Stocktake>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateStocktakeDto): Promise<Stocktake> {
    if (USE_MOCK) {
      const mock = await import('./mocks/stocktakesService.mock');
      return mock.createStocktakeMock(dto);
    }
    return apiClient.post<Stocktake>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateStocktakeDto): Promise<Stocktake> {
    if (USE_MOCK) {
      const mock = await import('./mocks/stocktakesService.mock');
      return mock.updateStocktakeMock(id, dto);
    }
    return apiClient.put<Stocktake>(`${ENDPOINT}/${id}`, dto);
  },
  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/stocktakesService.mock');
      return mock.removeStocktakeMock(id);
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
