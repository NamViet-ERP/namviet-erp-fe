import { apiClient } from '../lib/apiClient';
import { USE_MOCK, mockDelay } from '../lib/mock';
import { projects as mockProjects } from '../data/projects';
import type {
  PagedApiResult,
  WarehouseProjectApiDto,
  WarehouseProjectInventoryApiDto,
} from '../types/wms';

const ENDPOINT = '/api/warehouse/projects';

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

function mockToApi(p: { id: string; name: string; stage: string; pm: string }): WarehouseProjectApiDto {
  return {
    projectCode: p.id,
    projectName: p.name,
    projectType: 'Project',
    pmId: '00000000-0000-0000-0000-000000000000',
    pmName: p.pm,
    startDate: '2026-01-01',
    endDate: p.stage === 'Đóng/Hoàn thành' ? '2026-06-01' : null,
    materialBudget: 0,
    status: p.stage === 'Đóng/Hoàn thành' ? 'Closed' : 'Active',
  };
}

function mockList(params: ProjectListParams): PagedApiResult<WarehouseProjectApiDto> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  let filtered = mockProjects.map(mockToApi);
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      p => p.projectName.toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q),
    );
  }
  if (params.status) {
    filtered = filtered.filter(p => p.status === params.status);
  }
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

export const projectsService = {
  async list(params: ProjectListParams = {}): Promise<PagedApiResult<WarehouseProjectApiDto>> {
    if (USE_MOCK) return mockDelay(mockList(params));
    return apiClient.get<PagedApiResult<WarehouseProjectApiDto>>(ENDPOINT, {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
    });
  },

  async getByCode(code: string): Promise<WarehouseProjectApiDto> {
    if (USE_MOCK) {
      const found = mockProjects.find(p => p.id === code);
      if (!found) throw new Error(`Không tìm thấy dự án ${code}`);
      return mockDelay(mockToApi(found));
    }
    return apiClient.get<WarehouseProjectApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`);
  },

  async getInventory(code: string): Promise<WarehouseProjectInventoryApiDto[]> {
    if (USE_MOCK) return mockDelay([]);
    return apiClient.get<WarehouseProjectInventoryApiDto[]>(
      `${ENDPOINT}/${encodeURIComponent(code)}/inventory`,
    );
  },

  async closeProject(code: string): Promise<{ projectCode: string; status: string }> {
    if (USE_MOCK) return mockDelay({ projectCode: code, status: 'Closed' });
    return apiClient.post<{ projectCode: string; status: string }>(
      `${ENDPOINT}/${encodeURIComponent(code)}/close`,
    );
  },
};
