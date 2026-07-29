/**
 * WMS alerts / notifications / reports — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from '../../generated/openapi';

type Schemas = components['schemas'];

export type WmsLowStockAlertApiDto = Schemas['WmsLowStockAlertDto'];
export type WmsNotificationItemApiDto = Schemas['WmsNotificationItemDto'];
export type WmsPendingNotificationsApiDto = Schemas['WmsPendingNotificationsDto'];
export type WmsMovementSummaryApiDto = Schemas['WmsMovementSummaryDto'];
export type WmsStockReportRowApiDto = Schemas['WmsStockReportRowDto'];
export type WmsPendingVoucherRowApiDto = Schemas['WmsPendingVoucherRowDto'];
export type WmsPendingReportApiDto = Schemas['WmsPendingReportDto'];
