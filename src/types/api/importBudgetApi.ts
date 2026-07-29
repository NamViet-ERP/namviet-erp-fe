/**
 * Import budget exceed (409 on approve) — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

export type ImportBudgetExceededApiDto = Schemas['ImportBudgetExceededDto'];
export type ApproveImportRequestApiDto = Schemas['ApproveImportRequest'];
