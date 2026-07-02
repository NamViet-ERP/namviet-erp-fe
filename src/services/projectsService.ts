import { apiClient } from '../lib/apiClient';
import type {
  CreateWarehouseProjectRequest,
  PagedApiResult,
  UpdateWarehouseProjectRequest,
  WarehouseProjectApiDto,
  WarehouseProjectInventoryApiDto,
  WarehouseProjectLedgerEntryApiDto,
} from '../types/wms';

const ENDPOINT = '/api/warehouse/projects';

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export const projectsService = {
  async list(params: ProjectListParams = {}): Promise<PagedApiResult<WarehouseProjectApiDto>> {
    return apiClient.get<PagedApiResult<WarehouseProjectApiDto>>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
    });
  },

  async getByCode(code: string): Promise<WarehouseProjectApiDto> {
    return apiClient.get<WarehouseProjectApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async getInventory(code: string): Promise<WarehouseProjectInventoryApiDto[]> {
    return apiClient.get<WarehouseProjectInventoryApiDto[]>(
      `${ENDPOINT}/${encodeURIComponent(code)}/inventory`,
    );
  },

  async create(body: CreateWarehouseProjectRequest): Promise<WarehouseProjectApiDto> {
    return apiClient.post<WarehouseProjectApiDto>(ENDPOINT, body);
  },

  async update(code: string, body: UpdateWarehouseProjectRequest): Promise<void> {
    await apiClient.put<void>(`${ENDPOINT}/${encodeURIComponent(code)}`, body);
  },

  async getLedger(code: string): Promise<WarehouseProjectLedgerEntryApiDto[]> {
    return apiClient.get<WarehouseProjectLedgerEntryApiDto[]>(
      `${ENDPOINT}/${encodeURIComponent(code)}/ledger`,
    );
  },

  async closeProject(code: string): Promise<{ projectCode: string; status: string }> {
    return apiClient.post<{ projectCode: string; status: string }>(
      `${ENDPOINT}/${encodeURIComponent(code)}/close`,
    );
  },
};
