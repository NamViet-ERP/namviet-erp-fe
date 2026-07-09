export interface ImportParsedLineApiDto {
  rowNumber: number;
  materialCode: string;
  materialName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  isValid: boolean;
}

export interface ImportParseErrorApiDto {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportParseResultApiDto {
  totalRows: number;
  validRowCount: number;
  errorRowCount: number;
  lines: ImportParsedLineApiDto[];
  errors: ImportParseErrorApiDto[];
}
