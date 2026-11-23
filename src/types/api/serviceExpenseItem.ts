export type ServiceExpenseType = 'service' | 'expense';

export interface ServiceExpenseItemApiDto {
  id: number;
  code: string;
  name: string;
  type: ServiceExpenseType;
  unit: string;
  referencePrice: number | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceExpenseItemPagedResponse {
  items: ServiceExpenseItemApiDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateServiceExpenseItemRequest {
  code: string;
  name: string;
  type: ServiceExpenseType;
  unit: string;
  referencePrice?: number | null;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateServiceExpenseItemRequest {
  code: string;
  name: string;
  type: ServiceExpenseType;
  unit: string;
  referencePrice?: number | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ServiceExpenseItemQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: ServiceExpenseType | '';
  isActive?: boolean;
  all?: boolean;
}

export interface ServiceExpenseImportRowDto {
  rowNumber: number;
  code: string;
  name: string;
  type: ServiceExpenseType;
  unit: string;
  referencePrice?: number | null;
  description?: string | null;
  isValid: boolean;
  isExisting: boolean;
  errorMessage?: string | null;
  errors: string[];
  warnings: string[];
}

export interface ServiceExpenseImportErrorDto {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ServiceExpenseImportParseResultDto {
  totalRows: number;
  validRowCount: number;
  existingRowCount: number;
  errorRowCount: number;
  validRows?: number;
  existingRows?: number;
  errorRows?: number;
  rows: ServiceExpenseImportRowDto[];
  errors: ServiceExpenseImportErrorDto[];
}

export interface ServiceExpenseImportBatchRequest {
  rows: ServiceExpenseImportRowDto[];
  overwriteExisting?: boolean;
}

export interface ServiceExpenseImportResultDto {
  createdCount: number;
  insertedCount?: number;
  updatedCount: number;
  skippedCount: number;
  totalProcessed: number;
  importedCodes: string[];
  errors: string[];
}
