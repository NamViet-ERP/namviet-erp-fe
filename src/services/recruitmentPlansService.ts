import { apiClient } from '../lib/apiClient';
import type {
  CreateRecruitmentPlanRequest,
  DepartmentApiDto,
  RecruitmentPlanApiDto,
  UpdateRecruitmentPlanRequest,
} from '../types/api/hrApi';
import type { CreateRecruitmentPlanDto, RecruitmentPlan, UpdateRecruitmentPlanDto } from '../types/hr';

const ENDPOINT = '/api/recruitment/plans';

export type { RecruitmentPlanApiDto };

export interface RecruitmentPlanListParams {
  department?: string;
  departmentId?: number;
  status?: string;
  period?: string;
  openMonth?: string;
}

function fromApi(dto: RecruitmentPlanApiDto): RecruitmentPlan {
  return {
    id: dto.id,
    positionName: dto.positionName,
    departmentName: dto.departmentName,
    departmentId: dto.departmentId ?? undefined,
    headcount: dto.headcount,
    hiredCount: dto.hiredCount,
    remainingCount: dto.remainingCount,
    reason: dto.reason ?? undefined,
    period: dto.period ?? undefined,
    openDate: dto.openDate ?? undefined,
    deadlineDate: dto.deadlineDate ?? undefined,
    status: dto.status,
  };
}

function toApi(
  dto: CreateRecruitmentPlanDto | UpdateRecruitmentPlanDto,
): CreateRecruitmentPlanRequest | UpdateRecruitmentPlanRequest {
  return {
    positionName: dto.positionName,
    departmentName: dto.departmentName || null,
    departmentId: dto.departmentId ?? null,
    headcount: dto.headcount,
    reason: dto.reason ?? null,
    period: dto.period ?? null,
    openDate: dto.openDate ?? null,
    deadlineDate: dto.deadlineDate ?? null,
    status: dto.status,
  };
}

export const recruitmentPlansService = {
  async list(params: RecruitmentPlanListParams = {}): Promise<RecruitmentPlan[]> {
    const items = await apiClient.get<RecruitmentPlanApiDto[]>(ENDPOINT, {
      department: params.department || undefined,
      departmentId: params.departmentId || undefined,
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
  const items = await apiClient.get<DepartmentApiDto[]>('/api/hr/departments');
  return items.map(d => ({ id: d.id, name: d.name, code: d.code }));
}
