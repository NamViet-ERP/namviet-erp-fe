/**
 * WMS master-data + stock wire types — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from './generated/openapi';

type Schemas = components['schemas'];

export type MaterialCategoryApiDto = Schemas['MaterialCategoryDto'];
export type MaterialCategoryPathApiDto = Schemas['MaterialCategoryPathDto'];
export type MaterialApiDto = Schemas['MaterialDto'];
export type MaterialUnitApiDto = Schemas['MaterialUnitDto'];
export type UpsertMaterialRequest = Schemas['UpsertMaterialRequest'];
export type UpsertMaterialCategoryRequest = Schemas['UpsertMaterialCategoryRequest'];
export type UpsertMaterialUnitRequest = Schemas['UpsertMaterialUnitRequest'];

export type ProjectWarehouseKeeperDto = Schemas['ProjectWarehouseKeeperDto'];
/** FE name kept for existing imports; wire schema is ProjectDto. */
export type WarehouseProjectApiDto = Schemas['ProjectDto'];
export type CreateWarehouseProjectRequest = Schemas['CreateProjectRequest'];
export type UpdateWarehouseProjectRequest = Schemas['UpdateProjectRequest'];
export type WarehouseProjectInventoryApiDto = Schemas['ProjectInventoryDto'];
export type WarehouseProjectLedgerEntryApiDto = Schemas['ProjectLedgerEntryDto'];

export type StockMatrixProjectColumnApiDto = Schemas['StockMatrixProjectColumnDto'];
export type StockMatrixRowApiDto = Schemas['StockMatrixRowDto'];

export type SupplierApiDto = Schemas['SupplierDto'];
export type SupplierLatestEvaluationApiDto = Schemas['SupplierLatestEvaluationDto'];
export type UpsertSupplierRequest = Schemas['UpsertSupplierRequest'];
export type SupplierNextCodeApiDto = Schemas['SupplierNextCodeDto'];

export type ProjectLedgerKind = 'import' | 'export' | 'transfer';

/** Shared list envelope (matches SharedKernel PagedResult&lt;T&gt; JSON). */
export interface PagedApiResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}
