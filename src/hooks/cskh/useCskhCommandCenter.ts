import { useCallback, useMemo, useState } from 'react';
import { useProjects } from '../useProjects';
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
  const { data, isLoading } = useProjects({ page: 1, pageSize: 200 });
  const [store, setStore] = useState(loadCommandStore);

  const persist = useCallback((next: ReturnType<typeof loadCommandStore>) => {
    setStore(next);
    saveCommandStore(next);
  }, []);

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
  }, [persist, store]);

  const addProject = useCallback((draft: CskhProjectDraft) => {
    persist(addLocalProject(store, draft));
  }, [persist, store]);

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

  return { projects, kpis, years, isLoading, moveProject, addProject, getProject, patchProject, deleteProject };
}
