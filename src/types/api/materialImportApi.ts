export interface MaterialImportRowDto {
  rowNumber: number;
  materialCode: string;
  materialName: string;
  unit: string;
  danhMuc?: string | null;
  nhomVatTu?: string | null;
  loaiVatTu?: string | null;
  phanLoai?: string | null;
  kieu?: string | null;
  origin?: string | null;
  technicalSpec?: string | null;
  generalTechnicalSpec?: string | null;
  qualityStandard?: string | null;
  ceilingPrice?: number | null;
  abcClass?: string | null;
  isConsumable: boolean;
  isValid: boolean;
  isExisting: boolean;
  isNewCategory: boolean;
  errors: string[];
  warnings: string[];
}

export interface MaterialImportErrorDto {
  rowNumber: number;
  field: string;
  message: string;
}

export interface MaterialImportParseResultDto {
  totalRows: number;
  validRowCount: number;
  existingRowCount: number;
  errorRowCount: number;
  rows: MaterialImportRowDto[];
  errors: MaterialImportErrorDto[];
}

export interface MaterialImportBatchRequest {
  rows: MaterialImportRowDto[];
  overwriteExisting?: boolean;
}

export interface MaterialImportResultDto {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  totalProcessed: number;
  importedCodes: string[];
  errors: string[];
}
