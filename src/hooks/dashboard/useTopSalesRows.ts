import { Package, Activity, Wrench, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardTopRow } from '../../types/wms/dashboard';

const ICONS: LucideIcon[] = [Wrench, Settings, Activity, Package];

function mapRows(rows: Awaited<ReturnType<typeof dashboardService.topProducts>>): DashboardTopRow[] {
  return rows.map((row) => ({
    code: row.sku,
    name: row.name,
    qty: row.qty,
  }));
}

function withIcons(rows: DashboardTopRow[]): Array<DashboardTopRow & { imageIcon: LucideIcon }> {
  return rows.map((row, index) => ({
    ...row,
    imageIcon: ICONS[index % ICONS.length],
  }));
}

export function useTopSalesRows() {
  const productsQuery = useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: () => dashboardService.topProducts(),
  });

  const materialsQuery = useQuery({
    queryKey: ['dashboard', 'top-materials'],
    queryFn: () => dashboardService.topMaterials(),
  });

  return {
    topProducts: withIcons(mapRows(productsQuery.data ?? [])),
    topMaterials: withIcons(mapRows(materialsQuery.data ?? [])),
    isLoading: productsQuery.isLoading || materialsQuery.isLoading,
    isError: productsQuery.isError || materialsQuery.isError,
  };
}
