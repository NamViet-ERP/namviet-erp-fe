import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProjects } from '../useProjects';
import { queryKeys } from '../../services/queryKeys';
import { cskhService } from '../../services/cskhService';
import { projectsService } from '../../services/projectsService';
import type { UpdateWarehouseProjectRequest } from '../../types/wms';
import {
  deleteProjectRecord, getProjectRecord, listFilterYears, mergeCommandProjects,
  patchProjectRecord, summarizeCommandKpis,
  type CskhCommandStore, type CskhProjectPatch,
} from '../../lib/cskh/commandCenter';

// The project API owns identity and membership. Profiles contain CSKH-only details.
function profilesOnly(value?: CskhCommandStore): CskhCommandStore {
  return { overlays: value?.overlays ?? {}, localProjects: [] };
}

export function useCskhCommandCenter() {
  const queryClient = useQueryClient();
  const projectsQuery = useProjects({ page: 1, pageSize: 200 });
  const profilesQuery = useQuery({
    queryKey: queryKeys.cskh.profiles,
    queryFn: () => cskhService.getProjectProfiles<CskhCommandStore>(),
  });
  const store = useMemo(() => profilesOnly(profilesQuery.data), [profilesQuery.data]);
  const projects = useMemo(() => mergeCommandProjects(projectsQuery.data?.items ?? [], store), [projectsQuery.data, store]);
  const kpis = useMemo(() => summarizeCommandKpis(projects), [projects]);
  const years = useMemo(() => listFilterYears(projects.map(p => p.year)), [projects]);

  const persist = useCallback(async (transform: (current: CskhCommandStore) => CskhCommandStore) => {
    const current = queryClient.getQueryData<CskhCommandStore>(queryKeys.cskh.profiles);
    if (!current) throw new Error('Chưa tải được hồ sơ CSKH. Vui lòng thử lại.');
    const next = profilesOnly(transform(profilesOnly(current)));
    await cskhService.saveProjectProfiles(next);
    queryClient.setQueryData(queryKeys.cskh.profiles, next);
  }, [queryClient]);

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.matrix }),
      queryClient.invalidateQueries({ queryKey: queryKeys.cskh.profiles }),
    ]);
  }, [queryClient]);

  const moveProject = useCallback(async (code: string, phaseId: string) => {
    await projectsService.updateStage(code, phaseId);
    await invalidate();
  }, [invalidate]);

  const patchProject = useCallback(async (code: string, patch: CskhProjectPatch) => {
    const { name, clientName, pmName, startDate, phaseId, ...profilePatch } = patch;
    try {
      if ([name, clientName, pmName, startDate, phaseId].some(value => value !== undefined)) {
        const current = await projectsService.getByCode(code);
        const body: UpdateWarehouseProjectRequest = {
          projectName: name ?? current.projectName,
          pmId: current.pmId, pmName: pmName ?? current.pmName,
          startDate: startDate ?? current.startDate, endDate: current.endDate,
          materialBudget: current.materialBudget,
          status: current.status as UpdateWarehouseProjectRequest['status'],
          warehouseKeepers: current.warehouseKeepers, scMembers: current.scMembers,
          clientName: clientName === undefined ? current.clientName : clientName,
          stage: phaseId ?? current.stage,
        };
        await projectsService.update(code, body);
      }
      if (Object.keys(profilePatch).length) await persist(current => patchProjectRecord(current, code, profilePatch));
    } finally {
      await invalidate();
    }
  }, [persist, invalidate]);

  const deleteProject = useCallback(async (code: string) => {
    await projectsService.deleteProject(code);
    try {
      await persist(current => deleteProjectRecord(current, code));
    } finally {
      await invalidate();
    }
  }, [persist, invalidate]);

  const getProject = useCallback((code: string) => getProjectRecord(projectsQuery.data?.items ?? [], store, code), [projectsQuery.data, store]);
  return {
    projects, kpis, years, moveProject, getProject, patchProject, deleteProject,
    isLoading: projectsQuery.isLoading || profilesQuery.isLoading,
    isError: projectsQuery.isError || profilesQuery.isError,
    error: projectsQuery.error ?? profilesQuery.error,
    refetch: () => Promise.all([projectsQuery.refetch(), profilesQuery.refetch()]),
  };
}
