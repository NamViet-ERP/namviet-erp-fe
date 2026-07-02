import { apiClient } from '../lib/apiClient';
import type { BirthdayApiDto } from '../types/api/wms/dashboardApi';

const ENDPOINT = '/api/hr/birthdays';

export const hrBirthdaysService = {
  /** @param month Calendar month 1–12 */
  async list(month: number): Promise<BirthdayApiDto[]> {
    return apiClient.get<BirthdayApiDto[]>(ENDPOINT, { month });
  },
};
