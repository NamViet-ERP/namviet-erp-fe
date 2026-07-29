/**
 * WMS voucher wire types — OpenAPI aliases (imports / exports / transfers / stocktake / warehouses).
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from '../../generated/openapi';

type Schemas = components['schemas'];

export type ImportApiDto = Schemas['ImportDto'];
export type ImportItemApiDto = Schemas['ImportItemDto'];
export type ImportAttachmentApiDto = Schemas['ImportAttachmentDto'];
export type CreateImportApiDto = Schemas['CreateImportDto'];

export type ExportApiDto = Schemas['ExportDto'];
export type ExportItemApiDto = Schemas['ExportItemDto'];
export type CreateExportApiDto = Schemas['CreateExportDto'];

export type TransferApiDto = Schemas['TransferDto'];
export type TransferItemApiDto = Schemas['TransferItemDto'];
export type CreateTransferApiDto = Schemas['CreateTransferDto'];

export type StocktakeApiDto = Schemas['StocktakeDto'];
export type StocktakeItemApiDto = Schemas['StocktakeItemDto'];
export type CreateStocktakeApiDto = Schemas['CreateStocktakeDto'];

export type WarehouseApiDto = Schemas['WarehouseDto'];
export type CreateWarehouseApiDto = Schemas['CreateWarehouseDto'];
export type UpdateWarehouseApiDto = Schemas['UpdateWarehouseDto'];
