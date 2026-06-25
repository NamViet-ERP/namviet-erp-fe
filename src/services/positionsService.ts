import { apiClient } from '../lib/apiClient';
import { sortVi, sortViBy } from '../lib/sortVi';
import { resolveMock } from '../mocks';

export interface RecruitmentPosition {
  name: string;
  isActive: boolean;
}

const ENDPOINT = '/api/recruitment/positions';
const MOCK = () => import('../mocks/services/positionsService.mock');

export const positionsService = {
  async list(): Promise<RecruitmentPosition[]> {
    return resolveMock(
      () => MOCK().then((m) => m.listPositionsMock()),
      async () => {
        const items = await apiClient.get<RecruitmentPosition[]>(ENDPOINT);
        return sortViBy(items, (p) => p.name);
      },
    );
  },

  async listActiveNames(): Promise<string[]> {
    const items = await this.list();
    return sortVi(items.filter((p) => p.isActive).map((p) => p.name));
  },

  async create(name: string): Promise<RecruitmentPosition> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Tên vị trí không được để trống');

    return resolveMock(
      () => MOCK().then((m) => m.createPositionMock(trimmed)),
      () => apiClient.post<RecruitmentPosition>(ENDPOINT, { name: trimmed, isActive: true }),
    );
  },

  async toggleStatus(name: string): Promise<RecruitmentPosition> {
    return resolveMock(
      () => MOCK().then((m) => m.togglePositionStatusMock(name)),
      async () => {
        await apiClient.patch<void>(`${ENDPOINT}/${encodeURIComponent(name)}/toggle`);
        const items = await positionsService.list();
        const found = items.find((p) => p.name === name);
        if (!found) throw new Error(`Không tìm thấy vị trí "${name}"`);
        return found;
      },
    );
  },

  async remove(name: string): Promise<void> {
    return resolveMock(
      () => MOCK().then((m) => m.removePositionMock(name)),
      async () => { await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(name)}`); },
    );
  },
};
