/**
 * Arrival plans — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

export type ArrivalPlanLineApiDto = Schemas['ArrivalPlanLineDto'];
export type ArrivalPlanProjectApiDto = Schemas['ArrivalPlanProjectDto'];
export type ArrivalPlanListApiDto = Schemas['ArrivalPlanListResponse'];

export type ArrivalPlanLineStatus = 'upcoming' | 'due_today' | 'overdue';

export interface ArrivalPlansListParams {
  projectCode?: string;
  lineStatus?: ArrivalPlanLineStatus;
  overdueLookbackDays?: number;
}
