import { apiClient, saveBlob } from '../lib/apiClient';
import type {
  PagedApiResult,
  SupplierApiDto,
  SupplierImportPreviewResponseDto,
  SupplierImportResultDto,
  SupplierNextCodeApiDto,
  UpsertSupplierRequest,
} from '../types/wms';

export type { SupplierApiDto } from '../types/wms';
/** @deprecated Prefer UpsertSupplierRequest from types/wms */
export type UpsertSupplierBody = UpsertSupplierRequest;

export interface SubmitTierEvaluationRequest {
  priceScore: number;
  profileScore: number;
  paymentScore: number;
  serviceScore: number;
  targetGrade?: string;
  reason?: string;
  detailsJson?: string;
}

export interface SupplierTierEvaluationDto {
  id: number;
  supplierId: number;
  oldGrade?: string | null;
  newGrade: string;
  totalScore: number;
  priceScore: number;
  profileScore: number;
  paymentScore: number;
  serviceScore: number;
  evaluationDetailsJson?: string | null;
  reason?: string | null;
  evaluatedById?: string | null;
  evaluatedByName?: string | null;
  createdAt: string;
}

export interface SourcingKpiSummaryDto {
  totalSuppliers: number;
  totalNewThisMonth: number;
  totalPromotedThisMonth: number;
  gradeACount: number;
  gradeBCount: number;
  gradeCCount: number;
  gradeDCount: number;
  otherGradeCount: number;
  promotionRatePercent: number;
}

const ENDPOINT = '/api/warehouse/suppliers';

export function findSupplierByName(suppliers: SupplierApiDto[], name: string) {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return suppliers.find(
    (s) => s.supplierName.localeCompare(trimmed, 'vi', { sensitivity: 'accent' }) === 0,
  );
}

export interface SupplierListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  rating?: string;
  groupId?: number;
  isBlacklisted?: boolean;
  approvalStatus?: string;
}

export const suppliersService = {
  async list(params: SupplierListParams = {}) {
    const { page = 1, pageSize = 20, search, rating, groupId, isBlacklisted, approvalStatus } = params;
    return apiClient.get<PagedApiResult<SupplierApiDto>>(ENDPOINT, {
      page,
      pageSize,
      search: search || undefined,
      rating: rating || undefined,
      groupId: groupId ?? undefined,
      isBlacklisted: isBlacklisted ?? undefined,
      approvalStatus: approvalStatus || undefined,
    });
  },

  nextCode() {
    return apiClient.get<SupplierNextCodeApiDto>(`${ENDPOINT}/next-code`);
  },

  create(body: UpsertSupplierRequest) {
    return apiClient.post<SupplierApiDto>(ENDPOINT, {
      supplierName: body.supplierName,
      contactPhone: body.contactPhone ?? null,
      maxDebtDays: body.maxDebtDays ?? 30,
      paymentTerms: body.paymentTerms ?? null,
      creditLimit: body.creditLimit ?? null,
      taxCode: body.taxCode ?? null,
      supplierType: body.supplierType ?? null,
      scope: body.scope ?? null,
      website: body.website ?? null,
    });
  },

  async update(id: number, body: UpsertSupplierRequest) {
    await apiClient.put(`${ENDPOINT}/${id}`, {
      supplierCode: body.supplierCode,
      supplierName: body.supplierName,
      contactPhone: body.contactPhone ?? null,
      maxDebtDays: body.maxDebtDays ?? 30,
      paymentTerms: body.paymentTerms ?? null,
      creditLimit: body.creditLimit ?? null,
      taxCode: body.taxCode ?? null,
      supplierType: body.supplierType ?? null,
      scope: body.scope ?? null,
      website: body.website ?? null,
    });
    return apiClient.get<SupplierApiDto>(`${ENDPOINT}/${id}`);
  },

  async downloadTemplate() {
    const blob = await apiClient.getBlob(`${ENDPOINT}/template-excel`);
    return saveBlob(blob, 'Mau_Nhap_NhaCungCap.xlsx');
  },

  async previewImportExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<SupplierImportPreviewResponseDto>(
      `${ENDPOINT}/preview-excel`,
      formData,
    );
  },

  async importExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<SupplierImportResultDto>(
      `${ENDPOINT}/import-excel`,
      formData,
    );
  },

  async remove(id: number) {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },

  async approve(id: number) {
    return apiClient.post<SupplierApiDto>(`${ENDPOINT}/${id}/approve`);
  },

  async reject(id: number) {
    return apiClient.post<SupplierApiDto>(`${ENDPOINT}/${id}/reject`);
  },

  async submitTierEvaluation(id: number, body: SubmitTierEvaluationRequest) {
    return apiClient.post<SupplierTierEvaluationDto>(`${ENDPOINT}/${id}/tier-evaluation`, body);
  },

  async getGradeHistory(id: number) {
    return apiClient.get<SupplierTierEvaluationDto[]>(`${ENDPOINT}/${id}/grade-history`);
  },

  async getSourcingKpi() {
    return apiClient.get<SourcingKpiSummaryDto>(`${ENDPOINT}/sourcing-kpi`);
  },
};
