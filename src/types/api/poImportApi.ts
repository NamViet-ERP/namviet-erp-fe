/** Preview / create NK từ PO — khớp BE PoImportDtos. */

export interface PoImportLinePreviewApiDto {
  poItemId: number;
  name: string;
  materialCode?: string | null;
  unit: string;
  ordered: number;
  received: number;
  reservedPending: number;
  available: number;
  unitPrice: number;
}

export interface PoImportPreviewApiDto {
  poCode: string;
  planCode: string;
  projectCode: string;
  supplierName: string;
  lines: PoImportLinePreviewApiDto[];
}

export interface CreateImportFromPoLineRequest {
  poItemId: number;
  qty: number;
}

export interface CreateImportFromPoRequest {
  items?: CreateImportFromPoLineRequest[] | null;
}
