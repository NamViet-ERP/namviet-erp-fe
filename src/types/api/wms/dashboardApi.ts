/**
 * WMS home dashboard — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from '../../generated/openapi';

type Schemas = components['schemas'];

export type DashboardKpiApiDto = Schemas['DashboardKpiDto'];
export type DashboardTrendApiDto = Schemas['DashboardTrendDto'];
export type DashboardCategoryApiDto = Schemas['DashboardCategoryDto'];
export type DashboardActivityApiDto = Schemas['DashboardActivityDto'];
export type BirthdayApiDto = Schemas['BirthdayDto'];
export type TopProductApiDto = Schemas['TopProductDto'];
