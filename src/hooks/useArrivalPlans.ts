import { useQuery } from '@tanstack/react-query';
import { arrivalPlansService } from '../services/arrivalPlansService';
import { queryKeys } from '../services/queryKeys';

export function useArrivalPlans(daysAhead: number, projectCode?: string) {
  return useQuery({
    queryKey: queryKeys.arrivalPlans.list(daysAhead, projectCode),
    queryFn: () => arrivalPlansService.list(daysAhead, projectCode),
  });
}
