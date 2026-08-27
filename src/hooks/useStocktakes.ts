import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stocktakesService, type CreateStocktakeDto, type UpdateStocktakeDto } from '../services/stocktakesService';
import { queryKeys } from '../services/queryKeys';

export function useStocktakes() {
  return useQuery({ queryKey: queryKeys.stocktakes.all, queryFn: () => stocktakesService.list() });
}

export function useCreateStocktake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStocktakeDto) => stocktakesService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.stocktakes.all }),
  });
}

export function useUpdateStocktake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateStocktakeDto }) => stocktakesService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.stocktakes.all }),
  });
}

export function useApproveStocktake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stocktakesService.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.stocktakes.all });
      qc.invalidateQueries({ queryKey: queryKeys.stock.matrix });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
