import { apiClient, saveBlob } from '../lib/apiClient';
import type {
  CreateServiceExpenseItemRequest,
  ServiceExpenseImportBatchRequest,
  ServiceExpenseImportErrorDto,
  ServiceExpenseImportParseResultDto,
  ServiceExpenseImportResultDto,
  ServiceExpenseImportRowDto,
  ServiceExpenseItemApiDto,
  ServiceExpenseItemPagedResponse,
  ServiceExpenseItemQueryParams,
  UpdateServiceExpenseItemRequest,
} from '../types/api/serviceExpenseItem';

const ENDPOINT = '/api/purchasing/service-items';

interface RawServiceExpenseImportRow {
  rowNumber?: unknown;
  code?: unknown;
  name?: unknown;
  type?: unknown;
  unit?: unknown;
  referencePrice?: unknown;
  description?: unknown;
  isValid?: unknown;
  isExisting?: unknown;
  errorMessage?: unknown;
  errors?: unknown;
  warnings?: unknown;
}

interface RawServiceExpenseParseResponse {
  totalRows?: number;
  validRowCount?: number;
  validRows?: number;
  existingRowCount?: number;
  existingRows?: number;
  errorRowCount?: number;
  errorRows?: number;
  rows?: RawServiceExpenseImportRow[];
  errors?: unknown[];
}

function normalizeParseImportErrors(rawErrors: unknown): ServiceExpenseImportErrorDto[] {
  if (!Array.isArray(rawErrors)) return [];
  const normalized: ServiceExpenseImportErrorDto[] = [];
  for (const entry of rawErrors) {
    if (typeof entry === 'string') {
      const msg = entry.trim();
      if (msg) normalized.push({ rowNumber: 0, field: '', message: msg });
      continue;
    }
    if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      const rawMsg = obj.message;
      const message =
        typeof rawMsg === 'string'
          ? rawMsg.trim()
          : rawMsg != null
            ? String(rawMsg).trim()
            : '';
      if (!message) continue;
      const rowNum = Number(obj.rowNumber);
      normalized.push({
        rowNumber: Number.isFinite(rowNum) ? rowNum : 0,
        field:
          typeof obj.field === 'string'
            ? obj.field
            : obj.field != null
              ? String(obj.field)
              : '',
        message,
      });
    }
  }
  return normalized;
}

interface RawServiceExpenseImportResponse {
  createdCount?: number;
  insertedCount?: number;
  updatedCount?: number;
  skippedCount?: number;
  totalProcessed?: number;
  importedCodes?: string[];
  errors?: string[];
}

export const serviceExpenseItemsService = {
  async list(params: ServiceExpenseItemQueryParams = {}): Promise<ServiceExpenseItemPagedResponse> {
    return apiClient.get<ServiceExpenseItemPagedResponse>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search?.trim() || undefined,
      type: params.type || undefined,
      isActive: params.isActive,
      all: params.all,
    });
  },

  async getById(id: number): Promise<ServiceExpenseItemApiDto> {
    return apiClient.get<ServiceExpenseItemApiDto>(`${ENDPOINT}/${id}`);
  },

  async create(data: CreateServiceExpenseItemRequest): Promise<ServiceExpenseItemApiDto> {
    return apiClient.post<ServiceExpenseItemApiDto>(ENDPOINT, data);
  },

  async update(id: number, data: UpdateServiceExpenseItemRequest): Promise<ServiceExpenseItemApiDto> {
    return apiClient.put<ServiceExpenseItemApiDto>(`${ENDPOINT}/${id}`, data);
  },

  async toggleActive(id: number): Promise<ServiceExpenseItemApiDto> {
    return apiClient.patch<ServiceExpenseItemApiDto>(`${ENDPOINT}/${id}/toggle-active`);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },

  async downloadImportTemplate(): Promise<boolean> {
    const blob = await apiClient.getBlob(`${ENDPOINT}/import-template`);
    return await saveBlob(blob, 'mau-import-dich-vu-chi-phi.xlsx');
  },

  async parseImportFile(file: File): Promise<ServiceExpenseImportParseResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    const raw = await apiClient.postForm<RawServiceExpenseParseResponse>(`${ENDPOINT}/parse-import-file`, formData);

    const validRowCount = raw.validRowCount ?? raw.validRows ?? 0;
    const existingRowCount = raw.existingRowCount ?? raw.existingRows ?? 0;
    const errorRowCount = raw.errorRowCount ?? raw.errorRows ?? 0;
    const totalRows = raw.totalRows ?? (validRowCount + errorRowCount);

    const rows: ServiceExpenseImportRowDto[] = (raw.rows ?? []).map((r: RawServiceExpenseImportRow) => {
      let errors: string[] = [];
      if (Array.isArray(r.errors)) {
        errors = r.errors.filter(Boolean).map(String);
      } else if (r.errorMessage && typeof r.errorMessage === 'string' && r.errorMessage.trim()) {
        errors = [r.errorMessage.trim()];
      }

      const warnings: string[] = Array.isArray(r.warnings)
        ? r.warnings.filter(Boolean).map(String)
        : [];

      return {
        rowNumber: Number(r.rowNumber) || 0,
        code: String(r.code ?? ''),
        name: String(r.name ?? ''),
        type: r.type === 'expense' ? 'expense' : 'service',
        unit: String(r.unit ?? ''),
        referencePrice: r.referencePrice != null && !isNaN(Number(r.referencePrice)) ? Number(r.referencePrice) : null,
        description: r.description != null ? String(r.description) : null,
        isValid: typeof r.isValid === 'boolean' ? r.isValid : errors.length === 0,
        isExisting: Boolean(r.isExisting),
        errorMessage: typeof r.errorMessage === 'string' ? r.errorMessage : (errors.length > 0 ? errors[0] : null),
        errors,
        warnings,
      };
    });

    return {
      totalRows,
      validRowCount,
      existingRowCount,
      errorRowCount,
      validRows: validRowCount,
      existingRows: existingRowCount,
      errorRows: errorRowCount,
      rows,
      errors: normalizeParseImportErrors(raw.errors),
    };
  },

  async importBatch(request: ServiceExpenseImportBatchRequest): Promise<ServiceExpenseImportResultDto> {
    const raw = await apiClient.post<RawServiceExpenseImportResponse>(`${ENDPOINT}/import-batch`, request);
    const createdCount = raw.createdCount ?? raw.insertedCount ?? 0;
    const updatedCount = raw.updatedCount ?? 0;
    const skippedCount = raw.skippedCount ?? 0;
    const totalProcessed = raw.totalProcessed ?? (createdCount + updatedCount + skippedCount);
    const errors: string[] = Array.isArray(raw.errors) ? raw.errors : [];
    const importedCodes: string[] = Array.isArray(raw.importedCodes) ? raw.importedCodes : [];

    return {
      createdCount,
      insertedCount: createdCount,
      updatedCount,
      skippedCount,
      totalProcessed,
      importedCodes,
      errors,
    };
  },
};
