import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesService, type CandidateListParams } from '../services/candidatesService';
import type { CreateCandidateDto, UpdateCandidateDto } from '../types/hr';
import { queryKeys } from '../services/queryKeys';
import { recruitmentInvalidationKeys } from '../lib/recruitmentQueryInvalidation';

function invalidateCandidateDependencies(qc: ReturnType<typeof useQueryClient>) {
  for (const queryKey of recruitmentInvalidationKeys.candidate) {
    qc.invalidateQueries({ queryKey });
  }
}

export function useCandidates(params: CandidateListParams) {
  return useQuery({
    queryKey: [...queryKeys.candidates.all, params] as const,
    queryFn: () => candidatesService.list(params),
  });
}

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.candidates.detail(id ?? ''),
    queryFn: () => candidatesService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCandidateDto) => candidatesService.create(dto),
    onSuccess: () => {
      invalidateCandidateDependencies(qc);
    },
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCandidateDto }) =>
      candidatesService.update(id, dto),
    onSuccess: (_data, { id }) => {
      invalidateCandidateDependencies(qc);
      qc.invalidateQueries({ queryKey: queryKeys.candidates.detail(id) });
    },
  });
}

export function useUpdateCandidateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: import('../services/candidatesService').UpdateCandidateStatusPayload }) =>
      candidatesService.updateStatus(id, payload),
    onSuccess: (_data, { id }) => {
      invalidateCandidateDependencies(qc);
      qc.invalidateQueries({ queryKey: queryKeys.candidates.detail(id) });
    },
  });
}
