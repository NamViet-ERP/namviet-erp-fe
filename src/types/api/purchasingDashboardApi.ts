/**
 * Purchasing dashboard wire types — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

export type PurchasingKpiMetricApiDto = Schemas['PurchasingKpiMetricDto'];
export type PurchasingDashboardSummaryApiDto = Schemas['PurchasingDashboardSummaryDto'];
export type PurchasingDashboardChartBarApiDto = Schemas['PurchasingDashboardChartBarDto'];
export type PurchasingDashboardChartApiDto = Schemas['PurchasingDashboardChartDto'];
export type PurchasingActivityItemApiDto = Schemas['PurchasingActivityItemDto'];
export type PurchasingActivityPagedApiDto = Schemas['PurchasingActivityPagedResponse'];
export type PurchasingActivityActorApiDto = Schemas['PurchasingActivityActorDto'];

/** FE query helpers (not OpenAPI request bodies). */
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
