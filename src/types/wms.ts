/**
 * WMS master-data + stock wire types — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from './generated/openapi';

type Schemas = components['schemas'];

export type MaterialCategoryApiDto = Schemas['MaterialCategoryDto'];
export type MaterialCategoryPathApiDto = Schemas['MaterialCategoryPathDto'];
export type MaterialApiDto = Schemas['MaterialDto'] & {
  origin?: string | null;
  imageUrl?: string | null;
};
export type MaterialUnitApiDto = Schemas['MaterialUnitDto'];
export type MaterialOriginApiDto = {
  id: number;
  name: string;
  region?: string | null;
  sortOrder: number;
  isActive: boolean;
};
export type UpsertMaterialOriginRequest = {
  name: string;
  region?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type MaterialRegionApiDto = {
  id: number;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
};
export type UpsertMaterialRegionRequest = {
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type MaterialBrandApiDto = {
  id: number;
  name: string;
  country?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
};
export type UpsertMaterialBrandRequest = {
  name: string;
  country?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpsertMaterialRequest = Schemas['UpsertMaterialRequest'] & {
  origin?: string | null;
  imageUrl?: string | null;
};
export type UpsertMaterialCategoryRequest = Schemas['UpsertMaterialCategoryRequest'];
export type UpsertMaterialUnitRequest = Schemas['UpsertMaterialUnitRequest'];

export type ProjectWarehouseKeeperDto = Schemas['ProjectWarehouseKeeperDto'];
/** FE name kept for existing imports; wire schema is ProjectDto. */
export type WarehouseProjectApiDto = Schemas['ProjectDto'] & { stage?: string | null };
export type CreateWarehouseProjectRequest = Schemas['CreateProjectRequest'] & { stage?: string | null };
export type UpdateWarehouseProjectRequest = Schemas['UpdateProjectRequest'] & { stage?: string | null };
/** Wire + SL cấp công trường (BE `ProjectInventoryDto`; live swagger may omit until API restart). */
export type WarehouseProjectInventoryApiDto = Schemas['ProjectInventoryDto'] & {
  issuedFromPoQty?: number;
  issuedFromGeneralQty?: number;
};
export type WarehouseProjectLedgerEntryApiDto = Schemas['ProjectLedgerEntryDto'];

export type ProjectConstructionTaskStatus = 'planned' | 'in_progress' | 'completed' | 'late';
export type ProjectConstructionTaskApiDto = Schemas['ProjectConstructionTaskDto'] & {
  wbsCode?: string;
  level?: number;
  parentId?: string | null;
  isGroup?: boolean;
  department?: string | null;
  statusLabel?: string | null;
  statusTone?: string | null;
  notes?: string | null;
};
export type CreateProjectConstructionTaskRequest = Schemas['CreateProjectConstructionTaskRequest'] & {
  wbsCode?: string;
  level?: number;
  parentId?: string | null;
  isGroup?: boolean;
  department?: string | null;
  statusLabel?: string | null;
  statusTone?: string | null;
  notes?: string | null;
};
export type UpdateProjectConstructionTaskRequest = Schemas['UpdateProjectConstructionTaskRequest'] & {
  wbsCode?: string;
  level?: number;
  parentId?: string | null;
  isGroup?: boolean;
  department?: string | null;
  statusLabel?: string | null;
  statusTone?: string | null;
  notes?: string | null;
};

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
