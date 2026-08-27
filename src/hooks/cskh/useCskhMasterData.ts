import { useCallback, useState } from 'react';
import {
  loadMasterStore,
  saveMasterStore,
  type CskhMasterStore,
} from '../../lib/cskh/masterData';

export function useCskhMasterData() {
  const [store, setStore] = useState(loadMasterStore);

  const persist = useCallback((next: CskhMasterStore | ((prev: CskhMasterStore) => CskhMasterStore)) => {
    setStore(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      saveMasterStore(resolved);
      return resolved;
    });
  }, []);

  return { store, persist };
}
