import { apiClient } from '../lib/apiClient';
import type { WmsPendingNotificationsApiDto } from '../types/api/wms/opsApi';

export type {
  WmsNotificationItemApiDto,
  WmsPendingNotificationsApiDto,
} from '../types/api/wms/opsApi';

const ENDPOINT = '/api/warehouse/notifications';

export const notificationsService = {
  pending() {
    return apiClient.get<WmsPendingNotificationsApiDto>(`${ENDPOINT}/pending`);
  },
};
