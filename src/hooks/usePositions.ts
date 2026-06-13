import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { positionsService } from '../services/positionsService';
import { queryKeys } from '../services/queryKeys';

export function usePositions() {
  return useQuery({
    queryKey: queryKeys.positions.all,
    queryFn: () => positionsService.list(),
  });
}

export function useActivePositions() {
  return useQuery({
    queryKey: [...queryKeys.positions.all, 'active'] as const,
    queryFn: () => positionsService.listActiveNames(),
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (position: string) => Promise.resolve(positionsService.create(position)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.positions.all });
    },
  });
}

export function useTogglePositionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (position: string) => Promise.resolve(positionsService.toggleStatus(position)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.positions.all });
    },
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (position: string) => {
      positionsService.remove(position);
      return Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.positions.all });
    },
  });
}
