import type { Stocktake } from '../types';
import { apiClient } from '../lib/apiClient';

export type CreateStocktakeDto = Omit<Stocktake, 'id' | 'voucherCode' | 'createdBy'> & {
  voucherCode?: string;
  createdBy?: string;
};
export type UpdateStocktakeDto = Partial<CreateStocktakeDto>;

const ENDPOINT = '/api/stocktakes';

export const stocktakesService = {
  async list(): Promise<Stocktake[]> {
    return apiClient.get<Stocktake[]>(ENDPOINT);
  },

  async getById(id: string): Promise<Stocktake> {
    return apiClient.get<Stocktake>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateStocktakeDto): Promise<Stocktake> {
    return apiClient.post<Stocktake>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateStocktakeDto): Promise<Stocktake> {
    return apiClient.put<Stocktake>(`${ENDPOINT}/${id}`, { id, ...dto });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },

  async approve(id: string): Promise<Stocktake> {
    return apiClient.post<Stocktake>(`${ENDPOINT}/${id}/approve`);
  },
};
