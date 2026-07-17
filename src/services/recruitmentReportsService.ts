import { apiClient } from '../lib/apiClient';
import { downloadReportExport } from '../lib/wms/reportExportDownload';

export interface RecruitmentReportSourceRowApiDto {
  source: string;
  cvCount: number;
  interviewCount: number;
  hiredCount: number;
  conversionRate: number;
}

export interface RecruitmentReportPositionRowApiDto {
  position: string;
  cvCount: number;
}

export interface RecruitmentReportSummaryApiDto {
  bySource: RecruitmentReportSourceRowApiDto[];
  byPosition: RecruitmentReportPositionRowApiDto[];
}

const ENDPOINT = '/api/recruitment/reports';

export const recruitmentReportsService = {
  summary(params: { dateFrom?: string; dateTo?: string } = {}) {
    return apiClient.get<RecruitmentReportSummaryApiDto>(`${ENDPOINT}/summary`, {
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
    });
  },
  download(params: { dateFrom?: string; dateTo?: string } = {}) {
    return downloadReportExport(`${ENDPOINT}/export`, 'bao-cao-tuyen-dung.xlsx', {
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
    });
  },
};
