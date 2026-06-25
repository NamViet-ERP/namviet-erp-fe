import { apiClient } from '../lib/apiClient';
import { resolveMock } from '../mocks';
import type {
  CreateWarehouseProjectRequest,
  PagedApiResult,
  WarehouseProjectApiDto,
  WarehouseProjectInventoryApiDto,
  WarehouseProjectLedgerEntryApiDto,
} from '../types/wms';

const ENDPOINT = '/api/warehouse/projects';
const MOCK = () => import('../mocks/services/projectsService.mock');

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export const projectsService = {
  async list(params: ProjectListParams = {}): Promise<PagedApiResult<WarehouseProjectApiDto>> {
    return resolveMock(
      () => MOCK().then((m) => m.listProjectsMock(params)),
      () => apiClient.get<PagedApiResult<WarehouseProjectApiDto>>(ENDPOINT, {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        status: params.status,
      }),
    );
  },

  async getByCode(code: string): Promise<WarehouseProjectApiDto> {
    return resolveMock(
      () => MOCK().then((m) => m.getProjectMock(code)),
      () => apiClient.get<WarehouseProjectApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`),
    );
  },

  async getInventory(code: string): Promise<WarehouseProjectInventoryApiDto[]> {
    return resolveMock(
      () => MOCK().then((m) => m.getProjectInventoryMock(code)),
      () => apiClient.get<WarehouseProjectInventoryApiDto[]>(
        `${ENDPOINT}/${encodeURIComponent(code)}/inventory`,
      ),
    );
  },

  async create(body: CreateWarehouseProjectRequest): Promise<WarehouseProjectApiDto> {
    return resolveMock(
      () => MOCK().then((m) => m.createProjectMock(body)),
      () => apiClient.post<WarehouseProjectApiDto>(ENDPOINT, body),
    );
  },

  async getLedger(code: string): Promise<WarehouseProjectLedgerEntryApiDto[]> {
    return resolveMock(
      () => MOCK().then((m) => m.getProjectLedgerMock(code)),
      () => apiClient.get<WarehouseProjectLedgerEntryApiDto[]>(
        `${ENDPOINT}/${encodeURIComponent(code)}/ledger`,
      ),
    );
  },

  async closeProject(code: string): Promise<{ projectCode: string; status: string }> {
    return resolveMock(
      () => MOCK().then((m) => m.closeProjectMock(code)),
      () => apiClient.post<{ projectCode: string; status: string }>(
        `${ENDPOINT}/${encodeURIComponent(code)}/close`,
      ),
    );
  },
};
