import { apiClient } from '../lib/apiClient';

export interface RecruitmentCostApiDto {
  id: string;
  source: string;
  amount: number;
  period: string;
  positionName?: string;
  durationDays?: number;
  paymentYear?: number;
  paymentMonth?: number;
  note?: string;
}

export interface RecruitmentCostSummaryApiDto {
  source: string;
  totalAmount: number;
  hireCount: number;
  costPerHire?: number | null;
}

export interface RecruitmentBudgetApiDto {
  year: number;
  totalAllocated: number;
  totalUsed: number;
  remaining: number;
}

export interface RecruitmentCostListParams {
  source?: string;
  position?: string;
  year?: number;
  month?: number;
}

export type CreateRecruitmentCostApiDto = Omit<RecruitmentCostApiDto, 'id'>;
export type UpdateRecruitmentCostApiDto = CreateRecruitmentCostApiDto;

const ENDPOINT = '/api/recruitment/costs';
const BUDGET_ENDPOINT = '/api/recruitment/budget';

export const recruitmentCostsService = {
  list(params: RecruitmentCostListParams = {}) {
    return apiClient.get<RecruitmentCostApiDto[]>(ENDPOINT, {
      source: params.source || undefined,
      position: params.position || undefined,
      year: params.year || undefined,
      month: params.month || undefined,
    });
  },
  summary() {
    return apiClient.get<RecruitmentCostSummaryApiDto[]>(`${ENDPOINT}/summary`);
  },
  getBudget(year?: number) {
    return apiClient.get<RecruitmentBudgetApiDto>(BUDGET_ENDPOINT, { year });
  },
  updateBudget(year: number, totalAllocated: number) {
    return apiClient.put<RecruitmentBudgetApiDto>(BUDGET_ENDPOINT, { year, totalAllocated });
  },
  create(dto: CreateRecruitmentCostApiDto) {
    return apiClient.post<RecruitmentCostApiDto>(ENDPOINT, dto);
  },
  update(id: string, dto: UpdateRecruitmentCostApiDto) {
    return apiClient.put<RecruitmentCostApiDto>(`${ENDPOINT}/${id}`, dto);
  },
  remove(id: string) {
    return apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
