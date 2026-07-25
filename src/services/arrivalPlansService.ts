import { apiClient } from '../lib/apiClient';

export interface ArrivalPlanLineApiDto {
  lineId: number;
  planCode: string;
  materialCode: string | null;
  productName: string;
  unit: string;
  quantity: number;
  orderedQty: number;
  receivedQty: number;
  remainingQty: number;
  expectedDeliveryDate: string;
  purchaseSupplierName: string | null;
  unitPrice: number | null;
}

export interface ArrivalPlanProjectApiDto {
  projectCode: string;
  projectName: string;
  hasArrivalInWindow: boolean;
  earliestExpectedDate: string | null;
  lineCount: number;
  totalRemainingQty: number;
  lines: ArrivalPlanLineApiDto[];
}

export interface ArrivalPlanListApiDto {
  daysAhead: number;
  windowFrom: string;
  windowTo: string;
  projects: ArrivalPlanProjectApiDto[];
}

export const arrivalPlansService = {
  list(daysAhead: number, projectCode?: string): Promise<ArrivalPlanListApiDto> {
    return apiClient.get<ArrivalPlanListApiDto>('/api/purchasing/arrival-plans', {
      daysAhead,
      projectCode: projectCode || undefined,
    });
  },
};
