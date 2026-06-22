import { apiClient } from '../lib/apiClient';

import { USE_MOCK, mockDelay } from '../lib/mock';

import {

  MOCK_WMS_PROJECTS,

  MOCK_PROJECT_INVENTORY,

  buildMockLedger,

} from '../data/wmsMockSeed';

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



function mockList(params: ProjectListParams): PagedApiResult<WarehouseProjectApiDto> {

  const page = params.page ?? 1;

  const pageSize = params.pageSize ?? 20;

  let filtered = [...MOCK_WMS_PROJECTS];

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

      const found = MOCK_WMS_PROJECTS.find(p => p.projectCode === code);

      if (!found) throw new Error(`Không tìm thấy dự án ${code}`);

      return mockDelay(found);

    }

    return apiClient.get<WarehouseProjectApiDto>(`${ENDPOINT}/${encodeURIComponent(code)}`);

  },



  async getInventory(code: string): Promise<WarehouseProjectInventoryApiDto[]> {

    if (USE_MOCK) return mockDelay(MOCK_PROJECT_INVENTORY[code] ?? []);

    return apiClient.get<WarehouseProjectInventoryApiDto[]>(

      `${ENDPOINT}/${encodeURIComponent(code)}/inventory`,

    );

  },



  async create(body: CreateWarehouseProjectRequest): Promise<WarehouseProjectApiDto> {

    if (USE_MOCK) {

      const created: WarehouseProjectApiDto = {

        projectCode: body.projectCode,

        projectName: body.projectName,

        projectType: body.projectType,

        pmId: body.pmId,

        pmName: body.pmName,

        startDate: body.startDate,

        endDate: body.endDate ?? null,

        materialBudget: body.materialBudget ?? 0,

        status: 'Active',

      };

      return mockDelay(created);

    }

    return apiClient.post<WarehouseProjectApiDto>(ENDPOINT, body);

  },



  async getLedger(code: string): Promise<WarehouseProjectLedgerEntryApiDto[]> {

    if (USE_MOCK) return mockDelay(buildMockLedger(code));

    return apiClient.get<WarehouseProjectLedgerEntryApiDto[]>(

      `${ENDPOINT}/${encodeURIComponent(code)}/ledger`,

    );

  },



  async closeProject(code: string): Promise<{ projectCode: string; status: string }> {

    if (USE_MOCK) return mockDelay({ projectCode: code, status: 'Closed' });

    return apiClient.post<{ projectCode: string; status: string }>(

      `${ENDPOINT}/${encodeURIComponent(code)}/close`,

    );

  },

};

