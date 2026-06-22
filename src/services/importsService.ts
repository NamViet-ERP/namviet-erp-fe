import type { Import } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { MOCK_IMPORTS } from '../data/wmsMockSeed';

export type CreateImportDto = Omit<Import, 'id'>;
export type UpdateImportDto = Partial<CreateImportDto>;

const ENDPOINT = '/api/imports';

let store: Import[] = [...MOCK_IMPORTS];

function nextVoucherCode(prefix: string, seq: number) {
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}

export const importsService = {
  async list(): Promise<Import[]> {
    if (USE_MOCK) return mockDelay(store);
    return apiClient.get<Import[]>(ENDPOINT);
  },

  async getById(id: string): Promise<Import> {
    if (USE_MOCK) {
      const found = store.find((x) => x.id === id);
      if (!found) throw new Error(`Không tìm thấy phiếu nhập ${id}`);
      return mockDelay(found);
    }
    return apiClient.get<Import>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateImportDto): Promise<Import> {
    if (USE_MOCK) {
      const created: Import = {
        ...dto,
        id: mockId('im'),
        voucherCode: dto.voucherCode?.trim() || nextVoucherCode('NK', 260010 + store.length),
      };
      store = [created, ...store];
      return mockDelay(created);
    }
    return apiClient.post<Import>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateImportDto): Promise<Import> {
    if (USE_MOCK) {
      store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
      const updated = store.find((x) => x.id === id);
      if (!updated) throw new Error(`Không tìm thấy phiếu nhập ${id}`);
      return mockDelay(updated);
    }
    return apiClient.put<Import>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<Import> {
    if (USE_MOCK) {
      return this.update(id, { status: 'approved', warehouseApproval: 'approved' });
    }
    return apiClient.post<Import>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<Import> {
    if (USE_MOCK) {
      return this.update(id, { status: 'pending' });
    }
    return apiClient.post<Import>(`${ENDPOINT}/${id}/submit`);
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
