import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOperationsDashboard } from '../../hooks/useOperationsDashboard';
import OperationsDashboardPage from './OperationsDashboardPage';

vi.mock('../../hooks/useOperationsDashboard', () => ({
  useOperationsDashboard: vi.fn(),
}));

const baseResult: ReturnType<typeof useOperationsDashboard> = {
  isBootLoading: false,
  isError: false,
  error: null,
  refetchAll: vi.fn(),
  activeProjects: [
    {
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
      scMembers: 'Trần Minh Tuấn',
      stockActualQty: 120,
      stockPlannedQty: 200,
      stockReservedQty: 20,
      stockMaterialCount: 10,
      approvedImportValue: 400_000_000,
      materialBudgetRemaining: 1_100_000_000,
      warehouseKeepers: [],
    },
    {
      projectCode: 'DA-LT-02',
      projectName: 'Nhà ga T3 Tân Sơn Nhất - Gói MEP',
      projectType: 'EPC',
      pmId: '00000000-0000-0000-0000-000000000000',
      pmName: 'Kho hàng',
      startDate: '2026-05-01',
      endDate: null,
      materialBudget: 900_000_000,
      status: 'Active',
      clientName: 'Tổng công ty Cảng HKVN',
      scMembers: null,
      stockActualQty: 45,
      stockPlannedQty: 120,
      stockReservedQty: 0,
      stockMaterialCount: 6,
      approvedImportValue: 200_000_000,
      materialBudgetRemaining: 700_000_000,
      warehouseKeepers: [],
    },
  ],
  lowStock: [],
  stockPreview: [
    {
      projectCode: 'DA-RM2-01',
      projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
      materialCode: 'VT-THEP-D16',
      materialName: 'Thép thanh vằn D16 CB400-V',
      unit: 'Cây',
      actualQty: 0,
      minStockQty: 50,
      shortageQty: 50,
    },
    {
      projectCode: 'DA-LT-02',
      projectName: 'Nhà ga T3 Tân Sơn Nhất - Gói MEP',
      materialCode: 'VT-XIMANG-PCB40',
      materialName: 'Xi măng Hà Tiên PCB40',
      unit: 'Bao',
      actualQty: 12,
      minStockQty: 40,
      shortageQty: 28,
    },
  ],
  openOrderRows: [
    {
      code: 'PO-2026-011',
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
    },
  ],
  pendingPaymentRows: [
    {
      code: 'DNTT-2026-009',
      poCode: 'PO-2026-011',
      stageNumber: 1,
      supplierId: 12,
      supplierName: 'Công ty CP Thép Hòa Phát Dung Quất',
      amount: 140_000_000,
      dueDate: '2026-11-30',
      status: 'submitted',
      createdAt: '2026-11-15T08:00:00Z',
    },
  ],
  counts: {
    projectActive: 2,
    projectClosed: 1,
    projectTotal: 3,
    projectWithPm: 1,
    projectWithoutPm: 1,
    projectWithSc: 1,
    projectWithKeeper: 0,
    stockBelowMin: 2,
    stockZero: 1,
    stockProjects: 2,
    orderNone: 1,
    orderPartial: 0,
    planCount: 4,
    paymentDraft: 0,
    paymentSubmitted: 1,
    paymentPaid: 2,
    poOverdue: 0,
    poUnpaid: 1,
    poPartialPay: 0,
    arrivalOverdue: 0,
    arrivalDueToday: 1,
    arrivalUpcoming: 3,
    materialActive: 18,
    materialInactive: 2,
    materialTotal: 20,
  },
};

describe('OperationsDashboardPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  async function renderPage() {
    await act(async () => {
      root.render(createElement(MemoryRouter, null, createElement(OperationsDashboardPage)));
    });
  }

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();
    vi.mocked(useOperationsDashboard).mockReturnValue(baseResult);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('renders PageShell, 8 KPI cards, 4 TableShell boards, and interactive filter tabs', async () => {
    await renderPage();

    expect(container.querySelector('.erp-page-shell--list.operations-dashboard')).not.toBeNull();
    expect(container.querySelectorAll('.dashboard-kpi-grid [role="listitem"]')).toHaveLength(8);
    expect(container.querySelectorAll('.ops-projects-board')).toHaveLength(4);
    expect(container.querySelectorAll('.erp-table-shell table.wms-inventory-table')).toHaveLength(4);
    expect(container.querySelector('table.project-warehouse-table')).not.toBeNull();

    // Link action buttons preserve .btn-outlined + .ops-projects__add and remove legacy .btn-secondary
    expect(container.querySelectorAll('a.btn.btn-outlined.ops-projects__add')).toHaveLength(4);
    expect(container.querySelectorAll('button.btn-secondary')).toHaveLength(0);

    // PM sanitization on project board
    expect(container.textContent).toContain('Nguyễn Văn Hùng');
    expect(container.textContent).toContain('Chưa phân công PM');

    // Filter stock board to 'Hết tồn'
    const zeroTab = Array.from(
      container.querySelectorAll('[role="tablist"][aria-label="Lọc tồn thấp"] button'),
    ).find(b => b.textContent === 'Hết tồn') as HTMLButtonElement;
    await act(async () => {
      zeroTab.click();
    });
    expect(container.textContent).toContain('VT-THEP-D16');
    expect(container.textContent).not.toContain('VT-XIMANG-PCB40');

    // Filter project board to 'Chưa gán PM'
    const boards = container.querySelectorAll('.ops-projects-board');
    const projectBoard = boards[3];
    const noPmTab = Array.from(
      projectBoard.querySelectorAll('[role="tablist"][aria-label="Lọc phân công"] button'),
    ).find(b => b.textContent === 'Chưa gán PM') as HTMLButtonElement;
    await act(async () => {
      noPmTab.click();
    });
    expect(projectBoard.textContent).toContain('DA-LT-02');
    expect(projectBoard.textContent).not.toContain('DA-RM2-01');
  });

  it('renders PageShell and tonal retry button on error state', async () => {
    const refetchAll = vi.fn();
    vi.mocked(useOperationsDashboard).mockReturnValue({
      ...baseResult,
      isError: true,
      error: new Error('Lỗi kết nối tổng quan'),
      refetchAll,
    });

    await renderPage();

    expect(container.querySelector('.erp-page-shell--list.operations-dashboard')).not.toBeNull();
    const retryBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('Thử lại'),
    );
    expect(retryBtn?.className).toContain('btn-tonal');

    await act(async () => {
      retryBtn?.click();
    });
    expect(refetchAll).toHaveBeenCalledTimes(1);
  });
});
