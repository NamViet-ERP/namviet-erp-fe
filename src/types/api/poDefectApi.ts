/**
 * Defect / warranty API wire types — aliases of OpenAPI-generated schemas
 * (`src/types/generated/openapi.ts`). Regenerate with `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

/** OpenAPI aliases — preview / create from PO */
export type PoDefectEligiblePurchaseOrderApiDto = Schemas['PoDefectEligiblePurchaseOrderDto'];
export type PoDefectLinePreviewApiDto = Schemas['PoDefectLinePreviewDto'];
export type PoDefectPreviewApiDto = Schemas['PoDefectPreviewDto'];
export type CreateDefectFromPoLineRequest = Schemas['CreateDefectFromPoLineRequest'];
export type CreateDefectFromPoRequest = Schemas['CreateDefectFromPoRequest'];

/** OpenAPI aliases — preview / create from project stock */
export type StockDefectLinePreviewApiDto = Schemas['StockDefectLinePreviewDto'];
export type StockDefectPreviewApiDto = Schemas['StockDefectPreviewDto'];
export type CreateDefectFromStockLineRequest = Schemas['CreateDefectFromStockLineRequest'];
export type CreateDefectFromStockRequest = Schemas['CreateDefectFromStockRequest'];

/** OpenAPI aliases — ticket read models */
export type PurchaseDefectItemApiDto = Schemas['PurchaseDefectItemDto'];
export type PurchaseDefectAttachmentApiDto = Schemas['PurchaseDefectAttachmentDto'];
export type PurchaseDefectApiDto = Schemas['PurchaseDefectDto'];

/** OpenAPI aliases — updates */
export type UpdateDefectProcessingRequest = Schemas['UpdateDefectProcessingRequest'];
export type UpdateDefectReasonRequest = Schemas['UpdateDefectReasonRequest'];

/** Domain string unions (BE stores plain strings; not enum schemas in OpenAPI). */
export type PurchaseDefectSourceType = 'po' | 'stock';
export type PurchaseDefectCauseSource = 'supplier' | 'customer';
export type PurchaseDefectHandlingMethod = 'warranty_repair' | 'replace';
/**
 * processingPhase when status = approved:
 * approved (chưa xử lý) | processing (1–2 trường) | processed (đủ 3).
 * Otherwise BE mirrors status.
 */
export type PurchaseDefectProcessingPhase =
  | 'draft'
  | 'pending'
  | 'rejected'
  | 'approved'
  | 'processing'
  | 'processed';
