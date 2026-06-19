import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay } from '../lib/mock';
import { products as mockProducts } from '../data/products';
import { matchesPathFilter } from '../lib/wms/materialCategoryTree';
import type { MaterialApiDto, MaterialCategoryPathApiDto, PagedApiResult } from '../types/wms';

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
  /** Lọc theo node đã chọn + toàn bộ con cháu trên cây danh mục */
  categoryId?: number;
  /** Bao gồm vật tư đã ngừng sử dụng */
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

const emptyPath = (): MaterialCategoryPathApiDto => ({
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

function mockList(params: MaterialListParams): PagedApiResult<MaterialApiDto> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  let filtered = mockProducts.map(p => ({
    materialCode: p.sku,
    materialName: p.name,
    categoryId: 1,
    categoryName: p.category,
    categoryPath: {
      danhMuc: p.category,
      nhomVatTu: null,
      loaiVatTu: null,
      phanLoai: null,
      kieu: null,
    },
    unit: p.unit,
    technicalSpec: null,
    qualityStandard: null,
    isConsumable: p.category === 'Vật tư tiêu hao',
    isActive: true,
  }));
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      m => m.materialName.toLowerCase().includes(q) || m.materialCode.toLowerCase().includes(q),
    );
  }
  filtered = filtered.filter(m =>
    matchesPathFilter(m.categoryPath, {
      danhMuc: params.danhMuc,
      nhomVatTu: params.nhomVatTu,
      loaiVatTu: params.loaiVatTu,
      phanLoai: params.phanLoai,
      kieu: params.kieu,
    }),
  );
  const totalCount = filtered.length;
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export const materialsService = {
  async list(params: MaterialListParams = {}): Promise<PagedApiResult<MaterialApiDto>> {
    if (USE_MOCK) return mockDelay(mockList(params));
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
      const list = mockList({ pageSize: 500 });
      const found = list.items.find(m => m.materialCode === code);
      if (!found) throw new Error('Không tìm thấy vật tư');
      return mockDelay(found);
    }
    const dto = await apiClient.get<MaterialApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`);
    return normalizeMaterial(dto);
  },

  async create(body: UpsertMaterialRequest): Promise<MaterialApiDto> {
    if (USE_MOCK) {
      return mockDelay({
        materialCode: body.materialCode,
        materialName: body.materialName,
        categoryId: body.categoryId,
        categoryName: null,
        categoryPath: emptyPath(),
        unit: body.unit,
        technicalSpec: body.technicalSpec ?? null,
        qualityStandard: body.qualityStandard ?? null,
        isConsumable: body.isConsumable ?? false,
        isActive: true,
      });
    }
    const dto = await apiClient.post<MaterialApiDto>(ENDPOINT, body);
    return normalizeMaterial(dto);
  },

  async update(code: string, body: UpsertMaterialRequest): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}`, body);
  },

  async remove(code: string): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async discontinue(code: string): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/discontinue`);
  },

  async reactivate(code: string): Promise<void> {
    if (USE_MOCK) return mockDelay(undefined);
    await apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/reactivate`);
  },
};

export type { MaterialApiDto };
