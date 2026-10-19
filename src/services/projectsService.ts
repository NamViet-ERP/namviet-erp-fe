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

export const ENDPOINT = '/api/warehouse/projects';

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

  async updateStage(code: string, stage: string): Promise<void> {
    await apiClient.patch<void>(`${ENDPOINT}/${encodeURIComponent(code)}/stage`, { stage });
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

  async deleteProject(code: string): Promise<void> {
    await apiClient.delete<void>(`${ENDPOINT}/${encodeURIComponent(code)}`);
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

  syncConstructionTasks(
    projectCode: string,
    tasks: Array<{
      id?: string;
      name: string;
      plannedStart: string;
      plannedEnd: string;
      percentComplete: number;
      sortOrder: number;
      wbsCode?: string;
      level?: number;
      parentId?: string | null;
      isGroup?: boolean;
      department?: string | null;
      statusLabel?: string | null;
      statusTone?: string | null;
      notes?: string | null;
    }>,
  ): Promise<ProjectConstructionTaskApiDto[]> {
    return apiClient.post<ProjectConstructionTaskApiDto[]>(
      `${ENDPOINT}/${encodeURIComponent(projectCode)}/construction-tasks/sync-wbs`,
      { tasks },
    );
  },

  // --- CSKH: Bottlenecks & Meetings ---
  async listBottlenecks(code: string): Promise<any[]> {
    return apiClient.get(`${ENDPOINT}/${encodeURIComponent(code)}/bottlenecks`);
  },
  async createBottleneck(code: string, body: any): Promise<any> {
    return apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/bottlenecks`, body);
  },
  async updateBottleneck(code: string, id: string, body: any): Promise<any> {
    return apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}/bottlenecks/${encodeURIComponent(id)}`, body);
  },
  async deleteBottleneck(code: string, id: string): Promise<void> {
    return apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}/bottlenecks/${encodeURIComponent(id)}`);
  },

  async listMeetings(code: string): Promise<any[]> {
    return apiClient.get(`${ENDPOINT}/${encodeURIComponent(code)}/meetings`);
  },
  async createMeeting(code: string, body: any): Promise<any> {
    return apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/meetings`, body);
  },
  async updateMeeting(code: string, id: string, body: any): Promise<any> {
    return apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}/meetings/${encodeURIComponent(id)}`, body);
  },
  async deleteMeeting(code: string, id: string): Promise<void> {
    return apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}/meetings/${encodeURIComponent(id)}`);
  },
  async updateMeetingMinutes(code: string, id: string, body: any): Promise<any> {
    return apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}/meetings/${encodeURIComponent(id)}/minutes`, body);
  },
  async toggleMeetingAction(code: string, id: string, actionId: string, body: any): Promise<any> {
    return apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}/meetings/${encodeURIComponent(id)}/actions/${encodeURIComponent(actionId)}`, body);
  },

  // --- CSKH: Documents ---
  async listDocuments(code: string): Promise<any[]> {
    return apiClient.get(`${ENDPOINT}/${encodeURIComponent(code)}/documents`);
  },
  async createDocument(code: string, body: any): Promise<any> {
    return apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/documents`, body);
  },
  async updateDocument(code: string, id: string, body: any): Promise<any> {
    return apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}/documents/${encodeURIComponent(id)}`, body);
  },
  async deleteDocument(code: string, id: string): Promise<void> {
    return apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}/documents/${encodeURIComponent(id)}`);
  },

  async uploadDocumentFile(code: string, id: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm(`${ENDPOINT}/${encodeURIComponent(code)}/documents/${encodeURIComponent(id)}/upload`, formData);
  },


  // --- CSKH: Requests Center ---
  async listRequests(code: string): Promise<any[]> {
    return apiClient.get(`${ENDPOINT}/${encodeURIComponent(code)}/requests`);
  },
  async createRequest(code: string, body: any): Promise<any> {
    return apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/requests`, body);
  },
  async updateRequest(code: string, id: string, body: any): Promise<any> {
    return apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}/requests/${encodeURIComponent(id)}`, body);
  },
  async deleteRequest(code: string, id: string): Promise<void> {
    return apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}/requests/${encodeURIComponent(id)}`);
  },

  // --- CSKH: Gantt Chart ---
  async listGanttTasks(code: string): Promise<any[]> {
    return apiClient.get(`${ENDPOINT}/construction-tasks?projectCode=${encodeURIComponent(code)}`);
  },
  async createGanttTask(code: string, body: any): Promise<any> {
    return apiClient.post(`${ENDPOINT}/${encodeURIComponent(code)}/construction-tasks`, body);
  },
  async updateGanttTask(code: string, id: string, body: any): Promise<any> {
    return apiClient.put(`${ENDPOINT}/${encodeURIComponent(code)}/construction-tasks/${encodeURIComponent(id)}`, body);
  },
  async deleteGanttTask(code: string, id: string): Promise<void> {
    return apiClient.delete(`${ENDPOINT}/${encodeURIComponent(code)}/construction-tasks/${encodeURIComponent(id)}`);
  },
};
