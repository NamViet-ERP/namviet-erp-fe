import { apiClient } from '../lib/apiClient';
import { sortViBy } from '../lib/sortVi';
import { USE_MOCK, mockDelay } from '../lib/mock';
import { getHrStaff } from '../constants/systemUsers';

export interface HrStaffOption {
  id: string;
  name: string;
}

const ENDPOINT = '/api/recruitment/hr-staff';

export const hrStaffService = {
  async list(): Promise<HrStaffOption[]> {
    if (USE_MOCK) {
      return mockDelay(
        sortViBy(
          getHrStaff().map(u => ({
            id: u.id,
            name: u.name,
          })),
          h => h.name,
        ),
      );
    }
    const items = await apiClient.get<HrStaffOption[]>(ENDPOINT);
    return sortViBy(items, h => h.name);
  },
};
