import { useMemo, useCallback } from 'react';
import { useImports } from './useImports';
import { useExports } from './useExports';
import { useTransfers } from './useTransfers';
import { useStockMatrix } from './useStockMatrix';
import { useProjects } from './useProjects';
import { buildWarehouseDashboardData } from '../lib/wms/warehouseDashboardData';

export function useWarehouseDashboard() {
  const importsQuery = useImports();
  const exportsQuery = useExports();
  const transfersQuery = useTransfers();
  const matrixQuery = useStockMatrix();
  const projectsQuery = useProjects({ pageSize: 200 });

  const isLoading =
    importsQuery.isLoading
    || exportsQuery.isLoading
    || transfersQuery.isLoading
    || matrixQuery.isLoading
    || projectsQuery.isLoading;

  const isError =
    importsQuery.isError
    || exportsQuery.isError
    || transfersQuery.isError
    || matrixQuery.isError
    || projectsQuery.isError;

  const data = useMemo(() => {
    if (
      !importsQuery.data
      || !exportsQuery.data
      || !transfersQuery.data
      || !matrixQuery.data
      || !projectsQuery.data
    ) {
      return null;
    }

    return buildWarehouseDashboardData(
      importsQuery.data,
      exportsQuery.data,
      transfersQuery.data,
      matrixQuery.data,
      projectsQuery.data.items,
    );
  }, [
    importsQuery.data,
    exportsQuery.data,
    transfersQuery.data,
    matrixQuery.data,
    projectsQuery.data,
  ]);

  const refetch = useCallback(() => Promise.all([
    importsQuery.refetch(),
    exportsQuery.refetch(),
    transfersQuery.refetch(),
    matrixQuery.refetch(),
    projectsQuery.refetch(),
  ]), [
    importsQuery.refetch,
    exportsQuery.refetch,
    transfersQuery.refetch,
    matrixQuery.refetch,
    projectsQuery.refetch,
  ]);

  const isRefetching =
    importsQuery.isFetching
    || exportsQuery.isFetching
    || transfersQuery.isFetching
    || matrixQuery.isFetching
    || projectsQuery.isFetching;

  return { data, isLoading, isError, refetch, isRefetching };
}
