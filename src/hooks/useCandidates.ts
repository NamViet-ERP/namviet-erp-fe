import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesService } from '../services/candidatesService';
import type { CreateCandidateDto, UpdateCandidateDto } from '../types/hr';
import { queryKeys } from '../services/queryKeys';

export function useCandidates() {
  return useQuery({
    queryKey: queryKeys.candidates.all,
    queryFn: () => candidatesService.list(),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.candidates.all }),
  });
}

export function useUpdateCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCandidateDto }) =>
      candidatesService.update(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.candidates.all });
      qc.invalidateQueries({ queryKey: queryKeys.candidates.detail(id) });
    },
  });
}
