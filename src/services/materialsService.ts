import { apiClient } from '../lib/apiClient';
import type { MaterialApiDto, PagedApiResult, UpsertMaterialRequest } from '../types/wms';

const ENDPOINT = '/api/warehouse/materials';

export interface MaterialListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  danhMuc?: string;
  nhomVatTu?: string;
  loaiVatTu?: string;
  phanLoai?: string;
  kieu?: string;
  categoryId?: number;
  includeInactive?: boolean;
}

export type { UpsertMaterialRequest };

const emptyPath = () => ({
  danhMuc: null,
  nhomVatTu: null,
  loaiVatTu: null,
  phanLoai: null,
  kieu: null,
});

function normalizeMaterial(dto: MaterialApiDto): MaterialApiDto {
  return {
    ...dto,
    categoryPath: dto.categoryPath ?? emptyPath(),
    isActive: dto.isActive ?? true,
  };
}

export const materialsService = {
  async list(params: MaterialListParams = {}): Promise<PagedApiResult<MaterialApiDto>> {
    const res = await apiClient.get<PagedApiResult<MaterialApiDto>>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      danhMuc: params.danhMuc,
      nhomVatTu: params.nhomVatTu,
      loaiVatTu: params.loaiVatTu,
      phanLoai: params.phanLoai,
      kieu: params.kieu,
      categoryId: params.categoryId,
      includeInactive: params.includeInactive,
    });
    return {
      ...res,
      items: res.items.map(normalizeMaterial),
    };
  },

  async getByCode(code: string): Promise<MaterialApiDto> {
    return normalizeMaterial(
      await apiClient.get<MaterialApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`),
    );
  },

  async create(body: UpsertMaterialRequest): Promise<MaterialApiDto> {
    return normalizeMaterial(await apiClient.post<MaterialApiDto>(ENDPOINT, body));
  },

  async update(code: string, body: UpsertMaterialRequest): Promise<void> {
    await apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}`, body);
  },

  async remove(code: string): Promise<void> {
    await apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async discontinue(code: string): Promise<void> {
    await apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/discontinue`);
  },

  async reactivate(code: string): Promise<void> {
    await apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/reactivate`);
  },
};

export type { MaterialApiDto };
