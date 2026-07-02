import type { Transfer } from '../types';
import { apiClient } from '../lib/apiClient';
import { appendVoucherDateQuery, type VoucherListParams } from '../lib/wms/voucherDateUtils';

export type CreateTransferDto = Omit<Transfer, 'id'>;
export type UpdateTransferDto = Partial<CreateTransferDto>;

const ENDPOINT = '/api/transfers';

export const transfersService = {
  async list(params?: VoucherListParams): Promise<Transfer[]> {
    return apiClient.get<Transfer[]>(appendVoucherDateQuery(ENDPOINT, params));
  },

  async getById(id: string): Promise<Transfer> {
    return apiClient.get<Transfer>(`${ENDPOINT}/${id}`);
  },

  async create(dto: CreateTransferDto): Promise<Transfer> {
    return apiClient.post<Transfer>(ENDPOINT, dto);
  },

  async update(id: string, dto: UpdateTransferDto): Promise<Transfer> {
    return apiClient.put<Transfer>(`${ENDPOINT}/${id}`, dto);
  },

  async approve(id: string): Promise<Transfer> {
    return apiClient.post<Transfer>(`${ENDPOINT}/${id}/approve`);
  },

  async submit(id: string): Promise<Transfer> {
    return apiClient.post<Transfer>(`${ENDPOINT}/${id}/submit`);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<void>(`${ENDPOINT}/${id}`);
  },
};
