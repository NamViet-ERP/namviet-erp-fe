import { apiClient } from '../lib/apiClient';
import { sortVi, sortViBy } from '../lib/sortVi';
import { USE_MOCK } from '../lib/mock';

export interface RecruitmentPosition {
  name: string;
  isActive: boolean;
}

const ENDPOINT = '/api/recruitment/positions';

export const positionsService = {
  async list(): Promise<RecruitmentPosition[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/positionsService.mock');
      return mock.listPositionsMock();
    }
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
      const mock = await import('./mocks/positionsService.mock');
      return mock.createPositionMock(trimmed);
    }

    return apiClient.post<RecruitmentPosition>(ENDPOINT, { name: trimmed, isActive: true });
  },

  async toggleStatus(name: string): Promise<RecruitmentPosition> {
    if (USE_MOCK) {
      const mock = await import('./mocks/positionsService.mock');
      return mock.togglePositionStatusMock(name);
    }

    await apiClient.patch<void>(`${ENDPOINT}/${encodeURIComponent(name)}/toggle`);
    const items = await this.list();
    const found = items.find(p => p.name === name);
    if (!found) throw new Error(`Không tìm thấy vị trí "${name}"`);
    return found;
  },

  async remove(name: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/positionsService.mock');
      return mock.removePositionMock(name);
    }
    await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(name)}`);
  },
};
