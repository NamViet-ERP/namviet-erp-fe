import { apiClient } from '../lib/apiClient';

export interface ServiceExpenseCategoryDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export const serviceExpenseCategoriesService = {
  async getAll(): Promise<ServiceExpenseCategoryDto[]> {
    try {
      const res = await apiClient.get<ServiceExpenseCategoryDto[]>('/api/purchasing/service-categories');
      return res ?? [];
    } catch {
      return [];
    }
  },
};
