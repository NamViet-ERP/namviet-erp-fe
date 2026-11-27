import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { categoriesService } from '../../services/categoriesService';
import { materialsService } from '../../services/materialsService';
import { projectsService } from '../../services/projectsService';
import { purchaseRfqService } from '../../services/purchaseRfqService';
import { suppliersService } from '../../services/suppliersService';
import { downloadCsv } from '../../lib/csvExport';
import { showToast } from '../../components/ui/Toast';
import type { PurchaseRfqQuoteApiDto } from '../../types/api/purchasingApi';
import type { SupplierApiDto } from '../../types/wms';
import RfqQuotesPanel from './RfqQuotesPanel';

vi.mock('../../services/purchaseRfqService', () => ({
  purchaseRfqService: {
    list: vi.fn(),
    averages: vi.fn(),
    winRates: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../services/categoriesService', () => ({
  categoriesService: {
    getTree: vi.fn(),
  },
}));

vi.mock('../../services/materialsService', () => ({
  materialsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../services/suppliersService', async () => {
  const actual = await vi.importActual<typeof import('../../services/suppliersService')>(
    '../../services/suppliersService',
  );
  return {
    ...actual,
    suppliersService: {
      ...actual.suppliersService,
      list: vi.fn(),
    },
  };
});

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../lib/csvExport', () => ({
  downloadCsv: vi.fn(),
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const sampleSuppliers: SupplierApiDto[] = [
  {
    id: 10,
    supplierCode: 'NCC-HOAPHAT',
    supplierName: 'Công ty Cổ phần Thép Hòa Phát',
    maxDebtDays: 30,
    rating: 'A',
    approvalStatus: 'approved',
    isBlacklisted: false,
    purchasedRevenue: 500_000_000,
    industryGroups: ['Thép & Đường ống'],
  },
  {
    id: 11,
    supplierCode: 'NCC-MINHHOA',
    supplierName: 'Công ty Cổ phần Đầu tư Van Minh Hòa',
    maxDebtDays: 30,
    rating: 'A',
    approvalStatus: 'approved',
    isBlacklisted: false,
    purchasedRevenue: 240_000_000,
    industryGroups: ['Van công nghiệp'],
  },
];

const sampleQuotes: PurchaseRfqQuoteApiDto[] = [
  {
    id: 'rfq-01',
    materialCode: 'VT-ONG-DN100',
    materialName: 'Ống thép đúc DN100 SCH40',
    supplierId: 10,
    supplierName: 'Công ty Cổ phần Thép Hòa Phát',
    projectCode: 'DA-NHONTRACH-03',
    quoteDate: '2026-11-10',
    unitPrice: 1_050_000,
    validUntil: '2026-12-15',
    leadTimeDays: 10,
    paymentTerm: 'Net 30',
    status: 'active',
    note: 'Giao tại chân công trình Nhơn Trạch',
  },
  {
    id: 'rfq-02',
    materialCode: 'VT-VAN-DN150',
    materialName: 'Van bướm tay gạt DN150 PN16',
    supplierId: 11,
    supplierName: 'Công ty Cổ phần Đầu tư Van Minh Hòa',
    projectCode: 'DA-NHONTRACH-03',
    quoteDate: '2026-11-05',
    unitPrice: 2_150_000,
    validUntil: '2026-12-01',
    leadTimeDays: 7,
    paymentTerm: 'Thanh toán 100% sau BBGH',
    status: 'won',
    note: null,
  },
];

function setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function selectHrmOption(ariaLabel: string, optionLabel: string) {
  const trigger = document.querySelector<HTMLButtonElement>(`button[role="combobox"][aria-label="${ariaLabel}"]`);
  expect(trigger, `HrmSelect "${ariaLabel}" should exist`).not.toBeNull();
  await act(async () => {
    trigger!.click();
  });
  const option = [...document.body.querySelectorAll<HTMLButtonElement>('[role="option"]')].find(el =>
    el.textContent?.includes(optionLabel),
  );
  expect(option, `Option "${optionLabel}" in "${ariaLabel}" should exist`).toBeDefined();
  await act(async () => {
    option!.click();
  });
}

async function selectComboboxOption(input: HTMLInputElement, optionMatch: string) {
  await act(async () => {
    input.focus();
  });
  const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(el =>
    el.textContent?.includes(optionMatch),
  );
  expect(option, `Combobox option "${optionMatch}" should exist`).toBeDefined();
  await act(async () => {
    option!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  });
}

async function pickDateInHrmPicker(triggerId: string, displayDdMmYyyy: string) {
  const trigger = document.getElementById(triggerId) as HTMLButtonElement | null;
  expect(trigger, `HrmDatePicker trigger #${triggerId} should exist`).not.toBeNull();
  await act(async () => {
    trigger!.click();
  });
  const popupId = trigger!.getAttribute('aria-controls');
  const popup = popupId ? document.getElementById(popupId) : null;
  expect(popup, `HrmDatePicker popup for #${triggerId} should open`).not.toBeNull();
  const quickInput = popup!.querySelector<HTMLInputElement>('input.hrm-date-picker__quick-input')!;
  await act(async () => {
    setInputValue(quickInput, displayDdMmYyyy);
  });
  const applyBtn = popup!.querySelector<HTMLButtonElement>('button.hrm-date-picker__quick-btn')!;
  await act(async () => {
    applyBtn.click();
  });
}

function findButton(rootEl: ParentNode, text: string): HTMLButtonElement {
  const btn = Array.from(rootEl.querySelectorAll('button')).find(
    b => b.textContent?.trim() === text || b.textContent?.includes(text),
  );
  if (!btn) throw new Error(`Button containing "${text}" not found`);
  return btn;
}

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
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

  vi.mocked(purchaseRfqService.list).mockResolvedValue({
    items: sampleQuotes,
    totalCount: sampleQuotes.length,
    page: 1,
    pageSize: 15,
    totalPages: 1,
  });
  vi.mocked(purchaseRfqService.averages).mockResolvedValue([
    { period: 'Q4/2026', year: 2026, quarter: 4, averagePrice: 1_600_000, quoteCount: 2 },
  ]);
  vi.mocked(purchaseRfqService.winRates).mockResolvedValue([
    { supplierId: 10, supplierName: 'Công ty Cổ phần Thép Hòa Phát', won: 3, total: 4, rate: 75 },
    { supplierId: 11, supplierName: 'Công ty Cổ phần Đầu tư Van Minh Hòa', won: 0, total: 2, rate: 0 },
  ]);
  vi.mocked(categoriesService.getTree).mockResolvedValue([
    { id: 1, code: 'PIPE', name: 'Hệ ống thép', level: 1, parentId: null, sortOrder: 1, isActive: true },
  ]);
  vi.mocked(materialsService.list).mockResolvedValue({
    items: [
      {
        materialCode: 'VT-ONG-DN100',
        materialName: 'Ống thép đúc DN100 SCH40',
        categoryId: 1,
        isConsumable: false,
        unit: 'Cây',
        isActive: true,
        categoryPath: {
          danhMuc: 'Hệ ống thép',
          nhomVatTu: null,
          loaiVatTu: null,
          phanLoai: null,
          kieu: null,
        },
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 500,
    totalPages: 1,
  });
  vi.mocked(suppliersService.list).mockResolvedValue({
    items: sampleSuppliers,
    totalCount: sampleSuppliers.length,
    page: 1,
    pageSize: 500,
    totalPages: 1,
  });
  vi.mocked(projectsService.list).mockResolvedValue({
    items: [
      {
        projectCode: 'DA-NHONTRACH-03',
        projectName: 'Nhà máy Nhiệt điện Nhơn Trạch 3',
        projectType: 'EPC',
        pmId: '11111111-1111-1111-1111-111111111111',
        pmName: 'Trần Minh Đức',
        startDate: '2026-01-15',
        endDate: '2026-12-30',
        materialBudget: 500_000_000,
        status: 'active',
        clientName: 'Tổng Công ty Điện lực Dầu khí',
        stockActualQty: 0,
        stockPlannedQty: 0,
        stockReservedQty: 0,
        stockMaterialCount: 0,
        approvedImportValue: 350_000_000,
        materialBudgetRemaining: 150_000_000,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 200,
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
}

async function renderPanel() {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(RfqQuotesPanel, { canWrite: true, canUpdate: true }),
      ),
    );
  });
  await flushQueries();
}

describe('RfqQuotesPanel characterization', () => {
  it('renders win-rate & average price chips and updates queries across supplier/status/groupBy/quarter/year filters', async () => {
    await renderPanel();

    expect(container.textContent).toContain('Công ty Cổ phần Thép Hòa Phát: 3/4 (75%)');
    expect(container.textContent).not.toContain('Công ty Cổ phần Đầu tư Van Minh Hòa: 0/2');
    expect(container.textContent).toContain('Q4/2026: 1.600.000\u00a0VNĐ (2 BG)');

    await selectHrmOption('Lọc theo NCC', 'Công ty Cổ phần Thép Hòa Phát');
    await flushQueries();
    expect(purchaseRfqService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ supplierId: 10, page: 1 }),
    );

    await selectHrmOption('Lọc theo trạng thái', 'Thắng thầu');
    await flushQueries();
    expect(purchaseRfqService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ supplierId: 10, status: 'won', page: 1 }),
    );

    await selectHrmOption('Quý', 'Quý 4');
    await flushQueries();
    expect(purchaseRfqService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ quarter: 4, page: 1 }),
    );

    await selectHrmOption('Gom giá TB', 'Theo năm');
    await flushQueries();
    expect(purchaseRfqService.averages).toHaveBeenLastCalledWith(
      'year',
      expect.objectContaining({ supplierId: 10, quarter: undefined }),
    );

    const prevYear = String(new Date().getFullYear() - 1);
    await selectHrmOption('Năm', prevYear);
    await flushQueries();
    expect(purchaseRfqService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ year: Number(prevYear), page: 1 }),
    );
  });

  it('validates create modal fields, creates new RFQ quote, and edits active quote', async () => {
    vi.mocked(purchaseRfqService.create).mockResolvedValue(sampleQuotes[0]);
    vi.mocked(purchaseRfqService.update).mockResolvedValue(sampleQuotes[0]);

    await renderPanel();

    // Open create modal
    await act(async () => {
      findButton(container, '+ Ghi nhận báo giá mới').click();
    });

    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Ghi nhận báo giá mới');

    // Validate empty submission
    await act(async () => {
      findButton(dialog, 'Lưu').click();
    });
    expect(dialog.textContent).toContain('Chọn nhóm vật tư.');
    expect(dialog.textContent).toContain('Chọn vật tư.');
    expect(dialog.textContent).toContain('Chọn nhà cung cấp.');
    expect(dialog.textContent).toContain('Chọn hạn giữ giá.');
    expect(dialog.textContent).toContain('Nhập đơn báo giá.');

    // Fill category, material, supplier, price, validUntil, leadTime, paymentTerm
    await selectHrmOption('Nhóm vật tư', 'PIPE - Hệ ống thép');
    await flushQueries();

    const matInput = dialog.querySelector<HTMLInputElement>('input[placeholder="Gõ mã hoặc tên vật tư…"]')!;
    await selectComboboxOption(matInput, 'VT-ONG-DN100');

    const supplierInput = dialog.querySelector<HTMLInputElement>('input[placeholder="Chọn nhà cung cấp…"]')!;
    await selectComboboxOption(supplierInput, 'Thép Hòa Phát');

    const priceInput = dialog.querySelector<HTMLInputElement>('input.currency-input-group__input')!;
    await act(async () => {
      setInputValue(priceInput, '1080000');
    });

    await pickDateInHrmPicker('rfq-quote-date', '25/11/2026');
    await pickDateInHrmPicker('rfq-valid-until', '31/12/2026');

    const leadTimeInput = dialog.querySelector<HTMLInputElement>('input[type="number"]')!;
    await act(async () => {
      setInputValue(leadTimeInput, '14');
    });

    await act(async () => {
      findButton(dialog, 'Lưu').click();
    });
    await flushQueries();

    expect(purchaseRfqService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        materialCode: 'VT-ONG-DN100',
        supplierId: 10,
        quoteDate: '2026-11-25',
        unitPrice: 1_080_000,
        validUntil: '2026-12-31',
        leadTimeDays: 14,
      }),
    );
    expect(showToast).toHaveBeenCalledWith('success', 'Đã ghi nhận báo giá.');

    // Open Edit modal on active quote (row 1)
    const rows = container.querySelectorAll('tbody tr');
    await act(async () => {
      findButton(rows[0], 'Tác vụ').click();
    });
    const editMenuItem = [...document.body.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
      m => m.textContent?.includes('Sửa báo giá'),
    );
    expect(editMenuItem).toBeDefined();
    await act(async () => {
      editMenuItem!.click();
    });
    await flushQueries();

    const editDialog = document.querySelector('[role="dialog"]')!;
    expect(editDialog.textContent).toContain('Sửa báo giá');
    const editPriceInput = editDialog.querySelector<HTMLInputElement>('input.currency-input-group__input')!;
    await act(async () => {
      setInputValue(editPriceInput, '1020000');
    });
    await act(async () => {
      findButton(editDialog, 'Lưu').click();
    });
    await flushQueries();

    expect(purchaseRfqService.update).toHaveBeenCalledWith(
      'rfq-01',
      expect.objectContaining({
        materialCode: 'VT-ONG-DN100',
        supplierId: 10,
        unitPrice: 1_020_000,
      }),
    );
    expect(showToast).toHaveBeenCalledWith('success', 'Đã cập nhật báo giá.');
  });

  it('marks quote won/lost and exports CSV via downloadCsv', async () => {
    vi.mocked(purchaseRfqService.update).mockResolvedValue({ ...sampleQuotes[0], status: 'won' });

    await renderPanel();

    const rows = container.querySelectorAll('tbody tr');
    await act(async () => {
      findButton(rows[0], 'Tác vụ').click();
    });
    const wonItem = [...document.body.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
      m => m.textContent?.includes('Thắng thầu'),
    );
    await act(async () => {
      wonItem!.click();
    });
    await flushQueries();

    expect(purchaseRfqService.update).toHaveBeenCalledWith(
      'rfq-01',
      expect.objectContaining({ status: 'won' }),
    );
    expect(showToast).toHaveBeenCalledWith('success', 'Đã đánh dấu thắng thầu.');

    await act(async () => {
      findButton(rows[0], 'Tác vụ').click();
    });
    const lostItem = [...document.body.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
      m => m.textContent?.includes('Thua thầu'),
    );
    await act(async () => {
      lostItem!.click();
    });
    await flushQueries();

    expect(purchaseRfqService.update).toHaveBeenCalledWith(
      'rfq-01',
      expect.objectContaining({ status: 'lost' }),
    );
    expect(showToast).toHaveBeenCalledWith('success', 'Đã đánh dấu thua thầu.');

    // Export CSV
    await act(async () => {
      findButton(container, 'Xuất CSV').click();
    });
    expect(downloadCsv).toHaveBeenCalledWith(
      'BaoGia_RFQ.csv',
      ['Ngày báo giá', 'Mã hàng', 'Tên hàng', 'Nhà cung cấp', 'Đơn giá', 'Hạn giữ giá', 'Thời gian giao hàng', 'Điều khoản thanh toán', 'Trạng thái'],
      [
        ['2026-11-10', 'VT-ONG-DN100', 'Ống thép đúc DN100 SCH40', 'Công ty Cổ phần Thép Hòa Phát', '1050000', '2026-12-15', '10', 'Net 30', 'Còn hiệu lực'],
        ['2026-11-05', 'VT-VAN-DN150', 'Van bướm tay gạt DN150 PN16', 'Công ty Cổ phần Đầu tư Van Minh Hòa', '2150000', '2026-12-01', '7', 'Thanh toán 100% sau BBGH', 'Thắng thầu'],
      ],
    );
  });
});
