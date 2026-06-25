import { apiClient } from '../lib/apiClient';
import { sortViBy } from '../lib/sortVi';
import { resolveMock } from '../mocks';

export interface HrStaffOption {
  id: string;
  name: string;
}

const ENDPOINT = '/api/recruitment/hr-staff';
const MOCK = () => import('../mocks/services/hrStaffService.mock');

export const hrStaffService = {
  async list(): Promise<HrStaffOption[]> {
    return resolveMock(
      () => MOCK().then((m) => m.listHrStaffMock()),
      async () => {
        const items = await apiClient.get<HrStaffOption[]>(ENDPOINT);
        return sortViBy(items, (h) => h.name);
      },
    );
  },
};
