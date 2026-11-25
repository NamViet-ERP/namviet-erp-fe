import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { purchasePriceBookService } from '../../services/purchasePriceBookService';
import {
  markupSettingsService,
  type MarkupSettingsConfig,
} from '../../services/markupSettingsService';
import { categoriesService } from '../../services/categoriesService';
import { materialsService } from '../../services/materialsService';
import { projectsService } from '../../services/projectsService';
import { showToast } from '../../components/ui/Toast';
import type {
  PriceBookCategoryRowApiDto,
  PriceBookEstimateRowApiDto,
  PriceBookItemApiDto,
  PriceBookItemDetailApiDto,
  PriceBookMarginRowApiDto,
  PriceBookMatrixApiDto,
} from '../../types/api/purchasingApi';
import type { SystemUser } from '../../types/systemUser';
import PurchasePriceBookPage from './PurchasePriceBookPage';

const mockSessionState = vi.fn<() => {
  user?: SystemUser;
  permissions: string[];
  refresh: () => void;
}>();

vi.mock('../../auth/AuthProvider', () => ({
  useSession: () => mockSessionState(),
}));

vi.mock('../../services/purchasePriceBookService', () => ({
  purchasePriceBookService: {
    items: vi.fn(),
    item: vi.fn(),
    matrix: vi.fn(),
    categories: vi.fn(),
    margins: vi.fn(),
    estimates: vi.fn(),
    upsertSellPrice: vi.fn(),
    upsertEstimatePrice: vi.fn(),
  },
}));

vi.mock('../../services/markupSettingsService', async () => {
  const actual = await vi.importActual<typeof import('../../services/markupSettingsService')>(
    '../../services/markupSettingsService',
  );
  return {
    ...actual,
    markupSettingsService: {
      get: vi.fn(),
      update: vi.fn(),
    },
  };
});

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

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('./RfqQuotesPanel', () => ({
  default: ({ presetMaterialCode }: { presetMaterialCode?: string }) =>
    createElement('div', { 'data-testid': 'rfq-quotes-panel' }, presetMaterialCode ?? ''),
}));

const mockItems: PriceBookItemApiDto[] = [
  {
    materialCode: 'VT-ONG-01',
    materialName: 'Ống thép đúc DN100',
    categoryId: 1,
    categoryName: 'Hệ ống thép',
    ceilingPrice: 1_200_000,
    abcClass: 'A',
    technicalSpec: 'DN100 SCH40',
    generalTechnicalSpec: 'ASTM A106 Gr.B',
    latestPrice: 1_000_000,
    latestDate: '2026-11-20',
    latestSupplierName: 'Thép Hòa Phát',
    minPrice: 950_000,
    maxPrice: 1_050_000,
    avgPrice: 1_000_000,
    supplierCount: 2,
    trendPct: 5,
    overCeiling: false,
    estimatePrice: 1_100_000,
    estimateDiff: -100_000,
    estimateDiffPct: -9.1,
    historyCount: 3,
  },
  {
    materialCode: 'VT-VAN-02',
    materialName: 'Van bướm tay gạt DN150',
    categoryId: 2,
    categoryName: 'Van công nghiệp',
    ceilingPrice: 2_000_000,
    abcClass: 'B',
    technicalSpec: 'DN150 PN16',
    generalTechnicalSpec: 'Gang dẻo EPDM',
    latestPrice: 2_200_000,
    latestDate: '2026-11-18',
    latestSupplierName: 'Van Minh Hòa',
    minPrice: 1_950_000,
    maxPrice: 2_200_000,
    avgPrice: 2_075_000,
    supplierCount: 3,
    trendPct: -3.5,
    overCeiling: true,
    estimatePrice: null,
    estimateDiff: null,
    estimateDiffPct: null,
    historyCount: 2,
  },
];

const mockDetail: PriceBookItemDetailApiDto = {
  item: mockItems[0],
  history: [
    {
      date: '2026-11-20',
      kind: 'po',
      status: null,
      supplierId: 10,
      supplierName: 'Thép Hòa Phát',
      unitPrice: 1_000_000,
      poRef: 'PO-2026-019',
      projectCode: 'DA-01',
    },
    {
      date: '2026-11-10',
      kind: 'estimate',
      status: null,
      supplierId: null,
      supplierName: null,
      unitPrice: 1_100_000,
      poRef: null,
      projectCode: 'DA-01',
    },
  ],
};

const mockEstimates: PriceBookEstimateRowApiDto[] = [
  {
    materialCode: 'VT-ONG-01',
    materialName: 'Ống thép đúc DN100',
    projectCode: 'DA-01',
    estimatePrice: 1_100_000,
    effectiveDate: '2026-11-01',
    purchaseLatest: 1_000_000,
    diff: -100_000,
    diffPct: -9.1,
    marginPct: 9.1,
    estimateHistoryCount: 2,
  },
];

const mockMargins: PriceBookMarginRowApiDto[] = [
  {
    materialCode: 'VT-ONG-01',
    materialName: 'Ống thép đúc DN100',
    projectCode: 'DA-01',
    sellPrice: 1_300_000,
    effectiveDate: '2026-11-01',
    purchaseAvg: 1_000_000,
    purchaseLatest: 1_000_000,
    margin: 300_000,
    marginPct: 23.1,
    sellHistoryCount: 1,
  },
];

const mockCategories: PriceBookCategoryRowApiDto[] = [
  {
    categoryId: 1,
    categoryCode: 'PIPE',
    categoryName: 'Hệ ống thép',
    itemCount: 4,
    supplierCount: 2,
    poCount: 5,
    totalSpend: 50_000_000,
    sharePct: 100,
  },
];

const mockMatrix: PriceBookMatrixApiDto = {
  categoryId: 1,
  categoryName: 'Hệ ống thép',
  rows: [
    {
      materialCode: 'VT-ONG-01',
      materialName: 'Ống thép đúc DN100',
      cells: [
        { supplierId: 10, supplierName: 'Thép Hòa Phát', unitPrice: 1_000_000, isMin: true },
        { supplierId: 11, supplierName: 'Thép Việt Đức', unitPrice: 1_080_000, isMin: false },
      ],
    },
  ],
};

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

  mockSessionState.mockReturnValue({
    user: {
      id: 'u-boss',
      username: 'director',
      name: 'Giám Đốc',
      initials: 'GD',
      role: 'director',
      roleLabel: 'Giám đốc',
      email: 'director@mayzer.vn',
      createdAt: '2026-01-01',
    },
    permissions: [
      'purchasing.pricebook.view',
      'purchasing.pricebook.update',
      'purchasing.rfq.create',
      'purchasing.rfq.update',
    ],
    refresh: vi.fn(),
  });

  let storedMarkup: MarkupSettingsConfig = {
    globalMarkupPercent: 10,
    categories: [{ id: 'PIPE', name: 'Hệ ống thép', percent: 15 }],
    itemOverrides: { 'VT-VAN-02': 20 },
  };
  vi.mocked(markupSettingsService.get).mockImplementation(async () => storedMarkup);
  vi.mocked(markupSettingsService.update).mockImplementation(async body => {
    storedMarkup = {
      globalMarkupPercent: body.globalMarkupPercent,
      categories: body.categories,
      itemOverrides: body.itemOverrides ?? {},
    };
    return storedMarkup;
  });

  vi.mocked(purchasePriceBookService.items).mockResolvedValue(mockItems);
  vi.mocked(purchasePriceBookService.item).mockResolvedValue(mockDetail);
  vi.mocked(purchasePriceBookService.estimates).mockResolvedValue(mockEstimates);
  vi.mocked(purchasePriceBookService.margins).mockResolvedValue(mockMargins);
  vi.mocked(purchasePriceBookService.categories).mockResolvedValue(mockCategories);
  vi.mocked(purchasePriceBookService.matrix).mockResolvedValue(mockMatrix);
  vi.mocked(purchasePriceBookService.upsertEstimatePrice).mockResolvedValue(undefined as never);
  vi.mocked(purchasePriceBookService.upsertSellPrice).mockResolvedValue(undefined as never);

  vi.mocked(categoriesService.getTree).mockResolvedValue([
    { id: 1, code: 'PIPE', name: 'Hệ ống thép', level: 1, parentId: null, sortOrder: 1, isActive: true },
    { id: 2, code: 'VALVE', name: 'Van công nghiệp', level: 1, parentId: null, sortOrder: 2, isActive: true },
  ]);
  vi.mocked(materialsService.list).mockResolvedValue({
    items: [
      {
        materialCode: 'VT-ONG-01',
        materialName: 'Ống thép đúc DN100',
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
  vi.mocked(projectsService.list).mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 200,
    totalPages: 1,
  });

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
  vi.unstubAllGlobals();
});

async function flushQueries() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 40));
  });
}

async function renderPage() {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(MemoryRouter, null, createElement(PurchasePriceBookPage)),
      ),
    );
  });
  await flushQueries();
}

function findButton(label: string): HTMLButtonElement | undefined {
  return [...document.querySelectorAll('button')].find(
    btn => btn.textContent?.trim() === label,
  );
}

async function clickTab(label: string) {
  const tabBtn = [...container.querySelectorAll<HTMLButtonElement>('.tab-filter__tab')].find(
    btn => btn.textContent?.trim() === label,
  );
  expect(tabBtn).toBeDefined();
  await act(async () => {
    tabBtn!.click();
  });
  await flushQueries();
}

describe('PurchasePriceBookPage Characterization', () => {
  it('renders heading/title and all 6 tabs', async () => {
    await renderPage();

    expect(container.querySelector('.page-header__eyebrow')?.textContent?.trim()).toBe(
      'Dự án EPC / Chào thầu',
    );
    expect(container.querySelector('.page-header__title')?.textContent?.trim()).toBe(
      'Sổ giá chào thầu & Phân tích',
    );

    const tabLabels = [...container.querySelectorAll('.tab-filter__tab')].map(el =>
      el.textContent?.trim(),
    );
    expect(tabLabels).toEqual([
      'Sổ giá theo mặt hàng',
      'So sánh giá NCC',
      'Giá chào thầu (RFQ)',
      'Phân tích theo nhóm hàng',
      'Giá dự toán & Chênh lệch',
      'Phân tích Mua vào - Bán ra',
    ]);
  });

  it('renders ItemsTable rows with markup EPC bidding price and opens detail history modal on row click', async () => {
    await renderPage();

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const row1 = rows[0] as HTMLTableRowElement;
    expect(row1.textContent).toContain('VT-ONG-01');
    expect(row1.textContent).toContain('Ống thép đúc DN100');
    expect(row1.textContent).toContain('1.000.000\u00a0đ');
    expect(row1.textContent).toContain('1.150.000\u00a0đ');
    expect(row1.textContent).toContain('(+15%)');

    const row2 = rows[1] as HTMLTableRowElement;
    expect(row2.textContent).toContain('VT-VAN-02');
    expect(row2.textContent).toContain('Van bướm tay gạt DN150');
    expect(row2.textContent).toContain('Vượt trần');
    expect(row2.textContent).toContain('2.200.000\u00a0đ');
    expect(row2.textContent).toContain('2.640.000\u00a0đ');
    expect(row2.textContent).toContain('(+20%)');

    await act(async () => {
      row1.click();
    });
    await flushQueries();

    expect(purchasePriceBookService.item).toHaveBeenCalledWith('VT-ONG-01');
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('VT-ONG-01 · Ống thép đúc DN100');
    expect(dialog?.textContent).toContain('Giá trần: 1.200.000\u00a0đ');
    expect(dialog?.textContent).toContain('PO-2026-019');
    expect(dialog?.textContent).toContain('Đã mua (PO)');

    const rfqAction = findButton('+ Ghi nhận báo giá mới');
    expect(rfqAction).toBeDefined();
    await act(async () => {
      rfqAction!.click();
    });
    await flushQueries();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[data-testid="rfq-quotes-panel"]')?.textContent).toBe(
      'VT-ONG-01',
    );
  });

  it('shows boss markup controls when boss/admin and saves inline item markup', async () => {
    await renderPage();

    const bossBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Cài Đặt Markup Quản Trị'),
    );
    expect(bossBtn).toBeDefined();

    await act(async () => {
      bossBtn!.click();
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    const closeMarkupBtn = document.querySelector<HTMLButtonElement>('[aria-label="Đóng"]');
    await act(async () => {
      closeMarkupBtn!.click();
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    const inlineEditBtn = container.querySelector<HTMLButtonElement>(
      'button[title="Bấm để chỉnh sửa nhanh % Markup riêng cho mặt hàng này"]',
    );
    expect(inlineEditBtn).toBeDefined();
    expect(inlineEditBtn?.textContent).toContain('(+15%)');

    await act(async () => {
      inlineEditBtn!.click();
    });

    // Stopping propagation ensures row click did not open detail modal
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    const input = container.querySelector<HTMLInputElement>('tbody input[type="number"]');
    expect(input).not.toBeNull();
    expect(input?.value).toBe('15');

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, '25');
      input!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveBtn = container.querySelector<HTMLButtonElement>('tbody button[title="Lưu"]');
    expect(saveBtn).not.toBeNull();
    await act(async () => {
      saveBtn!.click();
    });
    await flushQueries();

    expect(markupSettingsService.update).toHaveBeenCalledWith({
      globalMarkupPercent: 10,
      categories: [{ id: 'PIPE', name: 'Hệ ống thép', percent: 15 }],
      itemOverrides: { 'VT-VAN-02': 20, 'VT-ONG-01': 25 },
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã lưu Markup (+25%) cho mã VT-ONG-01');
    expect(container.querySelector('tbody')?.textContent).toContain('1.250.000\u00a0đ');
  });

  it('hides boss markup button and inline markup edit control for non-boss staff', async () => {
    mockSessionState.mockReturnValue({
      user: {
        id: 'u-staff',
        username: 'staff1',
        name: 'Nhân viên',
        initials: 'NV',
        role: 'staff',
        roleLabel: 'Nhân viên mua hàng',
        email: 'staff1@mayzer.vn',
        createdAt: '2026-01-01',
      },
      permissions: ['purchasing.pricebook.view'],
      refresh: vi.fn(),
    });

    await renderPage();

    const bossBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Cài Đặt Markup Quản Trị'),
    );
    expect(bossBtn).toBeUndefined();

    const inlineEditBtn = container.querySelector<HTMLButtonElement>(
      'button[title="Bấm để chỉnh sửa nhanh % Markup riêng cho mặt hàng này"]',
    );
    expect(inlineEditBtn).toBeNull();
    expect(container.querySelector('tbody')?.textContent).toContain('1.150.000\u00a0đ');
  });

  it('switches to estimates and margins tabs and renders KPIs, tables, and upsert modals', async () => {
    await renderPage();

    await clickTab('Giá dự toán & Chênh lệch');
    expect(container.textContent).toContain('Số mặt hàng đã có giá dự toán');
    expect(container.textContent).toContain('Biên lợi nhuận TB so với dự toán');
    expect(container.textContent).toContain('Mặt hàng đang mua vượt giá dự toán');
    expect(container.textContent).toContain('1.100.000\u00a0đ');
    expect(container.textContent).toContain('+9.1%');
    expect(container.textContent).toContain('Lịch sử (2)');
    expect(container.textContent).toContain('Mặt hàng đã có giá mua nhưng chưa thiết lập giá dự toán');
    expect(container.textContent).toContain('VT-VAN-02');

    const openEstimateBtn = findButton('+ Thiết lập giá dự toán');
    expect(openEstimateBtn).toBeDefined();
    await act(async () => {
      openEstimateBtn!.click();
    });
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Thiết lập giá dự toán');

    const closeEstimateBtn = document.querySelector<HTMLButtonElement>('[aria-label="Đóng"]');
    await act(async () => {
      closeEstimateBtn!.click();
    });

    await clickTab('Phân tích Mua vào - Bán ra');
    expect(container.textContent).toContain('Số mặt hàng đã có giá bán');
    expect(container.textContent).toContain('Margin trung bình');
    expect(container.textContent).toContain('Mặt hàng margin dưới 10%');
    expect(container.textContent).toContain('1.300.000\u00a0đ');
    expect(container.textContent).toContain('300.000\u00a0đ');
    expect(container.textContent).toContain('23.1%');
    expect(container.textContent).toContain('Lịch sử (1)');
    expect(container.textContent).toContain('Mặt hàng đã có giá mua nhưng chưa thiết lập giá bán');

    const openSellBtn = findButton('+ Thêm giá bán/giá chào');
    expect(openSellBtn).toBeDefined();
    await act(async () => {
      openSellBtn!.click();
    });
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      'Thêm giá bán / giá chào',
    );
  });

  it('switches to groups tab and jumps into matrix comparison', async () => {
    await renderPage();

    await clickTab('Phân tích theo nhóm hàng');
    expect(container.textContent).toContain('PIPE');
    expect(container.textContent).toContain('Hệ ống thép');
    expect(container.textContent).toContain('50.000.000\u00a0đ');
    expect(container.textContent).toContain('100%');

    const compareBtn = findButton('Xem so sánh NCC');
    expect(compareBtn).toBeDefined();
    await act(async () => {
      compareBtn!.click();
    });
    await flushQueries();

    expect(purchasePriceBookService.matrix).toHaveBeenCalledWith(1);
    expect(container.textContent).toContain('Thép Hòa Phát');
    expect(container.textContent).toContain('Thép Việt Đức');
    expect(container.textContent).toContain('1.000.000\u00a0đ ★');
  });

  it('edits and saves estimate and sell prices via modals', async () => {
    await renderPage();

    await clickTab('Giá dự toán & Chênh lệch');
    const editEstimateBtn = findButton('Sửa');
    expect(editEstimateBtn).toBeDefined();
    await act(async () => {
      editEstimateBtn!.click();
    });

    const saveEstimateBtn = findButton('Lưu');
    expect(saveEstimateBtn).toBeDefined();
    await act(async () => {
      saveEstimateBtn!.click();
    });
    await flushQueries();

    expect(purchasePriceBookService.upsertEstimatePrice).toHaveBeenCalledWith({
      materialCode: 'VT-ONG-01',
      projectCode: 'DA-01',
      estimatePrice: 1_100_000,
      effectiveDate: '2026-11-01',
      note: null,
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã ghi giá dự toán.');

    await clickTab('Phân tích Mua vào - Bán ra');
    const editSellBtn = findButton('Sửa');
    expect(editSellBtn).toBeDefined();
    await act(async () => {
      editSellBtn!.click();
    });

    const saveSellBtn = findButton('Lưu');
    expect(saveSellBtn).toBeDefined();
    await act(async () => {
      saveSellBtn!.click();
    });
    await flushQueries();

    expect(purchasePriceBookService.upsertSellPrice).toHaveBeenCalledWith({
      materialCode: 'VT-ONG-01',
      projectCode: 'DA-01',
      sellPrice: 1_300_000,
      effectiveDate: '2026-11-01',
      note: null,
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã ghi giá bán.');
  });
});
