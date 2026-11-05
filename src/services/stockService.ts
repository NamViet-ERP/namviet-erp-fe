import { apiClient, saveBlob } from '../lib/apiClient';
import type {
  OpeningStockImportResultDto,
  OpeningStockPreviewResponseDto,
  StockMatrixRowApiDto,
} from '../types/wms';

const ENDPOINT = '/api/stock/matrix';

export const stockService = {
  async getMatrix(): Promise<StockMatrixRowApiDto[]> {
    return apiClient.get<StockMatrixRowApiDto[]>(ENDPOINT);
  },

  async downloadOpeningStockTemplate() {
    const blob = await apiClient.getBlob('/api/stock/admin/opening-balance/template');
    return saveBlob(blob, 'Mau_Nhap_Ton_Kho_Dau_Ky.xlsx');
  },

  async previewOpeningStock(file: File, projectCode?: string) {
    const formData = new FormData();
    formData.append('file', file);
    const query = projectCode ? `?projectCode=${encodeURIComponent(projectCode)}` : '';
    return apiClient.postForm<OpeningStockPreviewResponseDto>(
      `/api/stock/admin/opening-balance/preview${query}`,
      formData,
    );
  },

  async importOpeningStock(file: File, projectCode?: string) {
    const formData = new FormData();
    formData.append('file', file);
    const query = projectCode ? `?projectCode=${encodeURIComponent(projectCode)}` : '';
    return apiClient.postForm<OpeningStockImportResultDto>(
      `/api/stock/admin/opening-balance/import-excel${query}`,
      formData,
    );
  },
};
