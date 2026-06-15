import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesService } from '../services/employeesService';
import type { CreateEmployeeDto, UpdateEmployeeDto } from '../types/hr';
import { queryKeys } from '../services/queryKeys';

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: () => employeesService.list(),
  });
}

export function useActiveEmployees() {
  return useQuery({
    queryKey: [...queryKeys.employees.all, 'active'],
    queryFn: () => employeesService.listActive(),
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id ?? ''),
    queryFn: () => employeesService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEmployeeDto) => employeesService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.employees.all }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEmployeeDto }) =>
      employeesService.update(id, dto),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      qc.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
    },
  });
}
