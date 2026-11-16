import { apiClient, saveBlob } from '../lib/apiClient';
import type {
  MaterialUnitApiDto,
  MaterialUnitImportBatchRequest,
  MaterialUnitImportParseResultDto,
  MaterialUnitImportResultDto,
} from '../types/wms';

export interface UpsertMaterialUnitRequest {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

const ENDPOINT = '/api/material-units';

export const materialUnitsService = {
  async list(activeOnly = false): Promise<MaterialUnitApiDto[]> {
    const qs = activeOnly ? '?activeOnly=true' : '';
    return apiClient.get<MaterialUnitApiDto[]>(`${ENDPOINT}${qs}`);
  },

  async create(body: UpsertMaterialUnitRequest): Promise<MaterialUnitApiDto> {
    return apiClient.post<MaterialUnitApiDto>(ENDPOINT, body);
  },

  async update(id: number, body: UpsertMaterialUnitRequest): Promise<void> {
    await apiClient.put(`${ENDPOINT}/${id}`, body);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },

  async downloadImportTemplate(): Promise<boolean> {
    const blob = await apiClient.getBlob(`${ENDPOINT}/import-template`);
    return await saveBlob(blob, 'mau-import-don-vi-tinh.xlsx');
  },

  async parseImportFile(file: File): Promise<MaterialUnitImportParseResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<MaterialUnitImportParseResultDto>(`${ENDPOINT}/parse-import-file`, formData);
  },

  async importBatch(request: MaterialUnitImportBatchRequest): Promise<MaterialUnitImportResultDto> {
    return apiClient.post<MaterialUnitImportResultDto>(`${ENDPOINT}/import-batch`, request);
  },
};
