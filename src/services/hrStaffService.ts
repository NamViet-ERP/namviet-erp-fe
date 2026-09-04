import { apiClient } from '../lib/apiClient';
import { sortViBy } from '../lib/sortVi';
import type { HrStaffPublicApiDto } from '../types/api/hrApi';

/** Domain option for HR responsible selects — name only (public endpoint). */
export type HrStaffOption = HrStaffPublicApiDto;

const ENDPOINT = '/api/recruitment/hr-staff';

export const hrStaffService = {
  async list(): Promise<HrStaffOption[]> {
    const items = await apiClient.get<HrStaffPublicApiDto[]>(ENDPOINT);
    return sortViBy(items, (h) => h.name);
  },
};
