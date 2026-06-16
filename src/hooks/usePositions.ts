import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sortVi } from '../lib/sortVi';
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

/** Dropdown: chỉ vị trí đang bật; giữ thêm giá trị hiện tại nếu đã bị tắt (hồ sơ cũ). */
export function usePositionSelectOptions(currentValue?: string) {
  const { data: positions = [] } = usePositions();
  return useMemo(() => {
    const active = positions.filter(p => p.isActive).map(p => p.name);
    const current = currentValue?.trim();
    const names = current && !active.includes(current) ? [...active, current] : active;
    return sortVi(names);
  }, [positions, currentValue]);}

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
