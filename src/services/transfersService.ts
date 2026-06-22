import type { Transfer } from '../types';
import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay, mockId } from '../lib/mock';
import { MOCK_TRANSFERS, projectNameByCode } from '../data/wmsMockSeed';

export type CreateTransferDto = Omit<Transfer, 'id'>;
export type UpdateTransferDto = Partial<CreateTransferDto>;

const ENDPOINT = '/api/transfers';

let store: Transfer[] = [...MOCK_TRANSFERS];

function nextVoucherCode(prefix: string, seq: number) {
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}

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
      const fromName = projectNameByCode(dto.project);
      const toName = dto.toProject ? projectNameByCode(dto.toProject) : 'Kho tổng';
      const created: Transfer = {
        ...dto,
        id: mockId('tf'),
        voucherCode: dto.voucherCode?.trim() || nextVoucherCode('CK', 260210 + store.length),
        fromWarehouseName: fromName,
        projectName: fromName,
        toWarehouseName: toName,
        toProjectName: dto.toProject ? toName : undefined,
      };
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

  async approve(id: string): Promise<Transfer> {
    if (USE_MOCK) {
      return this.update(id, { status: 'approved' });
    }
    return apiClient.post<Transfer>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<Transfer> {
    if (USE_MOCK) {
      return this.update(id, { status: 'pending' });
    }
    return apiClient.post<Transfer>(`${ENDPOINT}/${id}/submit`);
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
