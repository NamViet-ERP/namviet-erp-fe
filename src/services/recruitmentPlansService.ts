import { apiClient } from '../lib/apiClient';
import type { CreateRecruitmentPlanDto, RecruitmentPlan, UpdateRecruitmentPlanDto } from '../types/hr';

const ENDPOINT = '/api/recruitment/plans';

export interface RecruitmentPlanListParams {
  department?: string;
  status?: string;
  period?: string;
  openMonth?: string;
}

export interface RecruitmentPlanApiDto {
  id: string;
  positionName: string;
  departmentName: string;
  headcount: number;
  hiredCount: number;
  remainingCount: number;
  reason?: string;
  period?: string;
  openDate?: string;
  deadlineDate?: string;
  status: string;
}

function fromApi(dto: RecruitmentPlanApiDto): RecruitmentPlan {
  return {
    id: dto.id,
    positionName: dto.positionName,
    departmentName: dto.departmentName,
    headcount: dto.headcount,
    hiredCount: dto.hiredCount,
    remainingCount: dto.remainingCount,
    reason: dto.reason,
    period: dto.period,
    openDate: dto.openDate,
    deadlineDate: dto.deadlineDate,
    status: dto.status,
  };
}

function toApi(dto: CreateRecruitmentPlanDto | UpdateRecruitmentPlanDto) {
  return {
    positionName: dto.positionName,
    departmentName: dto.departmentName,
    headcount: dto.headcount,
    reason: dto.reason,
    period: dto.period,
    openDate: dto.openDate,
    deadlineDate: dto.deadlineDate,
    status: dto.status,
  };
}

export const recruitmentPlansService = {
  async list(params: RecruitmentPlanListParams = {}): Promise<RecruitmentPlan[]> {
    const items = await apiClient.get<RecruitmentPlanApiDto[]>(ENDPOINT, {
      department: params.department || undefined,
      status: params.status || undefined,
      period: params.period || undefined,
      openMonth: params.openMonth || undefined,
    });
    return items.map(fromApi);
  },

  async create(dto: CreateRecruitmentPlanDto): Promise<RecruitmentPlan> {
    return fromApi(await apiClient.post<RecruitmentPlanApiDto>(ENDPOINT, toApi(dto)));
  },

  async update(id: string, dto: UpdateRecruitmentPlanDto): Promise<RecruitmentPlan> {
    return fromApi(await apiClient.put<RecruitmentPlanApiDto>(`${ENDPOINT}/${id}`, toApi(dto)));
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};

export interface DepartmentOption {
  id: number;
  name: string;
  code: string;
}

export async function fetchDepartmentOptions(): Promise<DepartmentOption[]> {
  const items = await apiClient.get<Array<{ id: number; name: string; code: string }>>(
    '/api/hr/departments',
  );
  return items.map(d => ({ id: d.id, name: d.name, code: d.code }));
}
