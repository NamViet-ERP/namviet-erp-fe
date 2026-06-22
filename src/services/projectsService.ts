import { apiClient } from '../lib/apiClient';
import { USE_MOCK } from '../lib/mock';
import type {
  CreateWarehouseProjectRequest,
  PagedApiResult,
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
    if (USE_MOCK) {
      const mock = await import('./mocks/projectsService.mock');
      return mock.listProjectsMock(params);
    }
    return apiClient.get<PagedApiResult<WarehouseProjectApiDto>>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
    });
  },

  async getByCode(code: string): Promise<WarehouseProjectApiDto> {
    if (USE_MOCK) {
      const mock = await import('./mocks/projectsService.mock');
      return mock.getProjectMock(code);
    }
    return apiClient.get<WarehouseProjectApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async getInventory(code: string): Promise<WarehouseProjectInventoryApiDto[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/projectsService.mock');
      return mock.getProjectInventoryMock(code);
    }
    return apiClient.get<WarehouseProjectInventoryApiDto[]>(
      `${ENDPOINT}/${encodeURIComponent(code)}/inventory`,
    );
  },

  async create(body: CreateWarehouseProjectRequest): Promise<WarehouseProjectApiDto> {
    if (USE_MOCK) {
      const mock = await import('./mocks/projectsService.mock');
      return mock.createProjectMock(body);
    }
    return apiClient.post<WarehouseProjectApiDto>(ENDPOINT, body);
  },

  async getLedger(code: string): Promise<WarehouseProjectLedgerEntryApiDto[]> {
    if (USE_MOCK) {
      const mock = await import('./mocks/projectsService.mock');
      return mock.getProjectLedgerMock(code);
    }
    return apiClient.get<WarehouseProjectLedgerEntryApiDto[]>(
      `${ENDPOINT}/${encodeURIComponent(code)}/ledger`,
    );
  },

  async closeProject(code: string): Promise<{ projectCode: string; status: string }> {
    if (USE_MOCK) {
      const mock = await import('./mocks/projectsService.mock');
      return mock.closeProjectMock(code);
    }
    return apiClient.post<{ projectCode: string; status: string }>(
      `${ENDPOINT}/${encodeURIComponent(code)}/close`,
    );
  },
};
