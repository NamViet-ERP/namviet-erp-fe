import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  departmentsService,
  type UpsertDepartmentRequest,
} from '../services/departmentsService';
import { queryKeys } from '../services/queryKeys';

const keys = {
  all: queryKeys.hrDepartments.all,
  list: (activeOnly: boolean) => [...keys.all, 'list', activeOnly] as const,
  detail: (id: number) => [...keys.all, 'detail', id] as const,
  members: (id: number) => [...keys.all, 'members', id] as const,
};

export function useDepartments(activeOnly = false, enabled = true) {
  return useQuery({
    queryKey: keys.list(activeOnly),
    queryFn: () => departmentsService.list(activeOnly),
    enabled,
  });
}

export function useDepartmentMembers(departmentId: number | null) {
  return useQuery({
    queryKey: keys.members(departmentId ?? 0),
    queryFn: () => departmentsService.listMembers(departmentId!),
    enabled: departmentId != null && departmentId > 0,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertDepartmentRequest) => departmentsService.create(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpsertDepartmentRequest }) =>
      departmentsService.update(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departmentsService.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useAssignDepartmentEmployees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employeeIds }: { id: number; employeeIds: number[] }) =>
      departmentsService.assignEmployees(id, employeeIds),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: keys.all });
      void qc.invalidateQueries({ queryKey: keys.members(vars.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}
