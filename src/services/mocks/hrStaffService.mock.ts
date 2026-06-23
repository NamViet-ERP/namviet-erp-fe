import { mockDelay } from '../../lib/mock';
import { sortViBy } from '../../lib/sortVi';
import { getHrStaff } from '../../constants/systemUsers';
import type { HrStaffOption } from '../hrStaffService';

export async function listHrStaffMock(): Promise<HrStaffOption[]> {
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
