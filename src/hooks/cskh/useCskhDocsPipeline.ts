import { useCallback, useState } from 'react';
import {
  loadDocsStore,
  patchProjectDocs,
  projectDocs,
  saveDocsStore,
  type CskhProjectDocs,
} from '../../lib/cskh/docsPipeline';

export function useCskhDocsPipeline(projectCode: string) {
  const [store, setStore] = useState(loadDocsStore);

  const persist = useCallback((next: ReturnType<typeof loadDocsStore>) => {
    setStore(next);
    saveDocsStore(next);
  }, []);

  const docs = projectDocs(store, projectCode);

  const update = useCallback((fn: (current: CskhProjectDocs) => CskhProjectDocs) => {
    persist(patchProjectDocs(store, projectCode, fn(projectDocs(store, projectCode))));
  }, [persist, projectCode, store]);

  return { docs, update };
}
