import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/queryKeys';
import { cskhService } from '../../services/cskhService';
import {
  loadMasterStore,
  saveMasterStore,
  type CskhMasterStore,
} from '../../lib/cskh/masterData';

export function useCskhMasterData() {
  const queryClient = useQueryClient();
  const [store, setStore] = useState<CskhMasterStore>(loadMasterStore);

  const { data: dbStore, isLoading } = useQuery({
    queryKey: queryKeys.cskh.masterData,
    queryFn: () => cskhService.getMasterData<CskhMasterStore>(),
  });

  const [prevDbStore, setPrevDbStore] = useState(dbStore);
  if (dbStore && dbStore !== prevDbStore) {
    setPrevDbStore(dbStore);
    if (typeof dbStore === 'object' && Array.isArray((dbStore as any).phases)) {
      setStore(dbStore);
    }
  }

  useEffect(() => {
    if (dbStore && typeof dbStore === 'object' && Array.isArray((dbStore as any).phases)) {
      saveMasterStore(dbStore);
    }
  }, [dbStore]);

  const persist = useCallback((next: CskhMasterStore | ((prev: CskhMasterStore) => CskhMasterStore)) => {
    setStore(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      saveMasterStore(resolved);
      cskhService.saveMasterData(resolved).then(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.cskh.masterData });
      }).catch(err => {
        console.warn('[CSKH Master Data] Could not save to server:', err);
      });
      return resolved;
    });
  }, [queryClient]);

  return { store, persist, isLoading };
}
