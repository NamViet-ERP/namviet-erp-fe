import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOperationsDashboard } from './useOperationsDashboard';
import { alertsService, type WmsLowStockAlertApiDto } from '../services/alertsService';
import { arrivalPlansService, type ArrivalPlanListApiDto } from '../services/arrivalPlansService';
import { materialsService, type MaterialApiDto } from '../services/materialsService';
import { projectsService } from '../services/projectsService';
import { purchaseOrdersService } from '../services/purchaseOrdersService';
import { purchasePaymentsService } from '../services/purchasePaymentsService';
import { purchasePlansService } from '../services/purchasePlansService';
import type { PurchaseOrderApiDto, PurchasePaymentApiDto, PurchasePlanApiDto } from '../types/api/purchasingApi';
import type { WarehouseProjectApiDto } from '../types/wms';

vi.mock('../services/projectsService', () => ({
  projectsService: { list: vi.fn() },
}));
vi.mock('../services/purchaseOrdersService', () => ({
  purchaseOrdersService: { list: vi.fn() },
}));
vi.mock('../services/alertsService', () => ({
  alertsService: { lowStock: vi.fn() },
}));
vi.mock('../services/purchasePaymentsService', () => ({
  purchasePaymentsService: { list: vi.fn() },
}));
vi.mock('../services/purchasePlansService', () => ({
  purchasePlansService: { list: vi.fn() },
}));
vi.mock('../services/arrivalPlansService', () => ({
  arrivalPlansService: { list: vi.fn() },
}));
vi.mock('../services/materialsService', () => ({
  materialsService: { list: vi.fn() },
}));

function makeProject(overrides: Partial<WarehouseProjectApiDto>): WarehouseProjectApiDto {
  return {
    projectCode: 'DA-RM2-01',
    projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
    projectType: 'EPC',
    pmId: '8a1f2c10-1000-4000-8000-000000000001',
    pmName: 'Nguyễn Văn Hùng',
    startDate: '2026-03-01',
    endDate: '2026-12-30',
    materialBudget: 1_500_000_000,
    status: 'Active',
    clientName: 'Ban QLDA Mỹ Thuận',
    scMembers: 'Trần Minh Tuấn, Lê Quốc Bảo',
    stockActualQty: 120,
    stockPlannedQty: 200,
    stockReservedQty: 20,
    stockMaterialCount: 14,
    approvedImportValue: 450_000_000,
    materialBudgetRemaining: 1_050_000_000,
    warehouseKeepers: [{ userId: 'u-tk-1', displayName: 'Phạm Thị Lan' }],
    ...overrides,
  };
}

function makeOrder(overrides: Partial<PurchaseOrderApiDto>): PurchaseOrderApiDto {
  return {
    code: 'PO-2026-001',
    planCode: 'KHMH-2026-001',
    projectCode: 'DA-RM2-01',
    projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
    supplierId: 12,
    supplierName: 'Công ty CP Thép Hòa Phát Dung Quất',
    orderDate: '2026-11-10',
    createdAt: '2026-11-10T08:00:00Z',
    totalAmount: 280_000_000,
    approvalStatus: 'approved',
    orderPlacementStatus: 'placed',
    deliveryStatus: 'none',
    paymentStatus: 'unpaid',
    paymentWarning: false,
    supplierPaymentTermsDays: 30,
    ...overrides,
  };
}

function makePayment(overrides: Partial<PurchasePaymentApiDto>): PurchasePaymentApiDto {
  return {
    code: 'DNTT-2026-001',
    poCode: 'PO-2026-001',
    stageNumber: 1,
    supplierId: 12,
    supplierName: 'Công ty CP Thép Hòa Phát Dung Quất',
    amount: 140_000_000,
    dueDate: '2026-11-30',
    status: 'submitted',
    createdAt: '2026-11-15T08:00:00Z',
    ...overrides,
  };
}

function makeMaterial(overrides: Partial<MaterialApiDto>): MaterialApiDto {
  return {
    materialCode: 'VT-THEP-D16',
    materialName: 'Thép thanh vằn D16 CB400-V',
    categoryId: 1,
    categoryPath: {
      danhMuc: 'Thép xây dựng',
      nhomVatTu: 'Thép cốt bê tông',
      loaiVatTu: 'Thép vằn',
      phanLoai: null,
      kieu: null,
    },
    unit: 'Cây',
    isConsumable: false,
    isActive: true,
    ...overrides,
  };
}

function makeLowStock(overrides: Partial<WmsLowStockAlertApiDto>): WmsLowStockAlertApiDto {
  return {
    projectCode: 'DA-RM2-01',
    projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
    materialCode: 'VT-THEP-D16',
    materialName: 'Thép thanh vằn D16 CB400-V',
    unit: 'Cây',
    actualQty: 0,
    minStockQty: 50,
    shortageQty: 50,
    ...overrides,
  };
}

function makePlan(code: string): PurchasePlanApiDto {
  return {
    code,
    projectCode: 'DA-RM2-01',
    projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
    kind: 'plan',
    status: 'approved_l2',
    createdAt: '2026-11-01T08:00:00Z',
    budgetTotal: 500_000_000,
    proposalTotal: 480_000_000,
    purchaseTotal: 450_000_000,
    paidTotal: 150_000_000,
  };
}

function makeArrivalPlanList(
  projects: ArrivalPlanListApiDto['projects'],
): ArrivalPlanListApiDto {
  return {
    daysAhead: 7,
    overdueLookbackDays: 30,
    asOfDate: '2026-11-26',
    windowFrom: '2026-11-26',
    windowTo: '2026-12-03',
    projects,
  };
}

describe('useOperationsDashboard', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;
  let current: ReturnType<typeof useOperationsDashboard>;

  function Harness() {
    current = useOperationsDashboard();
    return null;
  }

  async function renderHook() {
    await act(async () => {
      root.render(createElement(QueryClientProvider, { client }, createElement(Harness)));
    });
  }

  async function flush(ms = 20) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, ms));
    });
  }

  async function waitFor(predicate: () => boolean, timeoutMs = 2500) {
    const start = Date.now();
    while (!predicate()) {
      if (Date.now() - start >= timeoutMs) {
        throw new Error('Timed out waiting for dashboard queries to settle');
      }
      await flush(10);
    }
  }

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it('consolidates into <= 7 controlled GETs (4 primary on mount + 3 secondary after primary settles) in <= 200 mode', async () => {
    let resolveProjects!: (val: Awaited<ReturnType<typeof projectsService.list>>) => void;
    vi.mocked(projectsService.list).mockImplementationOnce(
      () => new Promise(resolve => { resolveProjects = resolve; }),
    );
    vi.mocked(purchaseOrdersService.list).mockResolvedValueOnce({
      items: [
        makeOrder({ code: 'PO-N-1', deliveryStatus: 'none', paymentStatus: 'unpaid', paymentWarning: true }),
        makeOrder({ code: 'PO-P-1', deliveryStatus: 'partial', paymentStatus: 'partial', paymentWarning: false }),
        makeOrder({ code: 'PO-N-2', deliveryStatus: 'none', paymentStatus: 'unpaid', paymentWarning: false }),
        makeOrder({ code: 'PO-C-1', deliveryStatus: 'complete', paymentStatus: 'paid', paymentWarning: false }),
      ],
      totalCount: 4,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });
    vi.mocked(alertsService.lowStock).mockResolvedValueOnce([
      makeLowStock({ projectCode: 'DA-RM2-01', materialCode: 'VT-THEP-D16', actualQty: 0, minStockQty: 50 }),
      makeLowStock({ projectCode: 'DA-LT-02', materialCode: 'VT-XIMANG-PCB40', actualQty: 12, minStockQty: 40 }),
    ]);
    vi.mocked(purchasePaymentsService.list).mockResolvedValueOnce({
      items: [
        makePayment({ code: 'DNTT-D-1', status: 'draft' }),
        makePayment({ code: 'DNTT-S-1', status: 'submitted' }),
        makePayment({ code: 'DNTT-S-2', status: 'submitted' }),
        makePayment({ code: 'DNTT-P-1', status: 'paid' }),
      ],
      totalCount: 4,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });
    vi.mocked(purchasePlansService.list).mockResolvedValueOnce({
      items: [makePlan('KHMH-2026-001')],
      totalCount: 9,
      page: 1,
      pageSize: 1,
      totalPages: 9,
    });
    const arrivalsResp = makeArrivalPlanList([
      {
        projectCode: 'DA-RM2-01',
        projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
        hasArrivalInWindow: true,
        earliestExpectedDate: '2026-11-27',
        lineCount: 6,
        totalRemainingQty: 180,
        upcomingCount: 3,
        dueTodayCount: 2,
        overdueCount: 1,
        lines: [],
      },
      {
        projectCode: 'DA-LT-02',
        projectName: 'Nhà ga T3 Tân Sơn Nhất - Gói MEP',
        hasArrivalInWindow: true,
        earliestExpectedDate: '2026-11-28',
        lineCount: 4,
        totalRemainingQty: 90,
        upcomingCount: 4,
        dueTodayCount: 1,
        overdueCount: 2,
        lines: [],
      },
    ]);
    vi.mocked(arrivalPlansService.list).mockResolvedValueOnce(arrivalsResp);
    vi.mocked(materialsService.list).mockResolvedValueOnce({
      items: [
        makeMaterial({ materialCode: 'VT-01', isActive: true }),
        makeMaterial({ materialCode: 'VT-02', isActive: true }),
        makeMaterial({ materialCode: 'VT-03', isActive: false }),
      ],
      totalCount: 3,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });

    await renderHook();
    await waitFor(
      () =>
        vi.mocked(projectsService.list).mock.calls.length === 1
        && vi.mocked(purchaseOrdersService.list).mock.calls.length === 1
        && vi.mocked(alertsService.lowStock).mock.calls.length === 1
        && vi.mocked(purchasePaymentsService.list).mock.calls.length === 1,
    );
    await flush(20);

    // Gate check: while projectsAllQ is still pending, only the 4 primary GETs have fired
    expect(projectsService.list).toHaveBeenCalledTimes(1);
    expect(purchaseOrdersService.list).toHaveBeenCalledTimes(1);
    expect(alertsService.lowStock).toHaveBeenCalledTimes(1);
    expect(purchasePaymentsService.list).toHaveBeenCalledTimes(1);
    expect(purchasePlansService.list).not.toHaveBeenCalled();
    expect(arrivalPlansService.list).not.toHaveBeenCalled();
    expect(materialsService.list).not.toHaveBeenCalled();

    // Now settle primary projects query
    await act(async () => {
      resolveProjects({
        items: [
          makeProject({
            projectCode: 'DA-RM2-01',
            status: 'Active',
            pmId: '8a1f2c10-1000-4000-8000-000000000001',
            pmName: 'Nguyễn Văn Hùng',
            scMembers: 'Trần Minh Tuấn',
            warehouseKeepers: [{ userId: 'u-1', displayName: 'Phạm Thị Lan' }],
          }),
          makeProject({
            projectCode: 'DA-LT-02',
            projectName: 'Nhà ga T3 Tân Sơn Nhất - Gói MEP',
            status: 'Active',
            pmId: '00000000-0000-0000-0000-000000000000',
            pmName: 'Kho hàng',
            scMembers: '',
            warehouseKeepers: [],
          }),
          makeProject({
            projectCode: 'DA-HN-03',
            projectName: 'Cầu Vĩnh Tuy Giai đoạn 2',
            status: 'Closed',
            pmId: '8a1f2c10-1000-4000-8000-000000000002',
            pmName: 'Lê Hoàng Nam',
          }),
        ],
        totalCount: 3,
        page: 1,
        pageSize: 200,
        totalPages: 1,
      });
    });
    await waitFor(
      () =>
        current.counts.planCount !== '-'
        && current.counts.arrivalOverdue !== '-'
        && current.counts.materialTotal !== '-',
    );

    const totalCalls =
      vi.mocked(projectsService.list).mock.calls.length
      + vi.mocked(purchaseOrdersService.list).mock.calls.length
      + vi.mocked(alertsService.lowStock).mock.calls.length
      + vi.mocked(purchasePaymentsService.list).mock.calls.length
      + vi.mocked(purchasePlansService.list).mock.calls.length
      + vi.mocked(arrivalPlansService.list).mock.calls.length
      + vi.mocked(materialsService.list).mock.calls.length;

    expect(totalCalls).toBe(7);
    expect(totalCalls).toBeLessThanOrEqual(7);
    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 200 });
    expect(purchaseOrdersService.list).toHaveBeenCalledWith({ page: 1, pageSize: 200 });
    expect(purchasePaymentsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 200 });
    expect(materialsService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 200,
      includeInactive: true,
    });

    expect(current.isBootLoading).toBe(false);
    expect(current.isError).toBe(false);
    expect(current.activeProjects.map(p => p.projectCode)).toEqual(['DA-RM2-01', 'DA-LT-02']);
    expect(current.openOrderRows.map(o => o.code)).toEqual(['PO-N-1', 'PO-N-2', 'PO-P-1']);
    expect(current.pendingPaymentRows.map(p => p.code)).toEqual(['DNTT-S-1', 'DNTT-S-2', 'DNTT-D-1']);

    expect(current.counts).toEqual({
      projectActive: 2,
      projectClosed: 1,
      projectTotal: 3,
      projectWithPm: 1,
      projectWithoutPm: 1,
      projectWithSc: 1,
      projectWithKeeper: 1,
      stockBelowMin: 2,
      stockZero: 1,
      stockProjects: 2,
      orderNone: 2,
      orderPartial: 1,
      planCount: 9,
      paymentDraft: 1,
      paymentSubmitted: 2,
      paymentPaid: 1,
      poOverdue: 1,
      poUnpaid: 2,
      poPartialPay: 1,
      arrivalOverdue: 3,
      arrivalDueToday: 3,
      arrivalUpcoming: 7,
      materialActive: 2,
      materialInactive: 1,
      materialTotal: 3,
    });
  });

  it('activates fallback filtered queries when totalCount > 200', async () => {
    vi.mocked(projectsService.list).mockImplementation(async (params = {}) => {
      if (params.status === 'Active') {
        return {
          items: [makeProject({ projectCode: 'DA-OVF-01', status: 'Active' })],
          totalCount: 185,
          page: 1,
          pageSize: 200,
          totalPages: 1,
        };
      }
      if (params.status === 'Closed') {
        return { items: [], totalCount: 35, page: 1, pageSize: 1, totalPages: 35 };
      }
      return {
        items: [makeProject({ projectCode: 'DA-OVF-01', status: 'Active' })],
        totalCount: 220,
        page: 1,
        pageSize: 200,
        totalPages: 2,
      };
    });

    vi.mocked(purchaseOrdersService.list).mockImplementation(async (params = {}) => {
      if (params.deliveryStatus === 'none') {
        return {
          items: [makeOrder({ code: 'PO-OVF-N1', deliveryStatus: 'none' })],
          totalCount: 64,
          page: 1,
          pageSize: 8,
          totalPages: 8,
        };
      }
      if (params.deliveryStatus === 'partial') {
        return {
          items: [makeOrder({ code: 'PO-OVF-P1', deliveryStatus: 'partial' })],
          totalCount: 28,
          page: 1,
          pageSize: 8,
          totalPages: 4,
        };
      }
      if (params.paymentStatus === 'unpaid') {
        return { items: [], totalCount: 72, page: 1, pageSize: 1, totalPages: 72 };
      }
      if (params.paymentStatus === 'partial') {
        return { items: [], totalCount: 19, page: 1, pageSize: 1, totalPages: 19 };
      }
      if (params.paymentWarning === true) {
        return { items: [], totalCount: 11, page: 1, pageSize: 1, totalPages: 11 };
      }
      return {
        items: [makeOrder({ code: 'PO-OVF-N1' })],
        totalCount: 260,
        page: 1,
        pageSize: 200,
        totalPages: 2,
      };
    });

    vi.mocked(alertsService.lowStock).mockResolvedValueOnce([]);

    vi.mocked(purchasePaymentsService.list).mockImplementation(async (params = {}) => {
      if (params.status === 'draft') {
        return {
          items: [makePayment({ code: 'DNTT-OVF-D1', status: 'draft' })],
          totalCount: 14,
          page: 1,
          pageSize: 1,
          totalPages: 14,
        };
      }
      if (params.status === 'submitted') {
        return {
          items: [makePayment({ code: 'DNTT-OVF-S1', status: 'submitted' })],
          totalCount: 23,
          page: 1,
          pageSize: 5,
          totalPages: 5,
        };
      }
      if (params.status === 'paid') {
        return { items: [], totalCount: 180, page: 1, pageSize: 1, totalPages: 180 };
      }
      return {
        items: [],
        totalCount: 217,
        page: 1,
        pageSize: 200,
        totalPages: 2,
      };
    });

    vi.mocked(purchasePlansService.list).mockResolvedValueOnce({
      items: [],
      totalCount: 42,
      page: 1,
      pageSize: 1,
      totalPages: 42,
    });
    vi.mocked(arrivalPlansService.list).mockResolvedValueOnce(makeArrivalPlanList([]));
    vi.mocked(materialsService.list).mockImplementation(async (params = {}) => {
      if (params.includeInactive) {
        return {
          items: [makeMaterial({ materialCode: 'VT-OVF-1', isActive: true })],
          totalCount: 310,
          page: 1,
          pageSize: 200,
          totalPages: 2,
        };
      }
      return {
        items: [makeMaterial({ materialCode: 'VT-OVF-1', isActive: true })],
        totalCount: 275,
        page: 1,
        pageSize: 1,
        totalPages: 275,
      };
    });

    await renderHook();
    await waitFor(
      () =>
        current.counts.projectActive === 185
        && current.counts.poOverdue === 11
        && current.counts.paymentPaid === 180
        && current.counts.materialActive === 275,
    );

    expect(projectsService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 200,
      status: 'Active',
    });
    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 1, status: 'Closed' });
    expect(purchaseOrdersService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 8,
      deliveryStatus: 'none',
    });
    expect(purchaseOrdersService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 1,
      paymentWarning: true,
    });
    expect(purchasePaymentsService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 5,
      status: 'submitted',
    });
    expect(materialsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 1 });

    expect(current.counts.projectTotal).toBe(220);
    expect(current.counts.projectActive).toBe(185);
    expect(current.counts.projectClosed).toBe(35);
    expect(current.counts.orderNone).toBe(64);
    expect(current.counts.orderPartial).toBe(28);
    expect(current.counts.poUnpaid).toBe(72);
    expect(current.counts.poPartialPay).toBe(19);
    expect(current.counts.poOverdue).toBe(11);
    expect(current.counts.paymentDraft).toBe(14);
    expect(current.counts.paymentSubmitted).toBe(23);
    expect(current.counts.paymentPaid).toBe(180);
    expect(current.counts.materialTotal).toBe(310);
    expect(current.counts.materialActive).toBe(275);
    expect(current.counts.materialInactive).toBe(35);
    expect(current.openOrderRows.map(o => o.code)).toEqual(['PO-OVF-N1', 'PO-OVF-P1']);
    expect(current.pendingPaymentRows.map(p => p.code)).toEqual(['DNTT-OVF-S1', 'DNTT-OVF-D1']);
  });

  it('refetches only active queries in <= 200 mode and surfaces primary error state', async () => {
    vi.mocked(projectsService.list).mockResolvedValue({
      items: [makeProject({ projectCode: 'DA-RM2-01' })],
      totalCount: 1,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });
    vi.mocked(purchaseOrdersService.list).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 200,
      totalPages: 0,
    });
    vi.mocked(alertsService.lowStock).mockResolvedValue([]);
    vi.mocked(purchasePaymentsService.list).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 200,
      totalPages: 0,
    });
    vi.mocked(purchasePlansService.list).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 1,
      totalPages: 0,
    });
    vi.mocked(arrivalPlansService.list).mockResolvedValue(makeArrivalPlanList([]));
    vi.mocked(materialsService.list).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 200,
      totalPages: 0,
    });

    await renderHook();
    await waitFor(
      () =>
        current.counts.projectTotal === 1
        && vi.mocked(materialsService.list).mock.calls.length === 1,
    );

    expect(projectsService.list).toHaveBeenCalledTimes(1);
    expect(materialsService.list).toHaveBeenCalledTimes(1);

    await act(async () => {
      current.refetchAll();
    });
    await waitFor(() => vi.mocked(materialsService.list).mock.calls.length === 2);

    // Exactly 2x consolidated calls; zero fallback filtered calls fired
    expect(projectsService.list).toHaveBeenCalledTimes(2);
    expect(purchaseOrdersService.list).toHaveBeenCalledTimes(2);
    expect(alertsService.lowStock).toHaveBeenCalledTimes(2);
    expect(purchasePaymentsService.list).toHaveBeenCalledTimes(2);
    expect(purchasePlansService.list).toHaveBeenCalledTimes(2);
    expect(arrivalPlansService.list).toHaveBeenCalledTimes(2);
    expect(materialsService.list).toHaveBeenCalledTimes(2);

    // Primary error propagation check
    vi.mocked(projectsService.list).mockRejectedValueOnce(new Error('Lỗi kết nối danh sách dự án'));
    await act(async () => {
      current.refetchAll();
    });
    await waitFor(() => current.isError === true);
    expect(current.isError).toBe(true);
    expect(current.error).toBeInstanceOf(Error);
  });
});
