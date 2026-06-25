import type { Export } from '../types';
import { apiClient } from '../lib/apiClient';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';
import { resolveMock } from '../mocks';

export type CreateExportDto = Omit<Export, 'id'>;
export type UpdateExportDto = Partial<CreateExportDto>;

const ENDPOINT = '/api/exports';

export const exportsService = {
  async list(params?: VoucherListParams): Promise<Export[]> {
    return resolveMock(
      () => import('../mocks/services/exportsService.mock').then((m) => m.listExportsMock(params)),
      () => apiClient.get<Export[]>(appendVoucherDateQuery(ENDPOINT, params)),
    );
  },

  async getById(id: string): Promise<Export> {
    return resolveMock(
      () => import('../mocks/services/exportsService.mock').then((m) => m.getExportMock(id)),
      () => apiClient.get<Export>(`${ENDPOINT}/${id}`),
    );
  },

  async create(dto: CreateExportDto): Promise<Export> {
    return resolveMock(
      () => import('../mocks/services/exportsService.mock').then((m) => m.createExportMock(dto)),
      () => apiClient.post<Export>(ENDPOINT, dto),
    );
  },

  async update(id: string, dto: UpdateExportDto): Promise<Export> {
    return resolveMock(
      () => import('../mocks/services/exportsService.mock').then((m) => m.updateExportMock(id, dto)),
      () => apiClient.put<Export>(`${ENDPOINT}/${id}`, dto),
    );
  },

  async approve(id: string): Promise<Export> {
    return resolveMock(
      () => import('../mocks/services/exportsService.mock').then((m) => m.updateExportMock(id, {
        status: 'approved',
        approvedBy: 'Lê Thị Hồng',
        approvedAt: new Date().toISOString(),
      })),
      () => apiClient.post<Export>(`${ENDPOINT}/${id}/approve`),
    );
  },

  async submit(id: string): Promise<Export> {
    return resolveMock(
      () => import('../mocks/services/exportsService.mock').then((m) => m.updateExportMock(id, { status: 'pending' })),
      () => apiClient.post<Export>(`${ENDPOINT}/${id}/submit`),
    );
  },

  async remove(id: string): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/exportsService.mock').then((m) => m.removeExportMock(id)),
      async () => { await apiClient.delete<void>(`${ENDPOINT}/${id}`); },
    );
  },
};
