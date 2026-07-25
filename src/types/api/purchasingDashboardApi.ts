/** Wire types for GET /api/purchasing/dashboard/* */

export interface PurchasingKpiMetricApiDto {
  count: number;
  amount: number;
}

export interface PurchasingDashboardSummaryApiDto {
  plans: PurchasingKpiMetricApiDto;
  orders: PurchasingKpiMetricApiDto;
  imports: PurchasingKpiMetricApiDto;
  from: string;
  to: string;
  period: string;
  generatedAt: string;
}

export interface PurchasingDashboardChartBarApiDto {
  key: string;
  label: string;
  amount: number;
}

export interface PurchasingDashboardChartApiDto {
  bars: PurchasingDashboardChartBarApiDto[];
  from: string;
  to: string;
  period: string;
  generatedAt: string;
}

export interface PurchasingActivityItemApiDto {
  id: number;
  occurredAt: string;
  actorUserId: string | null;
  actorName: string;
  module: string;
  action: string;
  entityType: string | null;
  entityCode: string | null;
  message: string;
  categoryLabel: string;
}

export interface PurchasingActivityPagedApiDto {
  items: PurchasingActivityItemApiDto[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface PurchasingActivityActorApiDto {
  userId: string;
  name: string;
}

export type PurchasingDashboardPeriod =
  | 'all'
  | 'week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'custom';

export interface PurchasingDashboardQueryParams {
  period?: PurchasingDashboardPeriod | string;
  from?: string;
  to?: string;
  staffId?: string;
  cursor?: number;
  limit?: number;
}
