/**
 * KHMH variance alerts — OpenAPI aliases
 * (same schemas as `purchasingApi.ts`; kept for existing import paths).
 */
export type {
  PurchasePlanVarianceApiDto,
  PurchasePlanVarianceLineApiDto,
} from './purchasingApi';

export type PurchasePlanVarianceStatus = 'on_track' | 'under_ordered' | 'over_received' | 'delayed';
