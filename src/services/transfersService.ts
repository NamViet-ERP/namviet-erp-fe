import type { Transfer } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { transfers as mockTransfers } from '../data/transfers';

export type CreateTransferDto = Omit<Transfer, 'id'>;
export type UpdateTransferDto = Partial<CreateTransferDto>;

const ENDPOINT = '/api/transfers';
let store: Transfer[] = [...mockTransfers];

export const transfersService = {
  async list(): Promise<Transfer[]> {
    if (USE_MOCK) return mockDelay(store);
    return apiClient.get<Transfer[]>(ENDPOINT);
  },
  async getById(id: string): Promise<Transfer> {
    if (USE_MOCK) {
      const found = store.find((x) => x.id === id);
      if (!found) throw new Error(`Không tìm thấy phiếu chuyển ${id}`);
      return mockDelay(found);
    }
    return apiClient.get<Transfer>(`${ENDPOINT}/${id}`);
  },
  async create(dto: CreateTransferDto): Promise<Transfer> {
    if (USE_MOCK) {
      const created: Transfer = { ...dto, id: mockId('tf') };
      store = [created, ...store];
      return mockDelay(created);
    }
    return apiClient.post<Transfer>(ENDPOINT, dto);
  },
  async update(id: string, dto: UpdateTransferDto): Promise<Transfer> {
    if (USE_MOCK) {
      store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
      const updated = store.find((x) => x.id === id);
      if (!updated) throw new Error(`Không tìm thấy phiếu chuyển ${id}`);
      return mockDelay(updated);
    }
    return apiClient.put<Transfer>(`${ENDPOINT}/${id}`, dto);
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
