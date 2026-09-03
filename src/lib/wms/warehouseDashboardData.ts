export interface TrendDataPoint {
  month: string;
  imports: number;
  exports: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface DashboardActivityItem {
  type: string;
  label: string;
  value: string;
  time: string;
  accent: string;
}

export interface DashboardMiniStat {
  label: string;
  value: string;
  color: string;
}

export interface WarehouseDashboardData {
  totalStock: number;
  totalValue: number;
  activeProjects: number;
  trendData: TrendDataPoint[];
  stockByCategory: CategoryDataPoint[];
  stockByWarehouse: CategoryDataPoint[];
  recentActivity: DashboardActivityItem[];
  miniStats: DashboardMiniStat[];
}

function last6MonthLabels(): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`T${d.getMonth() + 1}`);
  }
  return result;
}

/** Shell data when API fails — keeps dashboard sections renderable. */
export function emptyWarehouseDashboardData(): WarehouseDashboardData {
  return {
    totalStock: 0,
    totalValue: 0,
    activeProjects: 0,
    trendData: last6MonthLabels().map((month) => ({ month, imports: 0, exports: 0 })),
    stockByCategory: [],
    stockByWarehouse: [],
    recentActivity: [],
    miniStats: [
      { label: 'Chờ duyệt', value: '-', color: 'var(--md-error)' },
      { label: 'Nhập hôm nay', value: '-', color: 'var(--md-success)' },
      { label: 'Xuất hôm nay', value: '-', color: 'var(--nv-amber)' },
    ],
  };
}
