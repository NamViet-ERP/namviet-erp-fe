import type {
  DashboardActivityApiDto,
  DashboardCategoryApiDto,
  DashboardKpiApiDto,
  DashboardTrendApiDto,
} from '../../types/api/wms/dashboardApi';
import type { WarehouseDashboardData } from './warehouseDashboardData';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

const ACTIVITY_ACCENT: Record<string, string> = {
  Import: 'var(--status-success)',
  Export: 'var(--status-error)',
  Transfer: 'var(--status-warning)',
};

function trendMonthLabel(beMonth: string): string {
  const [mm] = beMonth.split('/');
  const n = Number(mm);
  return Number.isFinite(n) && n >= 1 && n <= 12 ? `T${n}` : beMonth;
}

export function mapWarehouseDashboardFromApi(
  kpi: DashboardKpiApiDto,
  trend: DashboardTrendApiDto[],
  activity: DashboardActivityApiDto[],
  categories: DashboardCategoryApiDto[],
  projects: DashboardCategoryApiDto[],
): WarehouseDashboardData {
  const trendData = trend.map((row) => ({
    month: trendMonthLabel(row.month),
    imports: Number(row.importValue),
    exports: Number(row.exportValue),
  }));

  const stockByCategory = categories.map((row, index) => ({
    name: row.category,
    value: Number(row.value),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const materialSkuCount = categories.reduce((sum, row) => sum + Number(row.value), 0);

  const recentActivity = activity.map((row) => ({
    type: row.type.toLowerCase(),
    label: row.description || `${row.type} #${row.code}`,
    value: row.code,
    time: row.time,
    accent: ACTIVITY_ACCENT[row.type] ?? 'var(--chart-5)',
  }));

  const stockByWarehouse = projects.map((row, index) => ({
    name: row.category,
    value: Number(row.value),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return {
    totalStock: kpi.totalStock,
    totalValue: Number(kpi.totalValue),
    activeProjects: kpi.activeWarehouses,
    trendData,
    stockByCategory,
    stockByWarehouse,
    recentActivity,
    miniStats: [
      {
        label: 'Nhập hôm nay',
        value: `${kpi.todayImports} phiếu`,
        color: 'var(--status-success)',
      },
      {
        label: 'Xuất hôm nay',
        value: `${kpi.todayExports} phiếu`,
        color: 'var(--status-warning)',
      },
      {
        label: 'Chờ duyệt',
        value: `${kpi.pendingApprovals} phiếu`,
        color: 'var(--status-error)',
      },
      {
        label: 'Mã vật tư',
        value: `${materialSkuCount} mặt hàng`,
        color: 'var(--chart-5)',
      },
    ],
  };
}
