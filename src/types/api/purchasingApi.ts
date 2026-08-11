/**
 * Purchasing API wire types — aliases of OpenAPI-generated schemas
 * (`src/types/generated/openapi.ts`). Regenerate with `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

/** OpenAPI aliases — Purchase Plans */
export type PurchasePlanKind = 'plan' | 'adhoc';
export type PurchasePlanApiDto = Schemas['PurchasePlanDto'];
export type PurchasePlanLineQuoteApiDto = Schemas['PurchasePlanLineQuoteDto'];
export type PurchasePlanLineApiDto = Schemas['PurchasePlanLineDto'];
export type PurchasePlanDetailApiDto = Schemas['PurchasePlanDetailDto'];
export type PurchasePlanPagedApiDto = Schemas['PurchasePlanPagedResponse'];
export type PurchasePlanImportColumnMapApiDto = Schemas['PurchasePlanImportColumnMapDto'];
export type PurchasePlanImportQuotePreviewApiDto = Schemas['PurchasePlanImportQuotePreviewDto'];
export type PurchasePlanImportLinePreviewApiDto = Schemas['PurchasePlanImportLinePreviewDto'];
export type PurchasePlanImportErrorApiDto = Schemas['PurchasePlanImportErrorDto'];
export type PurchasePlanImportPreviewApiDto = Schemas['PurchasePlanImportPreviewDto'];
/** BE name: ConfirmPurchasePlanImportRequest */
export type PurchasePlanImportConfirmRequest = Schemas['ConfirmPurchasePlanImportRequest'];
export type CreatePurchasePlanLineQuoteRequest = Schemas['CreatePurchasePlanLineQuoteRequest'];
export type CreatePurchasePlanLineRequest = Schemas['CreatePurchasePlanLineRequest'];
export type CreatePurchasePlanRequest = Schemas['CreatePurchasePlanRequest'];
export type UpdatePurchasePlanRequest = Schemas['UpdatePurchasePlanRequest'];
export type RejectPurchasePlanRequest = Schemas['RejectPurchasePlanRequest'];

/** OpenAPI aliases — Purchase Orders */
export type PurchaseOrderApiDto = Schemas['PurchaseOrderDto'];
export type PurchaseOrderLineApiDto = Schemas['PurchaseOrderLineDto'];
export type PurchaseOrderDetailApiDto = Schemas['PurchaseOrderDetailDto'];
export type PurchaseOrderPagedApiDto = Schemas['PurchaseOrderPagedResponse'];
export type CreatePurchaseOrderLineRequest = Schemas['CreatePurchaseOrderLineRequest'];
export type CreatePurchaseOrderRequest = Schemas['CreatePurchaseOrderRequest'];
export type UpdatePurchaseOrderRequest = Schemas['UpdatePurchaseOrderRequest'];
export type PurchaseOrderInstallmentApiDto = Schemas['PurchaseOrderInstallmentDto'];
export type PurchaseOrderInstallmentDocumentApiDto = Schemas['PurchaseOrderInstallmentDocumentDto'];
export type PurchaseOrderInstallmentRequest = Schemas['PurchaseOrderInstallmentRequest'];

/** OpenAPI aliases — Purchase Payments (also re-exported from poPaymentApi) */
export type PurchasePaymentApiDto = Schemas['PurchasePaymentDto'];
export type PurchasePaymentPagedApiDto = Schemas['PurchasePaymentPagedResponse'];
export type CreatePurchasePaymentRequest = Schemas['CreatePurchasePaymentRequest'];
export type PurchasePaymentPlanStageApiDto = Schemas['PurchasePaymentPlanStageDto'];
export type PurchasePaymentPlanRowApiDto = Schemas['PurchasePaymentPlanRowDto'];
export type PurchasePaymentPlanPagedApiDto = Schemas['PurchasePaymentPlanPagedResponse'];
export type PurchasePaymentNextStageApiDto = Schemas['PurchasePaymentNextStageDto'];

/** OpenAPI aliases — PO attachments + plan variance */
export type PurchaseOrderAttachmentApiDto = Schemas['PurchaseOrderAttachmentDto'];
export type PurchasePlanVarianceApiDto = Schemas['PurchasePlanVarianceDto'];
export type PurchasePlanVarianceLineApiDto = Schemas['PurchasePlanVarianceLineDto'];

/** OpenAPI aliases — Purchase documents (cross-PO list) */
export type PurchaseDocumentApiDto = Schemas['PurchaseDocumentDto'];
export type PurchaseDocumentPagedApiDto = Schemas['PurchaseDocumentPagedResponse'];

/** OpenAPI aliases — Purchase Contracts */
export type PurchaseContractApiDto = Schemas['PurchaseContractDto'];
export type PurchaseContractPagedApiDto = Schemas['PurchaseContractPagedResponse'];
export type CreatePurchaseContractRequest = Schemas['CreatePurchaseContractRequest'];
export type UpdatePurchaseContractRequest = Schemas['UpdatePurchaseContractRequest'];
export type ImportPurchaseContractsFromPoResult = Schemas['ImportPurchaseContractsFromPoResult'];

/** OpenAPI aliases — Purchase Warranties */
export type PurchaseWarrantyApiDto = Schemas['PurchaseWarrantyDto'];
export type PurchaseWarrantyDetailApiDto = Schemas['PurchaseWarrantyDetailDto'];
export type PurchaseWarrantyClaimApiDto = Schemas['PurchaseWarrantyClaimDto'];
export type UpdatePurchaseWarrantyRequest = Schemas['UpdatePurchaseWarrantyRequest'];
export type CreatePurchaseWarrantyClaimRequest = Schemas['CreatePurchaseWarrantyClaimRequest'];
export type ClosePurchaseWarrantyClaimRequest = Schemas['ClosePurchaseWarrantyClaimRequest'];

/** OpenAPI aliases — KHMH soft risk (NCC + vật tư) */
export type SupplierMaterialRiskPairRequest = Schemas['SupplierMaterialRiskPairRequest'];
export type SupplierMaterialRiskLookupRequest = Schemas['SupplierMaterialRiskLookupRequest'];
export type SupplierMaterialRiskApiDto = Schemas['SupplierMaterialRiskDto'];
