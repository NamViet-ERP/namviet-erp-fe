/** WMS API wire types — mirror BE DTOs (camelCase JSON). */

export interface MaterialCategoryApiDto {
  id: number;
  code: string;
  name: string;
  level: number;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MaterialCategoryPathApiDto {
  danhMuc: string | null;
  nhomVatTu: string | null;
  loaiVatTu: string | null;
  phanLoai: string | null;
  kieu: string | null;
}

export interface MaterialApiDto {
  materialCode: string;
  materialName: string;
  categoryId: number;
  categoryName: string | null;
  categoryPath: MaterialCategoryPathApiDto;
  unit: string;
  technicalSpec: string | null;
  qualityStandard: string | null;
  isConsumable: boolean;
  isActive: boolean;
}

export interface WarehouseProjectApiDto {
  projectCode: string;
  projectName: string;
  projectType: string;
  pmId: string;
  pmName: string;
  startDate: string;
  endDate: string | null;
  materialBudget: number;
  status: string;
  stockActualQty?: number;
  stockPlannedQty?: number;
  stockReservedQty?: number;
  stockMaterialCount?: number;
  approvedImportValue?: number;
  materialBudgetRemaining?: number;
}

export interface CreateWarehouseProjectRequest {
  projectCode: string;
  projectName: string;
  projectType: 'Project' | 'GeneralWarehouse';
  pmId: string;
  pmName: string;
  startDate: string;
  endDate?: string | null;
  materialBudget?: number;
}

export interface UpdateWarehouseProjectRequest {
  projectName: string;
  pmId: string;
  pmName: string;
  endDate?: string | null;
  materialBudget: number;
  status: string;
}

export interface WarehouseProjectInventoryApiDto {
  projectCode: string;
  materialCode: string;
  materialName: string;
  unit: string;
  plannedImportQty: number;
  plannedExportQty: number;
  actualImportQty: number;
  actualExportQty: number;
  actualInventoryQty: number;
  plannedInventoryQty: number;
  reservedQty: number;
  minStockQty: number;
}

export type ProjectLedgerKind = 'import' | 'export' | 'transfer';

export interface WarehouseProjectLedgerEntryApiDto {
  id: string;
  kind: ProjectLedgerKind;
  voucherCode: string;
  date: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  itemQty: number;
  totalValue: number | null;
}

export interface StockMatrixProjectColumnApiDto {
  projectCode: string;
  projectId: string;
  projectName: string;
  actualQty: number;
  plannedImportQty: number;
  plannedExportQty: number;
}

export interface StockMatrixRowApiDto {
  materialCode: string;
  materialName: string;
  unit: string;
  isActive: boolean;
  generalActualQty: number;
  generalReservedQty: number;
  generalAvailableQty: number;
  /** WAC — weighted average unit cost from approved imports (IAS 2). */
  weightedAverageUnitCost: number;
  projects: StockMatrixProjectColumnApiDto[];
}

export interface PagedApiResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MaterialUnitApiDto {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}
