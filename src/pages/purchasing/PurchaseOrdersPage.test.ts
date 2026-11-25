import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsService } from '../../services/projectsService';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import type { PurchaseOrderApiDto } from '../../types/api/purchasingApi';
import PurchaseOrdersPage from './PurchaseOrdersPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/purchaseOrdersService', () => ({
  purchaseOrdersService: {
    list: vi.fn(),
    approve: vi.fn(),
    unapprove: vi.fn(),
    place: vi.fn(),
  },
}));

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    has: () => true,
    hasAny: () => true,
    hasAll: () => true,
  }),
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const sampleProjects = [
  {
    projectCode: 'DA-CRM2',
    projectName: 'Cầu Rạch Miễu 2',
    projectType: 'EPC',
    pmId: 'pm-1',
    pmName: 'Nguyễn Hữu Phước',
    startDate: '2026-01-10T00:00:00Z',
    endDate: null,
    materialBudget: 2_000_000_000,
    status: 'Active',
    clientName: 'Ban QLDA Mỹ Thuận',
    scMembers: null,
    stockActualQty: 0,
    stockPlannedQty: 0,
    stockReservedQty: 0,
    stockMaterialCount: 0,
    approvedImportValue: 500_000_000,
    materialBudgetRemaining: 1_500_000_000,
    warehouseKeepers: [],
    stage: null,
  },
];

const sampleOrders: PurchaseOrderApiDto[] = [
  {
    code: 'PO-2026-041',
    planCode: 'KHMH-2026-015',
    projectCode: 'DA-CRM2',
    projectName: 'Cầu Rạch Miễu 2',
    supplierId: 1,
    supplierName: 'Công ty Cổ phần Thép Hòa Phát',
    orderDate: '2026-11-12',
    createdAt: '2026-11-12T08:30:00Z',
    totalAmount: 350_000_000,
    approvalStatus: 'draft',
    orderPlacementStatus: 'not_placed',
    deliveryStatus: 'none',
    paymentStatus: 'unpaid',
    paymentWarning: false,
    note: 'Giao tại bãi đúc dầm',
    supplierPaymentTermsDays: 30,
  },
  {
    code: 'PO-2026-042',
    planCode: 'MHPS-2026-004',
    projectCode: 'DA-CRM2',
    projectName: 'Cầu Rạch Miễu 2',
    supplierId: 2,
    supplierName: 'Công ty TNHH Xi măng Hà Tiên',
    orderDate: '2026-11-14',
    createdAt: '2026-11-14T10:15:00Z',
    totalAmount: 185_000_000,
    approvalStatus: 'approved',
    orderPlacementStatus: 'placed',
    deliveryStatus: 'partial',
    paymentStatus: 'overdue',
    paymentWarning: true,
    note: 'Đợt 2 xi măng PCB40',
    supplierPaymentTermsDays: 15,
    approvedByName: 'Trần Văn Minh',
    approvedAt: '2026-11-14T11:00:00Z',
  },
];

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function setSelectValue(el: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('PurchaseOrdersPage characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{} as DOMRect] as unknown as DOMRectList);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 24,
      y: 120,
      top: 120,
      left: 24,
      right: 344,
      bottom: 160,
      width: 320,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });

    vi.mocked(projectsService.list).mockResolvedValue({
      items: sampleProjects as never,
      totalCount: sampleProjects.length,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });
    vi.mocked(purchaseOrdersService.list).mockResolvedValue({
      items: sampleOrders,
      totalCount: sampleOrders.length,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    });
    vi.mocked(purchaseOrdersService.approve).mockResolvedValue({
      ...sampleOrders[0],
      approvalStatus: 'approved',
      lines: [],
    } as never);

    client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    client.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function flush(ms = 40) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, ms));
    });
  }

  async function renderPage() {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(MemoryRouter, null, createElement(PurchaseOrdersPage)),
        ),
      );
    });
    await flush();
  }

  it('renders PO list, filters by text/selects, and shows project budget hint banner', async () => {
    await renderPage();

    expect(container.textContent).toContain('PO-2026-041');
    expect(container.textContent).toContain('Công ty Cổ phần Thép Hòa Phát');
    expect(container.textContent).toContain('PO-2026-042');
    expect(container.textContent).toContain('Trần Văn Minh');
    expect(container.textContent).toContain('Có cảnh báo');

    const supplierInput = container.querySelector('input[aria-label="Lọc nhà cung cấp"]') as HTMLInputElement;
    const planInput = container.querySelector('input[aria-label="Lọc mã KHMH"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(supplierInput, 'Hòa Phát');
      setInputValue(planInput, 'KHMH-2026-015');
    });
    await flush(420);

    const placementSelect = container.querySelector('select[aria-label="Lọc trạng thái đặt"]') as HTMLSelectElement;
    const deliverySelect = container.querySelector('select[aria-label="Lọc trạng thái giao"]') as HTMLSelectElement;
    const paymentSelect = container.querySelector('select[aria-label="Lọc tình trạng thanh toán"]') as HTMLSelectElement;
    const warningSelect = container.querySelector('select[aria-label="Lọc đơn đang có cảnh báo thanh toán"]') as HTMLSelectElement;

    await act(async () => {
      setSelectValue(placementSelect, 'placed');
      setSelectValue(deliverySelect, 'partial');
      setSelectValue(paymentSelect, 'overdue');
      setSelectValue(warningSelect, 'true');
    });
    await flush();

    expect(purchaseOrdersService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: 'Hòa Phát',
        planCode: 'KHMH-2026-015',
        orderPlacementStatus: 'placed',
        deliveryStatus: 'partial',
        paymentStatus: 'overdue',
        paymentWarning: true,
      }),
    );

    // Project selection shows budget hint banner
    const projectCombobox = container.querySelector('input[placeholder="Mã / tên dự án"]') as HTMLInputElement;
    await act(async () => {
      projectCombobox.focus();
      setInputValue(projectCombobox, 'DA-CRM2');
    });
    const projectOpt = [...document.body.querySelectorAll('[role="option"]')].find(
      el => el.textContent?.includes('DA-CRM2'),
    ) as HTMLElement;
    expect(projectOpt).toBeTruthy();
    await act(async () => {
      projectOpt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });
    await flush();

    expect(container.textContent).toContain('Ngân sách:');
    expect(container.textContent).toContain('2.000.000.000');
    expect(container.textContent).toContain('1.500.000.000');
  });

  it('approves PO without triggering row navigation, and navigates when clicking PO row', async () => {
    await renderPage();

    const approveBtn = container.querySelector('button[aria-label="Duyệt PO PO-2026-041"]') as HTMLButtonElement;
    expect(approveBtn).not.toBeNull();
    await act(async () => {
      approveBtn.click();
    });
    await flush();

    expect(purchaseOrdersService.approve).toHaveBeenCalledWith('PO-2026-041');
    expect(mockNavigate).not.toHaveBeenCalled();

    const firstRow = container.querySelectorAll('tbody tr')[0] as HTMLTableRowElement;
    await act(async () => {
      firstRow.click();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/purchasing/orders/PO-2026-041');
  });
});
