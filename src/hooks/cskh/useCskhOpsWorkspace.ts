import { useCallback, useState } from 'react';
import {
  loadOpsStore,
  patchProjectOps,
  projectOps,
  saveOpsStore,
  type CskhProjectOps,
} from '../../lib/cskh/opsWorkspace';

export function useCskhOpsWorkspace(projectCode: string) {
  const [store, setStore] = useState(loadOpsStore);

  const persist = useCallback((next: ReturnType<typeof loadOpsStore>) => {
    setStore(next);
    saveOpsStore(next);
  }, []);

  const ops = projectOps(store, projectCode);

  const update = useCallback((fn: (current: CskhProjectOps) => CskhProjectOps) => {
    persist(patchProjectOps(store, projectCode, fn(projectOps(store, projectCode))));
  }, [persist, projectCode, store]);

  return { ops, update };
}
