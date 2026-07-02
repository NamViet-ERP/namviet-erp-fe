import { apiClient } from '../lib/apiClient';
import { sortVi, sortViBy } from '../lib/sortVi';

export interface RecruitmentPosition {
  name: string;
  isActive: boolean;
}

const ENDPOINT = '/api/recruitment/positions';

export const positionsService = {
  async list(): Promise<RecruitmentPosition[]> {
    const items = await apiClient.get<RecruitmentPosition[]>(ENDPOINT);
    return sortViBy(items, (p) => p.name);
  },

  async listActiveNames(): Promise<string[]> {
    const items = await this.list();
    return sortVi(items.filter((p) => p.isActive).map((p) => p.name));
  },

  async create(name: string): Promise<RecruitmentPosition> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Tên vị trí không được để trống');

    return apiClient.post<RecruitmentPosition>(ENDPOINT, { name: trimmed, isActive: true });
  },

  async toggleStatus(name: string): Promise<RecruitmentPosition> {
    await apiClient.patch<void>(`${ENDPOINT}/${encodeURIComponent(name)}/toggle`);
    const items = await positionsService.list();
    const found = items.find((p) => p.name === name);
    if (!found) throw new Error(`Không tìm thấy vị trí "${name}"`);
    return found;
  },

  async remove(name: string): Promise<void> {
    await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(name)}`);
  },
};
