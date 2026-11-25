import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import { purchasePaymentPlansService } from '../../services/purchasePaymentPlansService';
import { purchasePaymentsService } from '../../services/purchasePaymentsService';
import type {
  PurchaseOrderApiDto,
  PurchaseOrderDetailApiDto,
  PurchasePaymentApiDto,
  PurchasePaymentNextStageApiDto,
} from '../../types/api/purchasingApi';
import PurchasePaymentDetailPage from './PurchasePaymentDetailPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/purchasePaymentsService', () => ({
  purchasePaymentsService: {
    list: vi.fn(),
    getByCode: vi.fn(),
    create: vi.fn(),
    submit: vi.fn(),
    pay: vi.fn(),
    cancel: vi.fn(),
  },
}));

vi.mock('../../services/purchasePaymentPlansService', () => ({
  purchasePaymentPlansService: {
    list: vi.fn(),
    getNextStage: vi.fn(),
  },
}));

vi.mock('../../services/purchaseOrdersService', () => ({
  purchaseOrdersService: {
    list: vi.fn(),
    getByCode: vi.fn(),
  },
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    has: () => true,
    hasAny: () => true,
    hasAll: () => true,
  }),
}));

vi.mock('../../constants/systemUsers', () => ({
  getSessionUser: () => ({
    id: 'usr-cungung-01',
    username: 'nguyenvanhoang',
    name: 'Nguyễn Văn Hoàng',
    role: 'purchasing',
  }),
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const sampleOrders: PurchaseOrderApiDto[] = [
  {
    code: 'PO-2026-041',
    planCode: 'KHMH-2026-014',
    projectCode: 'DA-NHONTRACH-03',
    projectName: 'Nhà máy Nhiệt điện Nhơn Trạch 3',
    supplierId: 12,
    supplierName: 'Công ty Cổ phần Thép Hòa Phát',
    orderDate: '2026-11-10',
    createdAt: '2026-11-10T08:00:00Z',
    totalAmount: 300_000_000,
    approvalStatus: 'approved',
    orderPlacementStatus: 'placed',
    deliveryStatus: 'partial',
    paymentStatus: 'unpaid',
    paymentWarning: false,
    supplierPaymentTermsDays: 30,
  },
];

const sampleOrderDetail: PurchaseOrderDetailApiDto = {
  code: 'PO-2026-041',
  planCode: 'KHMH-2026-014',
  projectCode: 'DA-NHONTRACH-03',
  projectName: 'Nhà máy Nhiệt điện Nhơn Trạch 3',
  supplierId: 12,
  supplierName: 'Công ty Cổ phần Thép Hòa Phát',
  orderDate: '2026-11-10',
  createdAt: '2026-11-10T08:00:00Z',
  updatedAt: '2026-11-12T09:00:00Z',
  totalAmount: 300_000_000,
  approvalStatus: 'approved',
  orderPlacementStatus: 'placed',
  deliveryStatus: 'partial',
  paymentStatus: 'unpaid',
  paymentWarning: false,
  note: 'Giao đợt 1 theo tiến độ',
  supplierPaymentTermsDays: 30,
  paymentDueDate: '2026-12-10',
  createdByName: 'Nguyễn Văn Hoàng',
  lines: [
    {
      id: 1,
      materialCode: 'VT-THEP-I300',
      sku: 'THEP-I300',
      name: 'Thép hình I300x150x6.5x9',
      unit: 'Cây',
      ordered: 50,
      received: 25,
      poPrice: 6_000_000,
      estPrice: 6_500_000,
      lineAmount: 300_000_000,
      warrantyMonths: 12,
      warrantyAnchorType: 'delivery',
    },
  ],
  installments: [
    {
      id: 1,
      stageNumber: 1,
      percent: 50,
      status: 'pending',
      requiredDocTypes: ['HD', 'BBGH'],
      documents: [],
    },
    {
      id: 2,
      stageNumber: 2,
      percent: 50,
      status: 'pending',
      requiredDocTypes: ['BBNT'],
      documents: [],
    },
  ],
};

function makePayment(overrides: Partial<PurchasePaymentApiDto> = {}): PurchasePaymentApiDto {
  return {
    code: 'DNTT-2026-009',
    poCode: 'PO-2026-041',
    stageNumber: 1,
    supplierId: 12,
    supplierName: 'Công ty Cổ phần Thép Hòa Phát',
    invoiceNo: 'HD-2611-088',
    amount: 150_000_000,
    dueDate: '2026-12-10',
    status: 'draft',
    note: 'Thanh toán đợt 1 hợp đồng thép I300',
    createdAt: '2026-11-15T08:30:00Z',
    createdByName: 'Nguyễn Văn Hoàng',
    ...overrides,
  };
}

function setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function findButtonByText(rootEl: ParentNode, text: string): HTMLButtonElement {
  const found = Array.from(rootEl.querySelectorAll('button')).find(b => b.textContent?.includes(text));
  if (!found) throw new Error(`Button containing "${text}" not found`);
  return found;
}

let root: Root;
let container: HTMLDivElement;
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

  vi.mocked(purchaseOrdersService.list).mockResolvedValue({
    items: sampleOrders,
    totalCount: sampleOrders.length,
    page: 1,
    pageSize: 200,
    totalPages: 1,
  });
  vi.mocked(purchaseOrdersService.getByCode).mockResolvedValue(sampleOrderDetail);
  vi.mocked(purchasePaymentsService.list).mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  });

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
  vi.restoreAllMocks();
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

async function renderPaymentPage(initialEntry: string) {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          MemoryRouter,
          { initialEntries: [initialEntry] },
          createElement(
            Routes,
            null,
            createElement(Route, {
              path: '/purchasing/payments/new',
              element: createElement(PurchasePaymentDetailPage),
            }),
            createElement(Route, {
              path: '/purchasing/payments/:code',
              element: createElement(PurchasePaymentDetailPage),
            }),
          ),
        ),
      ),
    );
  });
  await flushQueries();
}

describe('PurchasePaymentDetailPage characterization', () => {
  it('create mode: PO selection hydrates stage banner, amount, and blocks save on missing-doc gate banner', async () => {
    const blockedStage: PurchasePaymentNextStageApiDto = {
      poCode: 'PO-2026-041',
      stageNumber: 1,
      totalStages: 2,
      percent: 50,
      amount: 150_000_000,
      poTotalAmount: 300_000_000,
      missingDocTypes: ['HD', 'BBGH'],
    };
    vi.mocked(purchasePaymentPlansService.getNextStage).mockResolvedValue(blockedStage);

    await renderPaymentPage('/purchasing/payments/new');

    const poInput = container.querySelector('input[placeholder="Tìm mã PO, NCC hoặc KHMH…"]') as HTMLInputElement;
    expect(poInput).toBeTruthy();

    await act(async () => {
      poInput.focus();
      setInputValue(poInput, 'PO-2026-041');
    });

    const option = [...document.body.querySelectorAll('[role="option"]')].find(el =>
      el.textContent?.includes('PO-2026-041'),
    ) as HTMLElement;
    expect(option).toBeTruthy();

    await act(async () => {
      option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });
    await flushQueries();

    expect(container.textContent).toContain('Đợt 1/2');
    expect(container.textContent).toContain('50% giá trị PO');

    const amountInput = container.querySelector('input[aria-label="Số tiền đề nghị"]') as HTMLInputElement;
    expect(amountInput.value).toBe('150.000.000');

    expect(container.textContent).toContain('Chưa đủ chứng từ đợt 1');
    expect(container.textContent).toContain('Thiếu: HD, BBGH');

    const saveBtn = findButtonByText(container, 'Lưu DNTT');
    expect(saveBtn.disabled).toBe(true);
  });

  it('create mode: allows saving DNTT when docs gate is satisfied', async () => {
    const readyStage: PurchasePaymentNextStageApiDto = {
      poCode: 'PO-2026-041',
      stageNumber: 1,
      totalStages: 2,
      percent: 50,
      amount: 150_000_000,
      poTotalAmount: 300_000_000,
      missingDocTypes: [],
    };
    vi.mocked(purchasePaymentPlansService.getNextStage).mockResolvedValue(readyStage);
    vi.mocked(purchasePaymentsService.create).mockResolvedValue(makePayment({ code: 'DNTT-2026-015' }));

    await renderPaymentPage('/purchasing/payments/new?po=PO-2026-041');

    const invoiceInput = container.querySelector('input[aria-label="Số hóa đơn NCC"]') as HTMLInputElement;
    const noteInput = container.querySelector('textarea[aria-label="Nội dung ghi chú trên giấy"]') as HTMLTextAreaElement;

    await act(async () => {
      setInputValue(invoiceInput, 'HD-2611-099');
      setInputValue(noteInput, 'Thanh toán đợt 1 theo biên bản giao hàng');
    });

    const saveBtn = findButtonByText(container, 'Lưu DNTT');
    expect(saveBtn.disabled).toBe(false);

    await act(async () => {
      saveBtn.click();
    });
    await flushQueries();

    expect(purchasePaymentsService.create).toHaveBeenCalledWith({
      poCode: 'PO-2026-041',
      invoiceNo: 'HD-2611-099',
      amount: 150_000_000,
      dueDate: '2026-12-10',
      note: 'Thanh toán đợt 1 theo biên bản giao hàng',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/purchasing/payments/DNTT-2026-015', { replace: true });
  });

  it('detail mode: hydrates draft payment, renders DnttVoucherPreview, and submits draft', async () => {
    const draftPayment = makePayment({ status: 'draft' });
    vi.mocked(purchasePaymentsService.getByCode).mockResolvedValue(draftPayment);
    vi.mocked(purchasePaymentsService.submit).mockResolvedValue({ ...draftPayment, status: 'submitted' });

    await renderPaymentPage('/purchasing/payments/DNTT-2026-009');

    expect(container.textContent).toContain('DNTT DNTT-2026-009');
    expect(container.textContent).toContain('Đợt 1');
    expect(container.textContent).toContain('DNTT gắn đợt thanh toán số 1 của PO-2026-041');

    const invoiceInput = container.querySelector('input[aria-label="Số hóa đơn NCC"]') as HTMLInputElement;
    const amountInput = container.querySelector('input[aria-label="Số tiền đề nghị"]') as HTMLInputElement;
    expect(invoiceInput.value).toBe('HD-2611-088');
    expect(amountInput.value).toBe('150.000.000');

    // DnttVoucherPreview rendered
    const previewArticle = container.querySelector('article.dntt05');
    expect(previewArticle).toBeTruthy();
    expect(previewArticle?.textContent).toContain('GIẤY ĐỀ NGHỊ THANH TOÁN');
    expect(previewArticle?.textContent).toContain('Công ty Cổ phần Thép Hòa Phát');
    expect(previewArticle?.textContent).toContain('Thép hình I300x150x6.5x9');
    expect(previewArticle?.textContent).toContain('150.000.000 đ');

    const submitBtn = findButtonByText(container, 'Gửi đề nghị');
    await act(async () => {
      submitBtn.click();
    });
    await flushQueries();

    expect(purchasePaymentsService.submit).toHaveBeenCalledWith('DNTT-2026-009');
  });

  it('detail mode: submitted payment supports Ghi nhận đã thanh toán and Hủy đề nghị', async () => {
    const submittedPayment = makePayment({ status: 'submitted' });
    vi.mocked(purchasePaymentsService.getByCode).mockResolvedValue(submittedPayment);
    vi.mocked(purchasePaymentsService.pay).mockResolvedValue({ ...submittedPayment, status: 'paid' });
    vi.mocked(purchasePaymentsService.cancel).mockResolvedValue({ ...submittedPayment, status: 'cancelled' });

    await renderPaymentPage('/purchasing/payments/DNTT-2026-009');

    const payBtn = findButtonByText(container, 'Ghi nhận đã thanh toán');
    await act(async () => {
      payBtn.click();
    });
    await flushQueries();
    expect(purchasePaymentsService.pay).toHaveBeenCalledWith('DNTT-2026-009');

    const cancelBtn = findButtonByText(container, 'Hủy đề nghị');
    await act(async () => {
      cancelBtn.click();
    });
    await flushQueries();
    expect(purchasePaymentsService.cancel).toHaveBeenCalledWith('DNTT-2026-009');
  });
});
