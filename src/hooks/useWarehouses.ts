import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesService, type CreateWarehouseDto, type UpdateWarehouseDto } from '../services/warehousesService';
import { queryKeys } from '../services/queryKeys';

export function useWarehouses() {
  return useQuery({ queryKey: queryKeys.warehouses.all, queryFn: () => warehousesService.list() });
}

export function useWarehouse(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.warehouses.detail(id ?? ''),
    queryFn: () => warehousesService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWarehouseDto) => warehousesService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.warehouses.all }),
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWarehouseDto }) => warehousesService.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.warehouses.all }),
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => warehousesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.warehouses.all }),
  });
}
