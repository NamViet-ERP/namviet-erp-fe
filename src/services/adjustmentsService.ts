import type { Adjustment } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { adjustments as mockAdjustments } from '../data/adjustments';

export type CreateAdjustmentDto = Omit<Adjustment, 'id'>;
export type UpdateAdjustmentDto = Partial<CreateAdjustmentDto>;

const ENDPOINT = '/api/adjustments';
let store: Adjustment[] = [...mockAdjustments];

export const adjustmentsService = {
  async list(): Promise<Adjustment[]> {
    if (USE_MOCK) return mockDelay(store);
    return apiClient.get<Adjustment[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Adjustment> {
    if (USE_MOCK) {
      const found = store.find((x) => x.id === id);
      if (!found) throw new Error(`Không tìm thấy phiếu điều chỉnh ${id}`);
      return mockDelay(found);
    }
    return apiClient.get<Adjustment>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateAdjustmentDto): Promise<Adjustment> {
    if (USE_MOCK) {
      const created: Adjustment = { ...dto, id: mockId('adj') };
      store = [created, ...store];
      return mockDelay(created);
    }
    return apiClient.post<Adjustment>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateAdjustmentDto): Promise<Adjustment> {
    if (USE_MOCK) {
      store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
      const updated = store.find((x) => x.id === id);
      if (!updated) throw new Error(`Không tìm thấy phiếu điều chỉnh ${id}`);
      return mockDelay(updated);
    }
    return apiClient.put<Adjustment>(`${ENDPOINT}/${id}`, dto);
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
