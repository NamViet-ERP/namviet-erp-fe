import { apiClient } from '../lib/apiClient';
import type {
  ArrivalPlanListApiDto,
  ArrivalPlansListParams,
} from '../types/api/arrivalPlansApi';

export type {
  ArrivalPlanLineApiDto,
  ArrivalPlanProjectApiDto,
  ArrivalPlanListApiDto,
  ArrivalPlanLineStatus,
  ArrivalPlansListParams,
} from '../types/api/arrivalPlansApi';

export const arrivalPlansService = {
  list(daysAhead: number, params: ArrivalPlansListParams = {}): Promise<ArrivalPlanListApiDto> {
    return apiClient.get<ArrivalPlanListApiDto>('/api/purchasing/arrival-plans', {
      daysAhead,
      projectCode: params.projectCode || undefined,
      lineStatus: params.lineStatus || undefined,
      overdueLookbackDays: params.overdueLookbackDays,
    });
  },
};
