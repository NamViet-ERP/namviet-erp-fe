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
}

export interface StockMatrixProjectColumnApiDto {
  projectCode: string;
  projectId: string;
  projectName: string;
  actualQty: number;
  plannedQty: number;
  reservedQty: number;
}

export interface StockMatrixRowApiDto {
  materialCode: string;
  materialName: string;
  unit: string;
  isActive: boolean;
  generalActualQty: number;
  generalReservedQty: number;
  generalAvailableQty: number;
  projects: StockMatrixProjectColumnApiDto[];
}

export interface PagedApiResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
