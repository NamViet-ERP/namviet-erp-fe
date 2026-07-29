import { useQuery } from '@tanstack/react-query';
import { arrivalPlansService, type ArrivalPlansListParams } from '../services/arrivalPlansService';
import { queryKeys } from '../services/queryKeys';

export function useArrivalPlans(daysAhead: number, params: ArrivalPlansListParams = {}) {
  return useQuery({
    queryKey: queryKeys.arrivalPlans.list(daysAhead, params),
    queryFn: () => arrivalPlansService.list(daysAhead, params),
  });
}
