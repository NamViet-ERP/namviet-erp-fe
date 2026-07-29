/**
 * PO → NK preview/create — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

export type PoImportLinePreviewApiDto = Schemas['PoImportLinePreviewDto'];
export type PoImportPreviewApiDto = Schemas['PoImportPreviewDto'];
export type CreateImportFromPoLineRequest = Schemas['CreateImportFromPoLineRequest'];
export type CreateImportFromPoRequest = Schemas['CreateImportFromPoRequest'];
