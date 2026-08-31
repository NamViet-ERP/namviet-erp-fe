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
/** Wire + SL cấp công trường (BE `ProjectInventoryDto`; live swagger may omit until API restart). */
export type WarehouseProjectInventoryApiDto = Schemas['ProjectInventoryDto'] & {
  issuedFromPoQty?: number;
  issuedFromGeneralQty?: number;
};
export type WarehouseProjectLedgerEntryApiDto = Schemas['ProjectLedgerEntryDto'];

export type ProjectConstructionTaskStatus = 'planned' | 'in_progress' | 'completed' | 'late';
export type ProjectConstructionTaskApiDto = Schemas['ProjectConstructionTaskDto'];
export type CreateProjectConstructionTaskRequest = Schemas['CreateProjectConstructionTaskRequest'];
export type UpdateProjectConstructionTaskRequest = Schemas['UpdateProjectConstructionTaskRequest'];

export type ProjectPurchasingProgressLineApiDto = Schemas['ProjectPurchasingProgressLineDto'];
export type ProjectPurchasingProgressReceiptLineApiDto = Schemas['ProjectPurchasingProgressReceiptLineDto'];
export type ProjectPurchasingProgressReceiptApiDto = Schemas['ProjectPurchasingProgressReceiptDto'];
export type ProjectPurchasingProgressOrderApiDto = Schemas['ProjectPurchasingProgressOrderDto'];
export type ProjectPurchasingProgressPlanApiDto = Schemas['ProjectPurchasingProgressPlanDto'];
export type ProjectPurchasingProgressApiDto = Schemas['ProjectPurchasingProgressDto'];

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
