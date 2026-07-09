import { e2eEnv } from './env';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface LoginResponse {
  token: string;
}

let cachedLoginToken: string | null = null;

export interface StocktakeApiDto {
  id: string;
  voucherCode: string;
  status: string;
  warehouseId?: string;
  warehouseName?: string;
  isFrozen?: boolean;
  note?: string;
  items?: unknown[];
}

export interface VoucherApiDto {
  id: string;
  voucherCode: string;
  status: string;
  project?: string;
}

export interface ProjectApiDto {
  projectCode: string;
  projectName: string;
  status?: string;
}

export interface MaterialApiDto {
  materialCode: string;
  materialName: string;
  unit?: string;
}

export interface SupplierApiDto {
  id: number;
  supplierName: string;
}

export interface StockMatrixRowApiDto {
  materialCode: string;
  materialName: string;
  projects: Array<{
    projectCode: string;
    projectName: string;
    actualQty: number;
  }>;
}

export interface ReturnableExportApiDto {
  id: string;
  voucherCode: string;
  returnableLineCount: number;
}

interface PagedResult<T> {
  items: T[];
}

async function apiRequest<T>(
  method: ApiMethod,
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${e2eEnv.apiBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function loginToken(): Promise<string> {
  if (cachedLoginToken) return cachedLoginToken;

  const res = await fetch(`${e2eEnv.apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: e2eEnv.username,
      password: e2eEnv.password,
      rememberMe: false,
    }),
  });

  if (!res.ok) throw new Error(`E2E login failed (${res.status})`);
  const data = (await res.json()) as LoginResponse;
  if (!data.token) throw new Error('E2E login response missing token');
  cachedLoginToken = data.token;
  return data.token;
}

export async function getProjects(token: string): Promise<ProjectApiDto[]> {
  const page = await apiRequest<PagedResult<ProjectApiDto>>(
    'GET',
    '/api/warehouse/projects?page=1&pageSize=50',
    token,
  );
  return page.items.filter(p => p.status !== 'Closed');
}

export async function getMaterials(token: string): Promise<MaterialApiDto[]> {
  const page = await apiRequest<PagedResult<MaterialApiDto>>(
    'GET',
    '/api/warehouse/materials?page=1&pageSize=50',
    token,
  );
  return page.items;
}

export async function getSuppliers(token: string): Promise<SupplierApiDto[]> {
  const page = await apiRequest<PagedResult<SupplierApiDto>>(
    'GET',
    '/api/suppliers?page=1&pageSize=50',
    token,
  );
  return page.items;
}

export async function getStockMatrix(token: string): Promise<StockMatrixRowApiDto[]> {
  return apiRequest<StockMatrixRowApiDto[]>('GET', '/api/stock/matrix', token);
}

export async function findUnfrozenProject(token: string): Promise<ProjectApiDto | null> {
  const projects = await getProjects(token);
  const stocktakes = await listStocktakes(token);
  const frozenProjects = new Set(
    stocktakes
      .filter(s => s.status === 'pending' && s.isFrozen && s.warehouseId)
      .map(s => s.warehouseId as string),
  );
  return projects.find(p => !frozenProjects.has(p.projectCode)) ?? null;
}

export async function findProjectWithStock(
  token: string,
): Promise<{ projectCode: string; projectName: string; materialCode: string; materialName: string } | null> {
  return findUnfrozenProjectWithStock(token);
}

export async function findUnfrozenProjectWithStock(
  token: string,
): Promise<{ projectCode: string; projectName: string; materialCode: string; materialName: string } | null> {
  const matrix = await getStockMatrix(token);
  const stocktakes = await listStocktakes(token);
  const frozenProjects = new Set(
    stocktakes
      .filter(s => s.status === 'pending' && s.isFrozen && s.warehouseId)
      .map(s => s.warehouseId as string),
  );

  for (const row of matrix) {
    for (const project of row.projects) {
      if (project.actualQty > 0 && !frozenProjects.has(project.projectCode)) {
        return {
          projectCode: project.projectCode,
          projectName: project.projectName,
          materialCode: row.materialCode,
          materialName: row.materialName,
        };
      }
    }
  }
  return null;
}

export async function findReturnableExport(
  token: string,
  projectCode: string,
): Promise<ReturnableExportApiDto | null> {
  const list = await apiRequest<ReturnableExportApiDto[]>(
    'GET',
    `/api/export-returns/returnable-exports?projectCode=${encodeURIComponent(projectCode)}`,
    token,
  );
  return list.find(item => item.returnableLineCount > 0) ?? null;
}

export interface ReturnableLineApiDto {
  sku: string;
  remainingQty: number;
}

export async function findReturnableLines(
  token: string,
  sourceExportId: string,
): Promise<ReturnableLineApiDto[]> {
  return apiRequest<ReturnableLineApiDto[]>(
    'GET',
    `/api/export-returns/returnable-lines?sourceExportId=${encodeURIComponent(sourceExportId)}`,
    token,
  );
}

export async function findAnyReturnableExport(
  token: string,
): Promise<{ projectCode: string; export: ReturnableExportApiDto } | null> {
  const projects = await getProjects(token);
  for (const project of projects) {
    const list = await apiRequest<ReturnableExportApiDto[]>(
      'GET',
      `/api/export-returns/returnable-exports?projectCode=${encodeURIComponent(project.projectCode)}`,
      token,
    );
    for (const exp of list) {
      if (exp.returnableLineCount <= 0) continue;
      const lines = await findReturnableLines(token, exp.id);
      if (lines.some(line => line.remainingQty > 0)) {
        return { projectCode: project.projectCode, export: exp };
      }
    }
  }
  return null;
}

export async function listStocktakes(token: string): Promise<StocktakeApiDto[]> {
  return apiRequest<StocktakeApiDto[]>('GET', '/api/stocktakes', token);
}

export async function listImports(token: string): Promise<VoucherApiDto[]> {
  return apiRequest<VoucherApiDto[]>('GET', '/api/imports', token);
}

export async function listExports(token: string): Promise<VoucherApiDto[]> {
  return apiRequest<VoucherApiDto[]>('GET', '/api/exports', token);
}

export async function listTransfers(token: string): Promise<VoucherApiDto[]> {
  return apiRequest<VoucherApiDto[]>('GET', '/api/transfers', token);
}

export async function listExportReturns(token: string): Promise<VoucherApiDto[]> {
  return apiRequest<VoucherApiDto[]>('GET', '/api/export-returns', token);
}

function todayDisplayDate(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${now.getFullYear()}`;
}

export async function createFrozenStocktake(
  token: string,
  projectCode: string,
  projectName: string,
  materialCode: string,
  materialName: string,
  note: string,
): Promise<StocktakeApiDto> {
  return apiRequest<StocktakeApiDto>('POST', '/api/stocktakes', token, {
    date: todayDisplayDate(),
    status: 'pending',
    warehouseId: projectCode,
    warehouseName: projectName,
    condition: 'counting',
    isFrozen: true,
    note,
    items: [
      {
        productId: materialCode,
        sku: materialCode,
        name: materialName,
        systemQty: 0,
        actualQty: 1,
        diff: 1,
      },
    ],
  });
}

export async function updateStocktake(
  token: string,
  id: string,
  patch: Partial<StocktakeApiDto>,
): Promise<StocktakeApiDto> {
  const current = await apiRequest<StocktakeApiDto>('GET', `/api/stocktakes/${id}`, token);
  return apiRequest<StocktakeApiDto>('PUT', `/api/stocktakes/${id}`, token, { ...current, ...patch });
}

export async function cancelStocktake(id: string, token: string): Promise<void> {
  await updateStocktake(token, id, { status: 'cancelled', isFrozen: false });
}

export async function deleteImport(id: string, token: string): Promise<void> {
  await apiRequest('DELETE', `/api/imports/${id}`, token);
}

export async function deleteExport(id: string, token: string): Promise<void> {
  await apiRequest('DELETE', `/api/exports/${id}`, token);
}

export async function deleteTransfer(id: string, token: string): Promise<void> {
  await apiRequest('DELETE', `/api/transfers/${id}`, token);
}

export async function deleteExportReturn(id: string, token: string): Promise<void> {
  await apiRequest('DELETE', `/api/export-returns/${id}`, token);
}

export async function findVoucherIdByCode(
  token: string,
  kind: 'imports' | 'exports' | 'transfers' | 'export-returns',
  voucherCode: string,
): Promise<string | undefined> {
  const list = await apiRequest<VoucherApiDto[]>('GET', `/api/${kind}`, token);
  return list.find(item => item.voucherCode === voucherCode)?.id;
}

export interface EmployeeApiDto {
  id: string;
  fullName: string;
  code?: string;
  status?: string;
}

export interface CandidateApiDto {
  id: string;
  fullName: string;
  email?: string;
}

interface CandidatePagedApiDto {
  items: CandidateApiDto[];
  totalCount: number;
}

export interface AdminUserApiDto {
  id: string;
  fullName: string;
  email: string;
  employeeCode?: string;
}

interface AdminUserPagedApiDto {
  items: AdminUserApiDto[];
  totalCount: number;
}

export interface AdminRoleApiDto {
  code: string;
  label: string;
  isActive: boolean;
}

export async function listEmployees(token: string): Promise<EmployeeApiDto[]> {
  return apiRequest<EmployeeApiDto[]>('GET', '/api/employees', token);
}

export async function getEmployee(token: string, id: string): Promise<EmployeeApiDto> {
  return apiRequest<EmployeeApiDto>('GET', `/api/employees/${id}`, token);
}

export async function listCandidates(
  token: string,
  page = 1,
  pageSize = 20,
): Promise<CandidatePagedApiDto> {
  return apiRequest<CandidatePagedApiDto>(
    'GET',
    `/api/candidates?page=${page}&pageSize=${pageSize}`,
    token,
  );
}

export async function listAdminUsers(
  token: string,
  page = 1,
  pageSize = 20,
): Promise<AdminUserPagedApiDto> {
  return apiRequest<AdminUserPagedApiDto>(
    'GET',
    `/api/admin/users?page=${page}&pageSize=${pageSize}`,
    token,
  );
}

export async function listAdminRoles(token: string): Promise<AdminRoleApiDto[]> {
  return apiRequest<AdminRoleApiDto[]>('GET', '/api/admin/roles', token);
}

export interface RecruitmentPositionApiDto {
  name: string;
  isActive: boolean;
}

export interface HrStaffApiDto {
  id: string;
  name: string;
}

export async function listRecruitmentPositions(token: string): Promise<RecruitmentPositionApiDto[]> {
  return apiRequest<RecruitmentPositionApiDto[]>('GET', '/api/recruitment/positions', token);
}

export async function createRecruitmentPosition(
  token: string,
  name: string,
): Promise<RecruitmentPositionApiDto> {
  return apiRequest<RecruitmentPositionApiDto>('POST', '/api/recruitment/positions', token, {
    name,
    isActive: true,
  });
}

export async function deleteRecruitmentPosition(token: string, name: string): Promise<void> {
  await apiRequest('DELETE', `/api/recruitment/positions/${encodeURIComponent(name)}`, token);
}

export async function ensureActiveRecruitmentPosition(
  token: string,
  preferredName: string,
): Promise<{ name: string; created: boolean }> {
  const positions = await listRecruitmentPositions(token);
  const active = positions.find(p => p.isActive);
  if (active) return { name: active.name, created: false };

  const existing = positions.find(p => p.name === preferredName);
  if (existing) {
    // Toggle is not exposed here; recreate with a unique name instead.
    const unique = `${preferredName} ${Date.now().toString().slice(-4)}`;
    await createRecruitmentPosition(token, unique);
    return { name: unique, created: true };
  }

  await createRecruitmentPosition(token, preferredName);
  return { name: preferredName, created: true };
}

export async function listHrStaff(token: string): Promise<HrStaffApiDto[]> {
  return apiRequest<HrStaffApiDto[]>('GET', '/api/recruitment/hr-staff', token);
}

export async function deleteEmployee(token: string, id: string): Promise<void> {
  await apiRequest('DELETE', `/api/employees/${id}`, token);
}

export async function deleteCandidate(token: string, id: string): Promise<void> {
  await apiRequest('DELETE', `/api/candidates/${id}`, token);
}

export async function findEmployeeByName(
  token: string,
  fullName: string,
): Promise<EmployeeApiDto | undefined> {
  const employees = await listEmployees(token);
  return employees.find(e => e.fullName === fullName);
}

export async function findCandidateByName(
  token: string,
  fullName: string,
): Promise<CandidateApiDto | undefined> {
  const page = await apiRequest<CandidatePagedApiDto>(
    'GET',
    `/api/candidates?page=1&pageSize=20&search=${encodeURIComponent(fullName)}`,
    token,
  );
  return page.items.find(c => c.fullName === fullName) ?? page.items[0];
}

export async function createEmployee(
  token: string,
  payload: Record<string, unknown>,
): Promise<EmployeeApiDto> {
  return apiRequest<EmployeeApiDto>('POST', '/api/employees', token, {
    id: '',
    ...payload,
  });
}

export async function createCandidate(
  token: string,
  payload: Record<string, unknown>,
): Promise<CandidateApiDto> {
  // Authenticated callers can still hit CORS higher limits than anonymous public form;
  // send required fields without CV file binary to avoid PublicUpload quota.
  return apiRequest<CandidateApiDto>('POST', '/api/candidates', token, {
    id: '',
    ...payload,
  });
}
