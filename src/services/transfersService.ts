import type { Transfer } from '../types';
import { apiClient } from '../lib/apiClient';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';
import { resolveMock } from '../mocks';

export type CreateTransferDto = Omit<Transfer, 'id'>;
export type UpdateTransferDto = Partial<CreateTransferDto>;

const ENDPOINT = '/api/transfers';

export const transfersService = {
  async list(params?: VoucherListParams): Promise<Transfer[]> {
    return resolveMock(
      () => import('../mocks/services/transfersService.mock').then((m) => m.listTransfersMock(params)),
      () => apiClient.get<Transfer[]>(appendVoucherDateQuery(ENDPOINT, params)),
    );
  },

  async getById(id: string): Promise<Transfer> {
    return resolveMock(
      () => import('../mocks/services/transfersService.mock').then((m) => m.getTransferMock(id)),
      () => apiClient.get<Transfer>(`${ENDPOINT}/${id}`),
    );
  },

  async create(dto: CreateTransferDto): Promise<Transfer> {
    return resolveMock(
      () => import('../mocks/services/transfersService.mock').then((m) => m.createTransferMock(dto)),
      () => apiClient.post<Transfer>(ENDPOINT, dto),
    );
  },

  async update(id: string, dto: UpdateTransferDto): Promise<Transfer> {
    return resolveMock(
      () => import('../mocks/services/transfersService.mock').then((m) => m.updateTransferMock(id, dto)),
      () => apiClient.put<Transfer>(`${ENDPOINT}/${id}`, dto),
    );
  },

  async approve(id: string): Promise<Transfer> {
    return resolveMock(
      () => import('../mocks/services/transfersService.mock').then((m) => m.updateTransferMock(id, {
        status: 'approved',
        approvedBy: 'Lê Thị Hồng',
        approvedAt: new Date().toISOString(),
      })),
      () => apiClient.post<Transfer>(`${ENDPOINT}/${id}/approve`),
    );
  },

  async submit(id: string): Promise<Transfer> {
    return resolveMock(
      () => import('../mocks/services/transfersService.mock').then((m) => m.updateTransferMock(id, { status: 'pending' })),
      () => apiClient.post<Transfer>(`${ENDPOINT}/${id}/submit`),
    );
  },

  async remove(id: string): Promise<void> {
    return resolveMock(
      () => import('../mocks/services/transfersService.mock').then((m) => m.removeTransferMock(id)),
      async () => { await apiClient.delete<void>(`${ENDPOINT}/${id}`); },
    );
  },
};
