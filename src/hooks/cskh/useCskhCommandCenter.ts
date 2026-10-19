import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProjects } from '../useProjects';
import { queryKeys } from '../../services/queryKeys';
import { cskhService } from '../../services/cskhService';
import { projectsService } from '../../services/projectsService';
import {
  addLocalProject,
  deleteProjectRecord,
  getProjectRecord,
  listFilterYears,
  loadCommandStore,
  mergeCommandProjects,
  patchProjectRecord,
  saveCommandStore,
  summarizeCommandKpis,
  upsertOverlay,
  type CskhProjectDraft,
  type CskhProjectPatch,
} from '../../lib/cskh/commandCenter';

export function useCskhCommandCenter() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useProjects({ page: 1, pageSize: 200 });
  const [store, setStore] = useState(loadCommandStore);

  const { data: dbProfiles, isLoading: isProfilesLoading } = useQuery({
    queryKey: queryKeys.cskh.profiles,
    queryFn: () => cskhService.getProjectProfiles(),
  });

  const [prevDbProfiles, setPrevDbProfiles] = useState(dbProfiles);
  if (dbProfiles && dbProfiles !== prevDbProfiles) {
    setPrevDbProfiles(dbProfiles);
    if (typeof dbProfiles === 'object' && (dbProfiles as any).overlays) {
      setStore(prev => ({
        ...prev,
        ...dbProfiles,
        overlays: { ...prev.overlays, ...(dbProfiles as any).overlays },
      }));
    }
  }

  useEffect(() => {
    if (dbProfiles && typeof dbProfiles === 'object' && (dbProfiles as any).overlays) {
      saveCommandStore({ ...store, ...dbProfiles });
    }
  }, [dbProfiles, store]);

  const persist = useCallback((next: ReturnType<typeof loadCommandStore>) => {
    setStore(next);
    saveCommandStore(next);
    cskhService.saveProjectProfiles(next).then(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cskh.profiles });
    }).catch(err => {
      console.warn('[CSKH Profiles] Failed to persist to backend:', err);
    });
  }, [queryClient]);

  const projects = useMemo(
    () => mergeCommandProjects(data?.items ?? [], store),
    [data?.items, store],
  );

  const kpis = useMemo(() => summarizeCommandKpis(projects), [projects]);

  const years = useMemo(
    () => listFilterYears(projects.map(p => p.year)),
    [projects],
  );

  const moveProject = useCallback((code: string, phaseId: string) => {
    persist(upsertOverlay(store, code, { phaseId }));
    projectsService.updateStage(code, phaseId).then(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    }).catch(err => {
      console.warn('[CSKH Move Project] updateStage error:', err);
    });
  }, [persist, store, queryClient]);

  const addProject = useCallback((draft: CskhProjectDraft) => {
    persist(addLocalProject(store, draft));
    projectsService.create({
      projectCode: draft.code,
      projectName: draft.name,
      projectType: 'Project',
      pmId: '00000000-0000-0000-0000-000000000000',
      pmName: draft.pmName || 'Chỉ huy trưởng',
      startDate: draft.startDate || new Date().toISOString().slice(0, 10),
      endDate: null,
      materialBudget: 0,
      clientName: draft.clientName,
      stage: draft.phaseId,
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    }).catch(err => {
      console.warn('[CSKH Add Project] Could not create project in WMS DB:', err);
    });
  }, [persist, store, queryClient]);

  const getProject = useCallback(
    (code: string) => getProjectRecord(data?.items ?? [], store, code),
    [data?.items, store],
  );

  const patchProject = useCallback((code: string, patch: CskhProjectPatch) => {
    persist(patchProjectRecord(store, code, patch));
  }, [persist, store]);

  const deleteProject = useCallback((code: string) => {
    persist(deleteProjectRecord(store, code));
  }, [persist, store]);

  return {
    projects,
    kpis,
    years,
    isLoading: isLoading || isProfilesLoading,
    moveProject,
    addProject,
    getProject,
    patchProject,
    deleteProject,
  };
}
