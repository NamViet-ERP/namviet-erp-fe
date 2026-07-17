import { useQuery } from '@tanstack/react-query';
import { recruitmentReportsService } from '../services/recruitmentReportsService';
import { queryKeys } from '../services/queryKeys';

export function useRecruitmentReportSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: [...queryKeys.recruitmentReports.summary, dateFrom, dateTo] as const,
    queryFn: () => recruitmentReportsService.summary({ dateFrom, dateTo }),
  });
}
