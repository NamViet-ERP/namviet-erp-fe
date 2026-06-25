import { mockDelay } from '../index';
import { products as mockProducts } from '../data/products';
import { matchesPathFilter } from '../../lib/wms/materialCategoryTree';
import type { MaterialApiDto, PagedApiResult } from '../../types/wms';
import type { MaterialListParams, UpsertMaterialRequest } from '../../services/materialsService';

const emptyPath = () => ({
  danhMuc: null,
  nhomVatTu: null,
  loaiVatTu: null,
  phanLoai: null,
  kieu: null,
});

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

export async function listMaterialsMock(
  params: MaterialListParams = {},
): Promise<PagedApiResult<MaterialApiDto>> {
  return mockDelay(mockList(params));
}

export async function getMaterialMock(code: string): Promise<MaterialApiDto> {
  const found = mockList({ pageSize: 500 }).items.find(m => m.materialCode === code);
  if (!found) throw new Error('Không tìm thấy vật tư');
  return mockDelay(found);
}

export async function createMaterialMock(body: UpsertMaterialRequest): Promise<MaterialApiDto> {
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

export async function updateMaterialMock(): Promise<void> {
  return mockDelay(undefined);
}

export async function removeMaterialMock(): Promise<void> {
  return mockDelay(undefined);
}

export async function discontinueMaterialMock(): Promise<void> {
  return mockDelay(undefined);
}

export async function reactivateMaterialMock(): Promise<void> {
  return mockDelay(undefined);
}
