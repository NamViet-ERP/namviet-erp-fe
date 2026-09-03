import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  branchesService,
  type UpsertBranchRequest,
} from '../services/branchesService';

const keys = {
  all: ['hr', 'branches'] as const,
  list: (activeOnly: boolean) => [...keys.all, 'list', activeOnly] as const,
  detail: (id: number) => [...keys.all, 'detail', id] as const,
};

export function useBranches(activeOnly = false, enabled = true) {
  return useQuery({
    queryKey: keys.list(activeOnly),
    queryFn: () => branchesService.list(activeOnly),
    enabled,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertBranchRequest) => branchesService.create(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertBranchRequest }) =>
      branchesService.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all });
      void qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => branchesService.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.all }),
  });
}
