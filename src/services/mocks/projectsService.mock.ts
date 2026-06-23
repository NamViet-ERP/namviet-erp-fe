import { mockDelay } from '../../lib/mock';
import {
  MOCK_WMS_PROJECTS,
  MOCK_PROJECT_INVENTORY,
  buildMockLedger,
} from '../../data/wmsMockSeed';
import type {
  CreateWarehouseProjectRequest,
  PagedApiResult,
  WarehouseProjectApiDto,
  WarehouseProjectInventoryApiDto,
  WarehouseProjectLedgerEntryApiDto,
} from '../../types/wms';

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

export async function listProjectsMock(
  params: ProjectListParams = {},
): Promise<PagedApiResult<WarehouseProjectApiDto>> {
  return mockDelay(mockList(params));
}

export async function getProjectMock(code: string): Promise<WarehouseProjectApiDto> {
  const found = MOCK_WMS_PROJECTS.find(p => p.projectCode === code);
  if (!found) throw new Error(`Không tìm thấy dự án ${code}`);
  return mockDelay(found);
}

export async function getProjectInventoryMock(
  code: string,
): Promise<WarehouseProjectInventoryApiDto[]> {
  return mockDelay(MOCK_PROJECT_INVENTORY[code] ?? []);
}

export async function createProjectMock(
  body: CreateWarehouseProjectRequest,
): Promise<WarehouseProjectApiDto> {
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

export async function getProjectLedgerMock(
  code: string,
): Promise<WarehouseProjectLedgerEntryApiDto[]> {
  return mockDelay(buildMockLedger(code));
}

export async function closeProjectMock(
  code: string,
): Promise<{ projectCode: string; status: string }> {
  return mockDelay({ projectCode: code, status: 'Closed' });
}
