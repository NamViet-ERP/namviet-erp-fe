import { useQuery } from '@tanstack/react-query';
import { recruitmentCalendarService } from '../services/recruitmentCalendarService';
import { queryKeys } from '../services/queryKeys';

export function useRecruitmentCalendar(from: string, to: string) {
  return useQuery({
    queryKey: [...queryKeys.recruitmentCalendar.all, from, to] as const,
    queryFn: () => recruitmentCalendarService.list({ from, to }),
    enabled: Boolean(from && to),
  });
}
