import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { purchasePlansService } from '../../services/purchasePlansService';
import type { PurchasePlanDetailApiDto } from '../../types/api/purchasingApi';
import PurchasePlanDetailPage from './PurchasePlanDetailPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/purchasePlansService', () => ({
  purchasePlansService: {
    getByCode: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
    approveL1: vi.fn(),
    approveL2: vi.fn(),
    reject: vi.fn(),
    remake: vi.fn(),
    lookupSupplierMaterialRisks: vi.fn(),
  },
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    has: () => true,
    hasAny: () => true,
    hasAll: () => true,
  }),
}));

vi.mock('../../components/purchasing/CreatePurchasePlanModal', () => ({
  default: ({ open, editCode }: { open: boolean; editCode?: string | null }) =>
    open ? createElement('div', { 'data-testid': 'edit-plan-modal' }, `Edit:${editCode ?? ''}`) : null,
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

function makePlanDetail(overrides: Partial<PurchasePlanDetailApiDto> = {}): PurchasePlanDetailApiDto {
  return {
    code: 'KHMH-2026-014',
    projectCode: 'DA-NHONTRACH-03',
    projectName: 'Nhà máy Nhiệt điện Nhơn Trạch 3',
    createdAt: '2026-11-10T08:00:00Z',
    updatedAt: '2026-11-10T09:00:00Z',
    budgetTotal: 185_000_000,
    proposalTotal: 172_500_000,
    purchaseTotal: 168_000_000,
    paidTotal: 84_000_000,
    status: 'draft',
    kind: 'plan',
    note: 'Cấp thép kết cấu đợt 1',
    createdByName: 'Nguyễn Thị Lan Anh',
    lines: [
      {
        id: 101,
        lineNo: 1,
        systemName: 'Hệ kết cấu thép',
        category: 'Thép hình',
        materialCode: 'VT-THEP-I300',
        productName: 'Thép hình I300x150x6.5x9',
        spec: 'SS400 · dài 12m',
        description: 'Cột chính nhà turbine',
        unit: 'Cây',
        quantity: 20,
        kgPerUnit: 440,
        lineNote: 'Giao tại cổng số 2',
        purchaseStatus: 'Đã đặt hàng',
        budgetUnitPrice: 6_500_000,
        budgetAmount: 130_000_000,
        proposalUnitPrice: 6_100_000,
        proposalSupplierName: 'Công ty Thép Hòa Phát',
        proposalAmount: 122_000_000,
        purchaseUnitPrice: 6_000_000,
        purchaseSupplierName: 'Công ty Thép Hòa Phát',
        purchaseAmount: 120_000_000,
        selectedSupplierName: 'Công ty Thép Hòa Phát',
        selectedUnitPrice: 6_000_000,
        selectionReason: 'Đạt chuẩn CO/CQ và tiến độ nhanh',
        orderedQty: 20,
        receivedQty: 12,
        defectQty: 1,
        remainingOrderableQty: 0,
        expectedDeliveryDate: '2026-11-25',
        actualReceiptDate: '2026-11-22',
        quotes: [
          {
            id: 1,
            sortOrder: 1,
            unitPrice: 6_000_000,
            supplierName: 'Công ty Thép Hòa Phát',
            note: 'Bao vận chuyển',
          },
          {
            id: 2,
            sortOrder: 2,
            unitPrice: 6_250_000,
            supplierName: 'Công ty Thép Pomina',
            note: 'Giao sau 7 ngày',
          },
        ],
        pos: [
          { poCode: 'PO-2026-041', orderedQty: 12, receivedQty: 12 },
          { poCode: 'PO-2026-042', orderedQty: 8, receivedQty: 0 },
        ],
      },
      {
        id: 102,
        lineNo: 2,
        systemName: 'Hệ đường ống',
        category: 'Van công nghiệp',
        materialCode: 'VT-VAN-DN100',
        productName: 'Van cổng mặt bích DN100 PN16',
        spec: 'Gang dẻo JIS 10K',
        unit: 'Cái',
        quantity: 10,
        kgPerUnit: 28,
        budgetUnitPrice: 5_500_000,
        budgetAmount: 55_000_000,
        proposalUnitPrice: 5_050_000,
        proposalSupplierName: 'Công ty Thiết bị Minh Hòa',
        proposalAmount: 50_500_000,
        purchaseUnitPrice: 4_800_000,
        purchaseSupplierName: 'Công ty Thiết bị Minh Hòa',
        purchaseAmount: 48_000_000,
        selectedSupplierName: 'Công ty Thiết bị Minh Hòa',
        selectedUnitPrice: 4_800_000,
        orderedQty: 10,
        receivedQty: 0,
        defectQty: 0,
        remainingOrderableQty: 0,
        quotes: [],
        pos: [{ poCode: 'PO-2026-043', orderedQty: 10, receivedQty: 0 }],
      },
    ],
    relatedOrders: [
      {
        code: 'PO-2026-041',
        supplierName: 'Công ty Thép Hòa Phát',
        totalAmount: 72_000_000,
        approvalStatus: 'approved',
        orderPlacementStatus: 'placed',
        deliveryStatus: 'partial',
        paymentStatus: 'partial',
        itemCount: 1,
        createdAt: '2026-11-12T08:30:00Z',
      },
    ],
    ...overrides,
  };
}

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  vi.mocked(purchasePlansService.lookupSupplierMaterialRisks).mockResolvedValue([
    {
      materialCode: 'VT-THEP-I300',
      supplierName: 'Công ty Thép Hòa Phát',
      warn: true,
      reasons: ['Tỷ lệ giao hàng trễ 20% trong quý trước'],
    } as never,
  ]);
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  client.clear();
  vi.unstubAllGlobals();
});

async function flushQueries() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 60));
  });
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 60));
  });
}

async function renderPlanDetail(initialPath = '/purchasing/plans/KHMH-2026-014') {
  const pattern = initialPath.startsWith('/purchasing/adhoc')
    ? '/purchasing/adhoc/:code'
    : '/purchasing/plans/:code';
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          MemoryRouter,
          { initialEntries: [initialPath] },
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: pattern,
              element: createElement(PurchasePlanDetailPage),
            }),
          ),
        ),
      ),
    );
  });
  await flushQueries();
}

function findButtonByText(rootEl: ParentNode, text: string): HTMLButtonElement {
  const buttons = Array.from(rootEl.querySelectorAll('button'));
  const found = buttons.find(b => b.textContent?.includes(text));
  if (!found) {
    throw new Error(`Button containing "${text}" not found`);
  }
  return found;
}

describe('PurchasePlanDetailPage characterization', () => {
  it('renders header, totals strip, risk banner, related POs, lines table, and toggles LineQuotes and LinePoCell', async () => {
    vi.mocked(purchasePlansService.getByCode).mockResolvedValue(makePlanDetail());
    await renderPlanDetail();

    expect(container.querySelector('.page-header__title')?.textContent?.trim()).toBe('KHMH-2026-014');
    expect(container.textContent).toContain('Nhà máy Nhiệt điện Nhơn Trạch 3');
    expect(container.textContent).toContain('Nguyễn Thị Lan Anh');
    expect(container.textContent).toContain('Cấp thép kết cấu đợt 1');

    // Totals strip
    const totalsText = container.querySelector('.pur-detail__totals')?.textContent ?? '';
    expect(totalsText).toContain('Dự toán');
    expect(totalsText).toContain('Đề xuất');
    expect(totalsText).toContain('Mua hàng');
    expect(totalsText).toContain('Tổng chi');

    // Risk banner
    const riskSection = container.querySelector('.pur-create-plan__risk-list');
    expect(riskSection?.textContent).toContain('Cảnh báo NCC Công ty Thép Hòa Phát / VT-THEP-I300');
    expect(riskSection?.textContent).toContain('Tỷ lệ giao hàng trễ 20% trong quý trước');

    // Related POs card
    expect(container.textContent).toContain('Đơn mua hàng liên quan (1)');
    expect(container.textContent).toContain('PO-2026-041');

    // Lines table (31 columns)
    const headerCols = container.querySelectorAll('.pur-detail__lines-table thead th');
    expect(headerCols.length).toBe(31);
    expect(container.textContent).toContain('Thép hình I300x150x6.5x9');
    expect(container.textContent).toContain('Van cổng mặt bích DN100 PN16');
    expect(container.textContent).toContain('PO-2026-043');

    // Toggle LineQuotes ("2 báo giá")
    const quoteToggle = findButtonByText(container, '2 báo giá');
    expect(quoteToggle.getAttribute('aria-expanded')).toBe('false');
    act(() => {
      quoteToggle.click();
    });
    expect(quoteToggle.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('Công ty Thép Pomina');
    expect(container.textContent).toContain('Bao vận chuyển');

    // Toggle LinePoCell ("2 PO")
    const poToggle = findButtonByText(container, '2 PO');
    expect(poToggle.getAttribute('aria-expanded')).toBe('false');
    act(() => {
      poToggle.click();
    });
    expect(poToggle.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('PO-2026-042');
    expect(container.textContent).toContain('12 đặt (12 nhận)');
  });

  it('supports draft actions: opens edit modal on Chỉnh sửa and calls submit on Gửi duyệt', async () => {
    const plan = makePlanDetail({ status: 'draft' });
    vi.mocked(purchasePlansService.getByCode).mockResolvedValue(plan);
    vi.mocked(purchasePlansService.submit).mockResolvedValue({ ...plan, status: 'pending_l1' });
    await renderPlanDetail();

    const editBtn = findButtonByText(container, 'Chỉnh sửa');
    act(() => {
      editBtn.click();
    });
    expect(container.querySelector('[data-testid="edit-plan-modal"]')?.textContent).toBe('Edit:KHMH-2026-014');

    const submitBtn = findButtonByText(container, 'Gửi duyệt');
    await act(async () => {
      submitBtn.click();
    });
    await flushQueries();
    expect(purchasePlansService.submit).toHaveBeenCalledWith('KHMH-2026-014');
  });

  it('supports pending_l1 actions: Duyệt cấp 1 and Từ chối dialog with reason', async () => {
    const plan = makePlanDetail({ status: 'pending_l1' });
    vi.mocked(purchasePlansService.getByCode).mockResolvedValue(plan);
    vi.mocked(purchasePlansService.approveL1).mockResolvedValue({ ...plan, status: 'pending_l2' });
    vi.mocked(purchasePlansService.reject).mockResolvedValue({ ...plan, status: 'rejected' });
    await renderPlanDetail();

    const approveL1Btn = findButtonByText(container, 'Duyệt cấp 1');
    await act(async () => {
      approveL1Btn.click();
    });
    await flushQueries();
    expect(purchasePlansService.approveL1).toHaveBeenCalledWith('KHMH-2026-014');

    const rejectBtn = findButtonByText(container, 'Từ chối');
    act(() => {
      rejectBtn.click();
    });
    const dialog = document.body.querySelector('[role="alertdialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain('Từ chối duyệt?');

    const textarea = dialog?.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      setter?.call(textarea, 'Đơn giá thép vượt khung dự toán 12%');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const confirmRejectBtn = findButtonByText(dialog!, 'Từ chối');
    await act(async () => {
      confirmRejectBtn.click();
    });
    await flushQueries();
    expect(purchasePlansService.reject).toHaveBeenCalledWith('KHMH-2026-014', {
      reason: 'Đơn giá thép vượt khung dự toán 12%',
    });
  });

  it('supports pending_l2 action: Duyệt cấp 2', async () => {
    const plan = makePlanDetail({ status: 'pending_l2' });
    vi.mocked(purchasePlansService.getByCode).mockResolvedValue(plan);
    vi.mocked(purchasePlansService.approveL2).mockResolvedValue({ ...plan, status: 'approved' });
    await renderPlanDetail();

    const approveL2Btn = findButtonByText(container, 'Duyệt cấp 2');
    await act(async () => {
      approveL2Btn.click();
    });
    await flushQueries();
    expect(purchasePlansService.approveL2).toHaveBeenCalledWith('KHMH-2026-014');
  });

  it('supports approved action: Đóng kế hoạch dialog confirms closing', async () => {
    const plan = makePlanDetail({ status: 'approved' });
    vi.mocked(purchasePlansService.getByCode).mockResolvedValue(plan);
    vi.mocked(purchasePlansService.update).mockResolvedValue({ ...plan, status: 'closed' });
    await renderPlanDetail();

    const closeBtn = findButtonByText(container, 'Đóng kế hoạch');
    act(() => {
      closeBtn.click();
    });

    const dialog = document.body.querySelector('[role="alertdialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain('Đóng kế hoạch mua hàng');

    const confirmCloseBtn = findButtonByText(dialog!, 'Đóng');
    await act(async () => {
      confirmCloseBtn.click();
    });
    await flushQueries();
    expect(purchasePlansService.update).toHaveBeenCalledWith('KHMH-2026-014', { status: 'closed' });
  });

  it('prefixes header title with KHMH only when code does not already begin with KHMH', async () => {
    vi.mocked(purchasePlansService.getByCode).mockResolvedValue(makePlanDetail({ code: '2026-014' }));
    await renderPlanDetail('/purchasing/plans/2026-014');

    expect(container.querySelector('.page-header__title')?.textContent?.trim()).toBe('KHMH 2026-014');
  });

  it('paginates PurchasePlanDetailLinesTable when a KHMH has more than 15 lines', async () => {
    const manyLines = Array.from({ length: 22 }, (_, index) => {
      const n = index + 1;
      return {
        id: 200 + n,
        lineNo: n,
        systemName: 'Hệ kết cấu thép',
        category: 'Thép hình',
        materialCode: `VT-THEP-${String(n).padStart(3, '0')}`,
        productName: `Thép hình H${200 + n} tiêu chuẩn`,
        spec: 'SS400',
        unit: 'Cây',
        quantity: 10 + n,
        kgPerUnit: 120,
        budgetUnitPrice: 1_500_000,
        budgetAmount: (10 + n) * 1_500_000,
        orderedQty: 0,
        receivedQty: 0,
        defectQty: 0,
        remainingOrderableQty: 10 + n,
        quotes: [],
        pos: [],
      };
    });

    vi.mocked(purchasePlansService.getByCode).mockResolvedValue(makePlanDetail({ lines: manyLines }));
    await renderPlanDetail();

    const getBodyRows = () => container.querySelectorAll('.pur-detail__lines-table tbody tr');
    const getPaginationCount = () => container.querySelector('.pagination-bar__count')?.textContent?.trim();

    // Initially renders 15 rows (1–15 / 22 mặt hàng), shows page 1 & page 2 buttons, does NOT render row 16 yet
    expect(getBodyRows().length).toBe(15);
    expect(getPaginationCount()).toBe('1–15 / 22 mặt hàng');
    expect(container.querySelector('button[aria-label="Trang 1"]')).toBeTruthy();
    const page2Btn = container.querySelector('button[aria-label="Trang 2"]') as HTMLButtonElement | null;
    expect(page2Btn).toBeTruthy();
    expect(container.textContent).toContain('Thép hình H215 tiêu chuẩn');
    expect(container.textContent).not.toContain('Thép hình H216 tiêu chuẩn');

    // Clicking Trang 2 renders rows 16–22 (16–22 / 22 mặt hàng)
    act(() => {
      page2Btn!.click();
    });
    expect(getBodyRows().length).toBe(7);
    expect(getPaginationCount()).toBe('16–22 / 22 mặt hàng');
    expect(container.textContent).toContain('Thép hình H216 tiêu chuẩn');
    expect(container.textContent).toContain('Thép hình H222 tiêu chuẩn');
    expect(container.textContent).not.toContain('Thép hình H201 tiêu chuẩn');

    // Changing page size select (#pagination-page-size) to 25 shows all 22 rows (1–22 / 22 mặt hàng)
    const sizeSelect = container.querySelector('#pagination-page-size') as HTMLSelectElement | null;
    expect(sizeSelect).toBeTruthy();
    act(() => {
      sizeSelect!.value = '25';
      sizeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(getBodyRows().length).toBe(22);
    expect(getPaginationCount()).toBe('1–22 / 22 mặt hàng');
    expect(container.textContent).toContain('Thép hình H201 tiêu chuẩn');
    expect(container.textContent).toContain('Thép hình H222 tiêu chuẩn');
  });
});
