import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';
import type { MaterialApiDto, PagedApiResult } from '../types/wms';

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

export interface UpsertMaterialRequest {
  materialCode: string;
  materialName: string;
  categoryId: number;
  unit: string;
  technicalSpec?: string | null;
  qualityStandard?: string | null;
  isConsumable?: boolean;
}

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
    if (USE_MOCK) {
      const mock = await import('./mocks/materialsService.mock');
      return mock.listMaterialsMock(params);
    }
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
    if (USE_MOCK) {
      const mock = await import('./mocks/materialsService.mock');
      return mock.getMaterialMock(code);
    }
    const dto = await apiClient.get<MaterialApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`);
    return normalizeMaterial(dto);
  },

  async create(body: UpsertMaterialRequest): Promise<MaterialApiDto> {
    if (USE_MOCK) {
      const mock = await import('./mocks/materialsService.mock');
      return mock.createMaterialMock(body);
    }
    const dto = await apiClient.post<MaterialApiDto>(ENDPOINT, body);
    return normalizeMaterial(dto);
  },

  async update(code: string, body: UpsertMaterialRequest): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/materialsService.mock');
      return mock.updateMaterialMock();
    }
    await apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}`, body);
  },

  async remove(code: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/materialsService.mock');
      return mock.removeMaterialMock();
    }
    await apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async discontinue(code: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/materialsService.mock');
      return mock.discontinueMaterialMock();
    }
    await apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/discontinue`);
  },

  async reactivate(code: string): Promise<void> {
    if (USE_MOCK) {
      const mock = await import('./mocks/materialsService.mock');
      return mock.reactivateMaterialMock();
    }
    await apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/reactivate`);
  },
};

export type { MaterialApiDto };
