import { apiClient, saveBlob } from '../lib/apiClient';
import type { MaterialApiDto, PagedApiResult, UpsertMaterialRequest } from '../types/wms';
import type {
  MaterialImportBatchRequest,
  MaterialImportParseResultDto,
  MaterialImportResultDto,
} from '../types/api/materialImportApi';

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

  async uploadImage(file: File, materialCode?: string): Promise<{ imageUrl: string; storageKey: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (materialCode) formData.append('materialCode', materialCode);
    return apiClient.postForm<{ imageUrl: string; storageKey: string }>(`${ENDPOINT}/upload-image`, formData);
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

  async downloadImportTemplate(): Promise<boolean> {
    const blob = await apiClient.getBlob(`${ENDPOINT}/import-template`);
    return await saveBlob(blob, 'mau-import-danh-muc-vat-tu.xlsx');
  },

  async parseImportFile(file: File): Promise<MaterialImportParseResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<MaterialImportParseResultDto>(`${ENDPOINT}/parse-import-file`, formData);
  },

  async importBatch(request: MaterialImportBatchRequest): Promise<MaterialImportResultDto> {
    return apiClient.post<MaterialImportResultDto>(`${ENDPOINT}/import-batch`, request);
  },
};

export type { MaterialApiDto };
