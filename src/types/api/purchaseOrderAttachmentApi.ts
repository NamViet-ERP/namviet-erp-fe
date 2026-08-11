/**
 * PO document attachments — OpenAPI aliases
 * (same schemas as `purchasingApi.ts`; kept for existing import paths).
 */
export type { PurchaseOrderAttachmentApiDto } from './purchasingApi';

export type PurchaseOrderDocType =
  | 'contract'
  | 'invoice'
  | 'co'
  | 'cq'
  | 'bbgh'
  | 'bbnt'
  | 'cnxk'
  | 'tokhai'
  | 'pl'
  | 'other';
