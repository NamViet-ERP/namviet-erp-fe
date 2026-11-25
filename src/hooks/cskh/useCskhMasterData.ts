import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../services/queryKeys';
import { cskhService } from '../../services/cskhService';
import {
  EMPTY_MASTER_STORE,
  normalizeMasterStore,
  type CskhMasterStore,
} from '../../lib/cskh/masterData';

export function useCskhMasterData() {
  const queryClient = useQueryClient();

  const { data: dbStore, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.cskh.masterData,
    queryFn: () => cskhService.getMasterData<Partial<CskhMasterStore>>(),
  });

  const store = useMemo(
    () => normalizeMasterStore(dbStore ?? EMPTY_MASTER_STORE),
    [dbStore],
  );

  const mutation = useMutation({
    mutationFn: async (nextStore: CskhMasterStore) => {
      await cskhService.saveMasterData(nextStore);
      return nextStore;
    },
    onSuccess: nextStore => {
      queryClient.setQueryData(queryKeys.cskh.masterData, nextStore);
      void queryClient.invalidateQueries({ queryKey: queryKeys.cskh.masterData });
    },
  });

  const persist = useCallback(
    async (
      next: CskhMasterStore | ((prev: CskhMasterStore) => CskhMasterStore),
    ): Promise<void> => {
      const current = normalizeMasterStore(
        queryClient.getQueryData<Partial<CskhMasterStore>>(queryKeys.cskh.masterData) ??
          dbStore ??
          EMPTY_MASTER_STORE,
      );
      const resolved = typeof next === 'function' ? next(current) : next;
      await mutation.mutateAsync(resolved);
    },
    [dbStore, mutation, queryClient],
  );

  return {
    store,
    persist,
    isLoading,
    isError,
    error,
    isSaving: mutation.isPending,
  };
}
