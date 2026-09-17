import { apiClient } from '../lib/apiClient';
import type {
  CreateProjectConstructionTaskRequest,
  CreateWarehouseProjectRequest,
  PagedApiResult,
  ProjectConstructionTaskApiDto,
  ProjectPurchasingProgressApiDto,
  UpdateProjectConstructionTaskRequest,
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

  async getNextCode(year?: number): Promise<{ projectCode: string }> {
    return apiClient.get<{ projectCode: string }>(`${ENDPOINT}/next-code`, {
      year,
    });
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

  async updateInventoryMinStock(
    projectCode: string,
    materialCode: string,
    minStockQty: number,
  ): Promise<void> {
    await apiClient.patch<void>(
      `${ENDPOINT}/${encodeURIComponent(projectCode)}/inventory/${encodeURIComponent(materialCode)}/min-stock`,
      { minStockQty },
    );
  },

  listPurchasingProgress(projectCode?: string): Promise<ProjectPurchasingProgressApiDto[]> {
    return apiClient.get<ProjectPurchasingProgressApiDto[]>(`${ENDPOINT}/purchasing-progress`, {
      projectCode: projectCode || undefined,
    });
  },

  listConstructionTasks(projectCode?: string): Promise<ProjectConstructionTaskApiDto[]> {
    return apiClient.get<ProjectConstructionTaskApiDto[]>(`${ENDPOINT}/construction-tasks`, {
      projectCode: projectCode || undefined,
    });
  },

  createConstructionTask(
    projectCode: string,
    body: CreateProjectConstructionTaskRequest,
  ): Promise<ProjectConstructionTaskApiDto> {
    return apiClient.post<ProjectConstructionTaskApiDto>(
      `${ENDPOINT}/${encodeURIComponent(projectCode)}/construction-tasks`,
      body,
    );
  },

  updateConstructionTask(
    projectCode: string,
    id: string,
    body: UpdateProjectConstructionTaskRequest,
  ): Promise<ProjectConstructionTaskApiDto> {
    return apiClient.put<ProjectConstructionTaskApiDto>(
      `${ENDPOINT}/${encodeURIComponent(projectCode)}/construction-tasks/${encodeURIComponent(id)}`,
      body,
    );
  },

  deleteConstructionTask(projectCode: string, id: string): Promise<void> {
    return apiClient.delete(
      `${ENDPOINT}/${encodeURIComponent(projectCode)}/construction-tasks/${encodeURIComponent(id)}`,
    );
  },
};
