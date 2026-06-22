import type { Export } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { MOCK_EXPORTS, projectNameByCode } from '../data/wmsMockSeed';

export type CreateExportDto = Omit<Export, 'id'>;
export type UpdateExportDto = Partial<CreateExportDto>;

const ENDPOINT = '/api/exports';

let store: Export[] = [...MOCK_EXPORTS];

function nextVoucherCode(prefix: string, seq: number) {
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}

export const exportsService = {
  async list(): Promise<Export[]> {
    if (USE_MOCK) return mockDelay(store);
    return apiClient.get<Export[]>(ENDPOINT);
  },

  async getById(id: string): Promise<Export> {
    if (USE_MOCK) {
      const found = store.find((x) => x.id === id);
      if (!found) throw new Error(`Không tìm thấy phiếu xuất ${id}`);
      return mockDelay(found);
    }
    return apiClient.get<Export>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateExportDto): Promise<Export> {
    if (USE_MOCK) {
      const name = projectNameByCode(dto.project);
      const created: Export = {
        ...dto,
        id: mockId('ex'),
        voucherCode: dto.voucherCode?.trim() || nextVoucherCode('XK', 260110 + store.length),
        projectName: name,
        warehouseName: name,
      };
      store = [created, ...store];
      return mockDelay(created);
    }
    return apiClient.post<Export>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateExportDto): Promise<Export> {
    if (USE_MOCK) {
      store = store.map((x) => (x.id === id ? { ...x, ...dto } : x));
      const updated = store.find((x) => x.id === id);
      if (!updated) throw new Error(`Không tìm thấy phiếu xuất ${id}`);
      return mockDelay(updated);
    }
    return apiClient.put<Export>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<Export> {
    if (USE_MOCK) {
      return this.update(id, { status: 'approved' });
    }
    return apiClient.post<Export>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<Export> {
    if (USE_MOCK) {
      return this.update(id, { status: 'pending' });
    }
    return apiClient.post<Export>(`${ENDPOINT}/${id}/submit`);
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
