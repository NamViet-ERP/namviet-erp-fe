import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateWarehouseProjectRequest } from '../types/wms';
import { projectsService, type ProjectListParams } from '../services/projectsService';
import { queryKeys } from '../services/queryKeys';

export function useProjects(params: ProjectListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.projects.all, params] as const,
    queryFn: () => projectsService.list(params),
  });
}

export function useProject(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(code ?? ''),
    queryFn: () => projectsService.getByCode(code as string),
    enabled: Boolean(code),
  });
}

export function useProjectInventory(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.inventory(code ?? ''),
    queryFn: () => projectsService.getInventory(code as string),
    enabled: Boolean(code),
  });
}

export function useProjectLedger(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.ledger(code ?? ''),
    queryFn: () => projectsService.getLedger(code as string),
    enabled: Boolean(code),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWarehouseProjectRequest) => projectsService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}

export function useCloseProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => projectsService.closeProject(code),
    onSuccess: (_data, code) => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(code) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.inventory(code) });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}
