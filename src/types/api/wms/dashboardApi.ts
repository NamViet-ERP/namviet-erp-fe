/** Wire types for GET /api/dashboard/* (camelCase JSON). */

export interface DashboardKpiApiDto {
  totalStock: number;
  totalValue: number;
  activeWarehouses: number;
  todayImports: number;
  todayExports: number;
  pendingApprovals: number;
}

export interface DashboardTrendApiDto {
  month: string;
  importValue: number;
  exportValue: number;
}

export interface DashboardCategoryApiDto {
  category: string;
  value: number;
}

export interface DashboardActivityApiDto {
  type: string;
  code: string;
  description: string;
  time: string;
}

export interface BirthdayApiDto {
  name: string;
  department: string;
  day: number;
}

export interface TopProductApiDto {
  sku: string;
  name: string;
  qty: number;
  value: number;
}
