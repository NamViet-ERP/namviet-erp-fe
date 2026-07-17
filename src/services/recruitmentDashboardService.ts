import { apiClient } from '../lib/apiClient';

export interface RecruitmentKpiApiDto {
  totalCandidates: number;
  newCount: number;
  screeningCount: number;
  interviewCount: number;
  offeredCount: number;
  acceptedCount: number;
  rejectedCount: number;
  totalHeadcount: number;
  totalHired: number;
  totalRemaining: number;
  interviewsScheduled: number;
  openPlanCount: number;
  interviewedCount: number;
}

export interface RecruitmentTrendApiDto {
  month: string;
  applications: number;
  hires: number;
}

export interface RecruitmentSourceStatApiDto {
  source: string;
  count: number;
}

export interface RecruitmentPositionStatApiDto {
  position: string;
  count: number;
}

export interface RecruitmentCostBySourceApiDto {
  source: string;
  totalAmount: number;
  hireCount: number;
  costPerHire?: number | null;
}

const ENDPOINT = '/api/recruitment/dashboard';

export const recruitmentDashboardService = {
  kpi() {
    return apiClient.get<RecruitmentKpiApiDto>(`${ENDPOINT}/kpi`);
  },
  trend(months = 6) {
    return apiClient.get<RecruitmentTrendApiDto[]>(`${ENDPOINT}/trend`, { months });
  },
  bySource() {
    return apiClient.get<RecruitmentSourceStatApiDto[]>(`${ENDPOINT}/by-source`);
  },
  byPosition() {
    return apiClient.get<RecruitmentPositionStatApiDto[]>(`${ENDPOINT}/by-position`);
  },
  costBySource() {
    return apiClient.get<RecruitmentCostBySourceApiDto[]>(`${ENDPOINT}/cost-by-source`);
  },
};
