/**
 * PO → NK preview/create — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

/** Wire + tồn kho trung tâm (BE DTO; live swagger may omit until API restart). */
export type PoImportLinePreviewApiDto = Schemas['PoImportLinePreviewDto'] & {
  generalAvailableQty?: number;
};
export type PoImportPreviewApiDto = Schemas['PoImportPreviewDto'];
export type CreateImportFromPoLineRequest = Schemas['CreateImportFromPoLineRequest'];
/** Wire + `issueFromGeneralWarehouse` (BE DTO; live swagger may omit until API restart). */
export type CreateImportFromPoRequest = Schemas['CreateImportFromPoRequest'] & {
  issueFromGeneralWarehouse?: boolean;
};
