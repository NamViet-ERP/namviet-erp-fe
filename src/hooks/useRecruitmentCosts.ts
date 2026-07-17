import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  recruitmentCostsService,
  type CreateRecruitmentCostApiDto,
  type RecruitmentCostListParams,
  type UpdateRecruitmentCostApiDto,
} from '../services/recruitmentCostsService';
import { queryKeys } from '../services/queryKeys';
import { recruitmentInvalidationKeys } from '../lib/recruitmentQueryInvalidation';

function invalidateKeys(
  qc: ReturnType<typeof useQueryClient>,
  keys: readonly (readonly unknown[])[],
) {
  for (const queryKey of keys) {
    qc.invalidateQueries({ queryKey });
  }
}

export function useRecruitmentCosts(params: RecruitmentCostListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.recruitmentCosts.all, params] as const,
    queryFn: () => recruitmentCostsService.list(params),
  });
}

export function useRecruitmentBudget(year?: number) {
  return useQuery({
    queryKey: queryKeys.recruitmentBudget.year(year ?? new Date().getFullYear()),
    queryFn: () => recruitmentCostsService.getBudget(year),
  });
}

export function useUpdateRecruitmentBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, totalAllocated }: { year: number; totalAllocated: number }) =>
      recruitmentCostsService.updateBudget(year, totalAllocated),
    onSuccess: () => invalidateKeys(qc, recruitmentInvalidationKeys.budget),
  });
}

export function useRecruitmentCostSummary() {
  return useQuery({
    queryKey: queryKeys.recruitmentCosts.summary,
    queryFn: () => recruitmentCostsService.summary(),
  });
}

export function useCreateRecruitmentCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRecruitmentCostApiDto) => recruitmentCostsService.create(dto),
    onSuccess: () => invalidateKeys(qc, recruitmentInvalidationKeys.cost),
  });
}

export function useUpdateRecruitmentCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRecruitmentCostApiDto }) =>
      recruitmentCostsService.update(id, dto),
    onSuccess: () => invalidateKeys(qc, recruitmentInvalidationKeys.cost),
  });
}

export function useDeleteRecruitmentCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recruitmentCostsService.remove(id),
    onSuccess: () => invalidateKeys(qc, recruitmentInvalidationKeys.cost),
  });
}
