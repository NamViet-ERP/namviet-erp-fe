import { apiClient } from '../lib/apiClient';
import { createMockLocalStore } from '../lib/mockLocalStore';
import { sortVi, sortViBy } from '../lib/sortVi';
import { USE_MOCK, mockDelay } from '../lib/mock';
import { RECRUITMENT_POSITIONS } from '../constants/recruitment';

export interface RecruitmentPosition {
  name: string;
  isActive: boolean;
}

const ENDPOINT = '/api/recruitment/positions';

const initial: RecruitmentPosition[] = RECRUITMENT_POSITIONS.map(name => ({
  name,
  isActive: true,
}));

const { readStore, writeStore } = createMockLocalStore('nv-recruitment-positions-v2', initial);

export const positionsService = {
  async list(): Promise<RecruitmentPosition[]> {
    if (USE_MOCK) return mockDelay(sortViBy(readStore(), p => p.name));
    const items = await apiClient.get<RecruitmentPosition[]>(ENDPOINT);
    return sortViBy(items, p => p.name);
  },

  async listActiveNames(): Promise<string[]> {
    const items = await this.list();
    return sortVi(items.filter(p => p.isActive).map(p => p.name));
  },

  async create(name: string): Promise<RecruitmentPosition> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Tên vị trí không được để trống');

    if (USE_MOCK) {
      const items = readStore();
      if (items.some(item => item.name.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error('Vị trí này đã tồn tại');
      }
      const created: RecruitmentPosition = { name: trimmed, isActive: true };
      items.push(created);
      writeStore(items);
      return mockDelay(created);
    }

    return apiClient.post<RecruitmentPosition>(ENDPOINT, { name: trimmed, isActive: true });
  },

  async toggleStatus(name: string): Promise<RecruitmentPosition> {
    if (USE_MOCK) {
      const items = readStore();
      const idx = items.findIndex(item => item.name === name);
      if (idx === -1) throw new Error(`Không tìm thấy vị trí "${name}"`);
      items[idx].isActive = !items[idx].isActive;
      writeStore(items);
      return mockDelay(items[idx]);
    }

    await apiClient.patch<void>(`${ENDPOINT}/${encodeURIComponent(name)}/toggle`);
    const items = await this.list();
    const found = items.find(p => p.name === name);
    if (!found) throw new Error(`Không tìm thấy vị trí "${name}"`);
    return found;
  },

  async remove(name: string): Promise<void> {
    if (USE_MOCK) {
      writeStore(readStore().filter(item => item.name !== name));
      await mockDelay(undefined);
      return;
    }
    await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(name)}`);
  },
};
