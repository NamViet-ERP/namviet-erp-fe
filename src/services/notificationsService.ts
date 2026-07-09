import { apiClient } from '../lib/apiClient';

export interface WmsNotificationItemApiDto {
  id: string;
  kind: string;
  voucherCode: string;
  title: string;
  message: string;
  route: string;
  timeLabel: string;
}

export interface WmsPendingNotificationsApiDto {
  totalCount: number;
  importCount: number;
  exportCount: number;
  transferCount: number;
  stocktakeCount: number;
  items: WmsNotificationItemApiDto[];
}

const ENDPOINT = '/api/warehouse/notifications';

export const notificationsService = {
  pending() {
    return apiClient.get<WmsPendingNotificationsApiDto>(`${ENDPOINT}/pending`);
  },
};
