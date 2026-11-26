import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cskhService } from '../../services/cskhService';
import { projectsService } from '../../services/projectsService';
import type { WarehouseProjectApiDto } from '../../types/wms';
import Executive360DashboardPage from './Executive360DashboardPage';

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
    getByCode: vi.fn(),
    listPurchasingProgress: vi.fn(),
    getInventory: vi.fn(),
    listConstructionTasks: vi.fn(),
  },
}));

vi.mock('../../services/cskhService', () => ({
  cskhService: {
    listBottlenecks: vi.fn(),
    listRequests: vi.fn(),
    listMeetings: vi.fn(),
    getGanttSnapshots: vi.fn(),
  },
}));

const sampleProject: WarehouseProjectApiDto = {
  projectCode: 'DA-RM2-01',
  projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
  projectType: 'EPC',
  pmId: '8a1f2c10-1000-4000-8000-000000000001',
  pmName: 'Nguyễn Văn Hùng',
  startDate: '2026-03-01',
  endDate: '2026-12-30',
  materialBudget: 2_000_000_000,
  status: 'Active',
  clientName: 'Ban QLDA Mỹ Thuận',
  scMembers: 'Trần Minh Tuấn, Lê Quốc Bảo',
  stockActualQty: 320,
  stockPlannedQty: 500,
  stockReservedQty: 40,
  stockMaterialCount: 12,
  approvedImportValue: 900_000_000,
  materialBudgetRemaining: 1_100_000_000,
  warehouseKeepers: [{ userId: 'u-tk-1', displayName: 'Phạm Thị Lan' }],
};

describe('Executive360DashboardPage', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  async function flush(ms = 20) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, ms));
    });
  }

  async function waitFor(predicate: () => boolean, timeoutMs = 2500) {
    const start = Date.now();
    while (!predicate()) {
      if (Date.now() - start >= timeoutMs) {
        throw new Error('Timed out waiting for Executive360 view state');
      }
      await flush(15);
    }
  }

  async function renderPage(readyPredicate?: () => boolean) {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(MemoryRouter, null, createElement(Executive360DashboardPage)),
        ),
      );
    });
    if (readyPredicate) {
      await waitFor(readyPredicate);
    } else {
      await flush(30);
    }
  }

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
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

  it('renders single h1 in PageHeader, h2 project title, all 5 pillars, and accessible bottleneck tokens', async () => {
    vi.mocked(projectsService.list).mockResolvedValue({
      items: [sampleProject],
      totalCount: 1,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });
    vi.mocked(projectsService.getByCode).mockResolvedValue(sampleProject);
    vi.mocked(projectsService.listPurchasingProgress).mockResolvedValue([
      {
        projectCode: 'DA-RM2-01',
        projectName: sampleProject.projectName,
        percentComplete: 80,
        status: 'in_progress',
        orders: [
          {
            poCode: 'PO-2026-011',
            supplierName: 'Công ty CP Thép Hòa Phát Dung Quất',
            planCode: 'KHMH-2026-001',
            plannedStart: '2026-10-15',
            plannedEnd: '2026-11-15',
            actualEnd: '2026-11-14',
            ordered: 100,
            received: 100,
            deliveryStatus: 'complete',
            status: 'complete',
            percentComplete: 100,
            receipts: [],
            lines: [],
          },
          {
            poCode: 'PO-2026-012',
            supplierName: 'Công ty Xi măng Hà Tiên 1',
            planCode: 'KHMH-2026-002',
            plannedStart: '2026-11-05',
            plannedEnd: '2026-11-30',
            actualEnd: null,
            ordered: 200,
            received: 120,
            deliveryStatus: 'partial',
            status: 'partial',
            percentComplete: 60,
            receipts: [],
            lines: [],
          },
        ],
        plans: [],
      },
    ]);
    vi.mocked(projectsService.getInventory).mockResolvedValue([
      {
        projectCode: 'DA-RM2-01',
        materialCode: 'VT-THEP-D16',
        materialName: 'Thép thanh vằn D16 CB400-V',
        unit: 'Cây',
        plannedImportQty: 400,
        plannedExportQty: 200,
        actualImportQty: 320,
        actualExportQty: 120,
        actualInventoryQty: 200,
        plannedInventoryQty: 200,
        reservedQty: 0,
        minStockQty: 50,
        pendingDefectQty: 0,
        issuedFromPoQty: 80,
        issuedFromGeneralQty: 20,
      },
    ]);
    vi.mocked(projectsService.listConstructionTasks).mockResolvedValue([]);
    vi.mocked(cskhService.listBottlenecks).mockResolvedValue([
      {
        id: 'bn-1',
        code: 'DN-01',
        projectCode: 'DA-RM2-01',
        name: 'Chậm giải phóng mặt bằng trụ T4',
        severity: 'urgent',
        status: 'open',
        startedAt: '2026-11-10',
        expectedAt: '2026-11-28',
        reason: 'Chờ ban bồi thường huyện hoàn tất bàn giao ranh mốc',
        source: 'manual',
        history: [],
      },
      {
        id: 'bn-2',
        code: 'DN-02',
        projectCode: 'DA-RM2-01',
        name: 'Thiếu chứng chỉ CO/CQ lô cáp dự ứng lực',
        severity: 'medium',
        status: 'open',
        startedAt: '2026-11-14',
        expectedAt: '2026-11-29',
        reason: 'Nhà cung cấp đang bổ sung bản gốc có dấu hải quan',
        source: 'manual',
        history: [],
      },
    ]);
    vi.mocked(cskhService.listRequests).mockResolvedValue([]);
    vi.mocked(cskhService.listMeetings).mockResolvedValue([]);
    vi.mocked(cskhService.getGanttSnapshots).mockResolvedValue([]);

    await renderPage(() => (container.textContent?.includes('80%') ?? false));

    const shell = container.querySelector('.erp-page-shell--list.executive-360-page');
    expect(shell).not.toBeNull();

    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe('Điều hành Dự án 360°');

    const h2 = container.querySelector('h2');
    expect(h2?.textContent).toBe('Trạm trộn bê tông Cầu Rạch Miễu 2');

    expect(container.textContent).toContain('1. Nhân sự Hiện trường');
    expect(container.textContent).toContain('2. Tiến độ & Điểm nghẽn');
    expect(container.textContent).toContain('3. Tiến độ Cung ứng & Mua sắm');
    expect(container.textContent).toContain('4. Tồn kho Dự Án Thực Tế');
    expect(container.textContent).toContain('5. Tài chính & Ngân Sách Dự Toán (WBS Financials)');
    expect(container.textContent).toContain('80%');
    expect(container.textContent).toContain('Nguyễn Văn Hùng');
    expect(container.textContent).toContain('Phạm Thị Lan');

    const urgentBadge = Array.from(container.querySelectorAll('span')).find(
      el => el.textContent?.trim() === 'Khẩn cấp',
    );
    expect(urgentBadge?.className).toContain('bg-[var(--md-error)]');
    expect(urgentBadge?.className).toContain('text-[var(--md-on-error)]');

    const mediumBadge = Array.from(container.querySelectorAll('span')).find(
      el => el.textContent?.trim() === 'Trung bình',
    );
    expect(mediumBadge?.className).toContain('bg-[var(--md-warning-container)]');
    expect(mediumBadge?.className).toContain('text-[var(--md-on-warning-container)]');
  });

  it('renders empty state when there are no active projects', async () => {
    vi.mocked(projectsService.listPurchasingProgress).mockResolvedValue([]);
    vi.mocked(projectsService.list).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 200,
      totalPages: 0,
    });

    await renderPage(() => (container.textContent?.includes('Vui lòng chọn một dự án') ?? false));

    expect(container.textContent).toContain('Vui lòng chọn một dự án để xem bức tranh điều hành 360°.');
  });

  it('renders tonal retry button on top-level load error and refetches on click', async () => {
    vi.mocked(projectsService.listPurchasingProgress).mockResolvedValue([]);
    vi.mocked(projectsService.list)
      .mockRejectedValueOnce(new Error('Lỗi tải danh sách dự án'))
      .mockResolvedValueOnce({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 200,
        totalPages: 0,
      });

    await renderPage(() => Boolean(container.querySelector('[role="alert"] button')));

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Không tải được dữ liệu tổng quan. Vui lòng thử lại.');
    const retryBtn = alert?.querySelector('button');
    expect(retryBtn?.className).toContain('btn-tonal');

    await act(async () => {
      retryBtn?.click();
    });
    await waitFor(() => (container.textContent?.includes('Vui lòng chọn một dự án') ?? false));

    expect(projectsService.list).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('Vui lòng chọn một dự án để xem bức tranh điều hành 360°.');
  });
});
