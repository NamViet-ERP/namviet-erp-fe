import { apiClient } from '../lib/apiClient';
import { sortViBy } from '../lib/sortVi';

export interface HrStaffOption {
  id: string;
  name: string;
}

const ENDPOINT = '/api/recruitment/hr-staff';

export const hrStaffService = {
  async list(): Promise<HrStaffOption[]> {
    const items = await apiClient.get<HrStaffOption[]>(ENDPOINT);
    return sortViBy(items, (h) => h.name);
  },
};
