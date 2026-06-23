import { apiClient } from '../lib/apiClient';
import { sortViBy } from '../lib/sortVi';
import { USE_MOCK } from '../lib/mock';

export interface HrStaffOption {
  id: string;
  name: string;
}

const ENDPOINT = '/api/recruitment/hr-staff';

export const hrStaffService = {
  async list(): Promise<HrStaffOption[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/hrStaffService.mock');
      return mock.listHrStaffMock();
    }
    const items = await apiClient.get<HrStaffOption[]>(ENDPOINT);
    return sortViBy(items, h => h.name);
  },
};
