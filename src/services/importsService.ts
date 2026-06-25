import type { Import } from '../types';
import { apiClient } from '../lib/apiClient';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';
import { resolveMock } from '../mocks';

export type CreateImportDto = Omit<Import, 'id'>;
export type UpdateImportDto = Partial<CreateImportDto>;

const ENDPOINT = '/api/imports';

export const importsService = {
  async list(params?: VoucherListParams): Promise<Import[]> {
    return resolveMock(
      () => import('../mocks/services/importsService.mock').then((m) => m.listImportsMock(params)),
      () => apiClient.get<Import[]>(appendVoucherDateQuery(ENDPOINT, params)),
    );
  },

  async getById(id: string): Promise<Import> {
    return resolveMock(
      () => import('../mocks/services/importsService.mock').then((m) => m.getImportMock(id)),
      () => apiClient.get<Import>(`${ENDPOINT}/${id}`),
    );
  },

  async create(dto: CreateImportDto): Promise<Import> {
    return resolveMock(
      () => import('../mocks/services/importsService.mock').then((m) => m.createImportMock(dto)),
      () => apiClient.post<Import>(ENDPOINT, dto),
    );
  },

  async update(id: string, dto: UpdateImportDto): Promise<Import> {
    return resolveMock(
      () => import('../mocks/services/importsService.mock').then((m) => m.updateImportMock(id, dto)),
      () => apiClient.put<Import>(`${ENDPOINT}/${id}`, dto),
    );
  },

  async approve(id: string): Promise<Import> {
    return resolveMock(
      () => import('../mocks/services/importsService.mock').then((m) => m.updateImportMock(id, {
        status: 'approved',
        warehouseApproval: 'approved',
        approvedBy: 'Lê Thị Hồng',
        approvedAt: new Date().toISOString(),
      })),
      () => apiClient.post<Import>(`${ENDPOINT}/${id}/approve`),
    );
  },

  async submit(id: string): Promise<Import> {
    return resolveMock(
      () => import('../mocks/services/importsService.mock').then((m) => m.updateImportMock(id, { status: 'pending' })),
      () => apiClient.post<Import>(`${ENDPOINT}/${id}/submit`),
    );
  },

  async remove(id: string): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/importsService.mock').then((m) => m.removeImportMock(id)),
      async () => { await apiClient.delete<void>(`${ENDPOINT}/${id}`); },
    );
  },
};
