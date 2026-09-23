import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateProjectConstructionTaskRequest,
  CreateWarehouseProjectRequest,
  UpdateProjectConstructionTaskRequest,
  UpdateWarehouseProjectRequest,
} from '../types/wms';
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

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: UpdateWarehouseProjectRequest }) =>
      projectsService.update(code, body),
    onSuccess: (_data, { code }) => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(code) });
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

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => projectsService.deleteProject(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
    },
  });
}

export function useUpdateProjectInventoryMinStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectCode,
      materialCode,
      minStockQty,
    }: {
      projectCode: string;
      materialCode: string;
      minStockQty: number;
    }) => projectsService.updateInventoryMinStock(projectCode, materialCode, minStockQty),
    onSuccess: (_data, { projectCode }) => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.inventory(projectCode) });
      qc.invalidateQueries({ queryKey: queryKeys.lowStockAlerts.all });
    },
  });
}

export function useProjectPurchasingProgress(projectCode?: string) {
  return useQuery({
    queryKey: queryKeys.projects.purchasingProgress(projectCode),
    queryFn: () => projectsService.listPurchasingProgress(projectCode),
  });
}

export function useProjectConstructionTasks(projectCode?: string) {
  return useQuery({
    queryKey: queryKeys.projects.constructionTasks(projectCode),
    queryFn: () => projectsService.listConstructionTasks(projectCode),
  });
}

export function useCreateProjectConstructionTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectCode,
      body,
    }: {
      projectCode: string;
      body: CreateProjectConstructionTaskRequest;
    }) => projectsService.createConstructionTask(projectCode, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useUpdateProjectConstructionTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectCode,
      id,
      body,
    }: {
      projectCode: string;
      id: string;
      body: UpdateProjectConstructionTaskRequest;
    }) => projectsService.updateConstructionTask(projectCode, id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useDeleteProjectConstructionTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectCode, id }: { projectCode: string; id: string }) =>
      projectsService.deleteConstructionTask(projectCode, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
