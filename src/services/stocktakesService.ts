import type { Stocktake } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { stocktakes as mockStocktakes } from '../data/stocktakes';

export type CreateStocktakeDto = Omit<Stocktake, 'id'>;
export type UpdateStocktakeDto = Partial<CreateStocktakeDto>;

const ENDPOINT = '/api/stocktakes';
let store: Stocktake[] = [...mockStocktakes];

export const stocktakesService = {
  async list(): Promise<Stocktake[]> {
    if (USE_MOCK) return mockDelay(store);
    return apiClient.get<Stocktake[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Stocktake> {
    if (USE_MOCK) {
      const found = store.find((x) => x.id === id);
      if (!found) throw new Error(`Không tìm thấy phiếu kiểm kê ${id}`);
      return mockDelay(found);
    }
    return apiClient.get<Stocktake>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateStocktakeDto): Promise<Stocktake> {
    if (USE_MOCK) {
      const created: Stocktake = { ...dto, id: mockId('st') };
      store = [created, ...store];
      return mockDelay(created);
    }
    return apiClient.post<Stocktake>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateStocktakeDto): Promise<Stocktake> {
    if (USE_MOCK) {
      store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
      const updated = store.find((x) => x.id === id);
      if (!updated) throw new Error(`Không tìm thấy phiếu kiểm kê ${id}`);
      return mockDelay(updated);
    }
    return apiClient.put<Stocktake>(`${ENDPOINT}/${id}`, dto);
  },
  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      store = store.filter((x) => x.id !== id);
      await mockDelay(null);
      return;
    }
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
