import { apiClient } from '../lib/apiClient';
import type { PagedApiResult } from '../types/wms';

export interface PriceBookApiDto {
  id: number;
  materialCode: string;
  materialName: string;
  supplierId: number;
  supplierName: string;
  unitPrice: number;
  purchaseUrl: string | null;
  catalogUrl: string | null;
  priceDate: string;
}

export interface PriceBookLookupApiDto {
  unitPrice: number;
  purchaseUrl: string | null;
  catalogUrl: string | null;
  priceDate: string | null;
}

export interface UpsertPriceBookBody {
  materialCode: string;
  supplierId: number;
  unitPrice: number;
  purchaseUrl?: string | null;
  catalogUrl?: string | null;
}

export interface PriceBookListParams {
  page?: number;
  pageSize?: number;
  materialCode?: string;
  supplierId?: number;
  search?: string;
}

const ENDPOINT = '/api/warehouse/price-books';

export const priceBooksService = {
  async list(params: PriceBookListParams = {}) {
    const { page = 1, pageSize = 20, materialCode, supplierId, search } = params;
    return apiClient.get<PagedApiResult<PriceBookApiDto>>(ENDPOINT, {
      page,
      pageSize,
      materialCode: materialCode || undefined,
      supplierId: supplierId ?? undefined,
      search: search || undefined,
    });
  },

  async lookup(materialCode: string, supplierId: number) {
    return apiClient.get<PriceBookLookupApiDto>(`${ENDPOINT}/lookup`, {
      materialCode,
      supplierId,
    });
  },

  async create(body: UpsertPriceBookBody) {
    return apiClient.post<PriceBookApiDto>(ENDPOINT, {
      materialCode: body.materialCode,
      supplierId: body.supplierId,
      unitPrice: body.unitPrice,
      purchaseUrl: body.purchaseUrl ?? null,
      catalogUrl: body.catalogUrl ?? null,
    });
  },

  async update(id: number, body: UpsertPriceBookBody) {
    await apiClient.put(`${ENDPOINT}/${id}`, {
      materialCode: body.materialCode,
      supplierId: body.supplierId,
      unitPrice: body.unitPrice,
      purchaseUrl: body.purchaseUrl ?? null,
      catalogUrl: body.catalogUrl ?? null,
    });
  },

  async remove(id: number) {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
