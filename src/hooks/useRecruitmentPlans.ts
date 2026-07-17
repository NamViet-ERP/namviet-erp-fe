import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  recruitmentPlansService,
  type DepartmentOption,
  type RecruitmentPlanListParams,
  fetchDepartmentOptions,
} from '../services/recruitmentPlansService';
import type { CreateRecruitmentPlanDto, UpdateRecruitmentPlanDto } from '../types/hr';
import { queryKeys } from '../services/queryKeys';
import { recruitmentInvalidationKeys } from '../lib/recruitmentQueryInvalidation';

function invalidatePlanDependencies(qc: ReturnType<typeof useQueryClient>) {
  for (const queryKey of recruitmentInvalidationKeys.plan) {
    qc.invalidateQueries({ queryKey });
  }
}

export function useRecruitmentPlans(params: RecruitmentPlanListParams = {}, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.recruitmentPlans.all, params] as const,
    queryFn: () => recruitmentPlansService.list(params),
    enabled,
  });
}

export function useDepartmentOptions() {
  return useQuery({
    queryKey: ['hr', 'departments'] as const,
    queryFn: fetchDepartmentOptions,
  });
}

export function useCreateRecruitmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRecruitmentPlanDto) => recruitmentPlansService.create(dto),
    onSuccess: () => invalidatePlanDependencies(qc),
  });
}

export function useUpdateRecruitmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecruitmentPlanDto }) =>
      recruitmentPlansService.update(id, dto),
    onSuccess: () => invalidatePlanDependencies(qc),
  });
}

export function useDeleteRecruitmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recruitmentPlansService.remove(id),
    onSuccess: () => invalidatePlanDependencies(qc),
  });
}

export type { DepartmentOption };
