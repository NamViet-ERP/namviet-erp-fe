import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { categoriesService } from '../../services/categoriesService';
import { materialsService } from '../../services/materialsService';
import { projectsService } from '../../services/projectsService';
import { purchaseEstimatesService } from '../../services/purchaseEstimatesService';
import { purchaseRfqService } from '../../services/purchaseRfqService';
import { suppliersService } from '../../services/suppliersService';
import { showToast } from '../../components/ui/Toast';
import type { PurchaseEstimateListItemApiDto } from '../../types/api/purchasingApi';
import type { WarehouseProjectApiDto } from '../../types/wms';
import PurchaseEstimateProcurementPage from './PurchaseEstimateProcurementPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/purchaseEstimatesService', () => ({
  purchaseEstimatesService: {
    list: vi.fn(),
    create: vi.fn(),
    submitApproval: vi.fn(),
    approveL1: vi.fn(),
    reject: vi.fn(),
    convertPlan: vi.fn(),
  },
}));

vi.mock('../../services/purchaseRfqService', () => ({
  purchaseRfqService: {
    list: vi.fn(),
    averages: vi.fn(),
    winRates: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../services/materialsService', () => ({
  materialsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../services/categoriesService', () => ({
  categoriesService: {
    getTree: vi.fn(),
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

const sampleProjects: WarehouseProjectApiDto[] = [
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
  {
    projectCode: 'DA-DUNGQUAT-02',
    projectName: 'Mở rộng Nhà máy Lọc dầu Dung Quất',
    projectType: 'EPC',
    pmId: '22222222-2222-2222-2222-222222222222',
    pmName: 'Lê Hoàng Nam',
    startDate: '2026-02-01',
    endDate: '2026-11-30',
    materialBudget: 200_000_000,
    status: 'active',
    clientName: 'Công ty Cổ phần Lọc hóa dầu Bình Sơn',
    stockActualQty: 0,
    stockPlannedQty: 0,
    stockReservedQty: 0,
    stockMaterialCount: 0,
    approvedImportValue: 220_000_000,
    materialBudgetRemaining: -20_000_000,
  },
];

const sampleEstimates: PurchaseEstimateListItemApiDto[] = [
  {
    id: 'est-01',
    code: 'DT-2026-018',
    projectCode: 'DA-NHONTRACH-03',
    title: 'Dự toán ống thép tuyến hơi chính',
    status: 'draft',
    currentVersion: 1,
    filledLineCount: 2,
    lineCount: 2,
    createdAt: '2026-11-10T08:00:00Z',
    createdByName: 'Nguyễn Thị Mai Anh',
    updatedAt: '2026-11-10T09:00:00Z',
    updatedByName: 'Nguyễn Thị Mai Anh',
  },
  {
    id: 'est-02',
    code: 'DT-2026-019',
    projectCode: 'DA-NHONTRACH-03',
    title: 'Dự toán cụm van điều khiển DN150',
    status: 'pending_approval',
    currentVersion: 2,
    filledLineCount: 3,
    lineCount: 3,
    createdAt: '2026-11-11T08:00:00Z',
    createdByName: 'Nguyễn Thị Mai Anh',
    updatedAt: '2026-11-11T10:00:00Z',
    updatedByName: 'Nguyễn Thị Mai Anh',
  },
  {
    id: 'est-03',
    code: 'DT-2026-020',
    projectCode: 'DA-DUNGQUAT-02',
    title: 'Dự toán phụ kiện mặt bích PN16',
    status: 'approved',
    currentVersion: 1,
    filledLineCount: 1,
    lineCount: 1,
    createdAt: '2026-11-12T08:00:00Z',
    createdByName: 'Phạm Quốc Hưng',
    updatedAt: '2026-11-12T11:00:00Z',
    updatedByName: 'Trần Minh Đức',
  },
];

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function findButton(rootEl: ParentNode, text: string): HTMLButtonElement {
  const btn = Array.from(rootEl.querySelectorAll('button')).find(
    b => b.textContent?.trim() === text || b.textContent?.includes(text),
  );
  if (!btn) throw new Error(`Button containing "${text}" not found`);
  return btn;
}

async function selectComboboxOption(input: HTMLInputElement, optionMatch: string) {
  await act(async () => {
    input.focus();
  });
  const option = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')].find(el =>
    el.textContent?.includes(optionMatch),
  );
  expect(option, `Option matching "${optionMatch}" should exist`).toBeDefined();
  await act(async () => {
    option!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  });
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

  vi.mocked(purchaseEstimatesService.list).mockResolvedValue({
    items: sampleEstimates,
    totalCount: sampleEstimates.length,
    page: 1,
    pageSize: 15,
    totalPages: 1,
  });
  vi.mocked(purchaseRfqService.list).mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 15,
    totalPages: 1,
  });
  vi.mocked(purchaseRfqService.averages).mockResolvedValue([]);
  vi.mocked(purchaseRfqService.winRates).mockResolvedValue([]);
  vi.mocked(projectsService.list).mockResolvedValue({
    items: sampleProjects,
    totalCount: sampleProjects.length,
    page: 1,
    pageSize: 200,
    totalPages: 1,
  });
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
      {
        materialCode: 'VT-VAN-DN150',
        materialName: 'Van bướm tay gạt DN150 PN16',
        categoryId: 1,
        isConsumable: false,
        unit: 'Cái',
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
    totalCount: 2,
    page: 1,
    pageSize: 500,
    totalPages: 1,
  });
  vi.mocked(categoriesService.getTree).mockResolvedValue([
    { id: 1, code: 'PIPE', name: 'Hệ ống thép', level: 1, parentId: null, sortOrder: 1, isActive: true },
  ]);
  vi.mocked(suppliersService.list).mockResolvedValue({
    items: [],
    totalCount: 0,
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

async function renderPage(initialEntry = '/operations/estimate-procurement') {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          MemoryRouter,
          { initialEntries: [initialEntry] },
          createElement(PurchaseEstimateProcurementPage),
        ),
      ),
    );
  });
  await flushQueries();
}

describe('PurchaseEstimateProcurementPage characterization', () => {
  it('switches between Dự toán (estimates) and Giá chào thầu (rfq) tabs with matching header actions', async () => {
    await renderPage();

    expect(container.querySelector('.page-header__title')?.textContent?.trim()).toBe('Mua hàng dự toán');
    expect(findButton(container, 'Tạo dự toán')).toBeTruthy();

    const rfqTab = [...container.querySelectorAll<HTMLButtonElement>('.tab-filter__tab')].find(
      b => b.textContent?.trim() === 'Giá chào thầu',
    );
    expect(rfqTab).toBeDefined();

    await act(async () => {
      rfqTab!.click();
    });
    await flushQueries();

    expect(findButton(container, 'Xuất CSV')).toBeTruthy();
    expect(findButton(container, 'Ghi nhận báo giá mới')).toBeTruthy();
    expect(container.textContent).toContain('Chưa có báo giá phù hợp bộ lọc.');

    const estTab = [...container.querySelectorAll<HTMLButtonElement>('.tab-filter__tab')].find(
      b => b.textContent?.trim() === 'Dự toán',
    );
    await act(async () => {
      estTab!.click();
    });
    await flushQueries();

    expect(container.textContent).toContain('DT-2026-018');
  });

  it('filters by project and displays toolbar budget bar calculation + reset', async () => {
    await renderPage();

    const projectFilterInput = container.querySelector<HTMLInputElement>('input[placeholder="Lọc dự án"]');
    expect(projectFilterInput).not.toBeNull();

    await selectComboboxOption(projectFilterInput!, 'DA-NHONTRACH-03');
    await flushQueries();

    expect(purchaseEstimatesService.list).toHaveBeenCalledWith(
      expect.objectContaining({ projectCode: 'DA-NHONTRACH-03' }),
    );
    expect(container.textContent).toContain('Ngân sách VT:');
    expect(container.textContent).toContain('500.000.000\u00a0đ');
    expect(container.textContent).toContain('150.000.000\u00a0đ');

    const resetBtn = findButton(container, 'Xóa lọc');
    await act(async () => {
      resetBtn.click();
    });
    await flushQueries();

    expect(container.textContent).not.toContain('Ngân sách VT:');
  });

  it('opens Create Estimate modal, validates inputs, adds/removes lines, warns on over-budget, and submits', async () => {
    vi.mocked(purchaseEstimatesService.create).mockResolvedValue({
      id: 'est-new-01',
      code: 'DT-2026-021',
      projectCode: 'DA-NHONTRACH-03',
      title: 'Nhà máy Nhiệt điện Nhơn Trạch 3',
      status: 'draft',
      currentVersion: 1,
      viewedVersion: 1,
      createdAt: '2026-11-25T10:00:00Z',
      createdByName: 'Nguyễn Thị Mai Anh',
      updatedAt: '2026-11-25T10:00:00Z',
      updatedByName: 'Nguyễn Thị Mai Anh',
      versions: [],
      lines: [],
      proposals: [],
      approvals: [],
    });

    await renderPage();

    await act(async () => {
      findButton(container, 'Tạo dự toán').click();
    });

    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).not.toBeNull();

    // 1. Empty project validation
    const submitBtn = findButton(dialog, 'Tạo dự toán');
    await act(async () => {
      submitBtn.click();
    });
    expect(showToast).toHaveBeenCalledWith('error', 'Chọn dự án.');

    // 2. Select project -> empty material validation
    const modalProjectInput = dialog.querySelector<HTMLInputElement>('input[placeholder="Chọn dự án…"]')!;
    await selectComboboxOption(modalProjectInput, 'DA-NHONTRACH-03');
    expect(dialog.textContent).toContain('Ngân sách dự toán vật tư:');
    expect(dialog.textContent).toContain('150.000.000\u00a0đ');

    await act(async () => {
      submitBtn.click();
    });
    expect(showToast).toHaveBeenCalledWith('error', 'Thêm ít nhất một vật tư.');

    // 3. Pick material -> zero qty/price validation
    const matInput1 = dialog.querySelector<HTMLInputElement>('input[placeholder="Gõ mã hoặc tên vật tư…"]')!;
    await selectComboboxOption(matInput1, 'VT-ONG-DN100');

    await act(async () => {
      submitBtn.click();
    });
    expect(showToast).toHaveBeenCalledWith('error', 'Mỗi dòng phải có số lượng và giá dự toán lớn hơn 0.');

    // 4. Add second line and remove it
    const addLineBtn = findButton(dialog, 'Thêm vật tư');
    await act(async () => {
      addLineBtn.click();
    });
    expect(dialog.querySelectorAll('tbody tr').length).toBe(2);

    const deleteLine2Btn = dialog.querySelector<HTMLButtonElement>('button[aria-label="Xóa dòng 2"]')!;
    await act(async () => {
      deleteLine2Btn.click();
    });
    expect(dialog.querySelectorAll('tbody tr').length).toBe(1);

    // 5. Enter qty + unit price exceeding remaining budget -> shows warning banner
    const qtyInput = dialog.querySelector<HTMLInputElement>('input[aria-label="Số lượng dòng 1"]')!;
    const priceInputs = dialog.querySelectorAll<HTMLInputElement>('tbody input[inputmode="numeric"]');
    const priceInput = priceInputs[0];

    await act(async () => {
      setInputValue(qtyInput, '200');
      setInputValue(priceInput, '1000000');
    });

    expect(dialog.textContent).toContain('Cảnh báo: Giá trị mua sắm (200.000.000\u00a0đ) vượt quá ngân sách còn lại!');
    expect(dialog.textContent).toContain('1 dòng · Tổng 200.000.000 VNĐ');

    // 6. Submit creation
    await act(async () => {
      submitBtn.click();
    });
    await flushQueries();

    expect(purchaseEstimatesService.create).toHaveBeenCalledWith({
      projectCode: 'DA-NHONTRACH-03',
      title: 'Nhà máy Nhiệt điện Nhơn Trạch 3',
      lines: [
        {
          materialCode: 'VT-ONG-DN100',
          newQty: 200,
          estimateUnitPrice: 1_000_000,
        },
      ],
    });
    expect(showToast).toHaveBeenCalledWith('success', 'Đã tạo DT-2026-021.');
    expect(mockNavigate).toHaveBeenCalledWith('/purchasing/estimate-procurement/est-new-01');
  });

  it('triggers row action menu items for draft, pending_approval, and approved estimates', async () => {
    vi.mocked(purchaseEstimatesService.submitApproval).mockResolvedValue({} as never);
    vi.mocked(purchaseEstimatesService.approveL1).mockResolvedValue({} as never);
    vi.mocked(purchaseEstimatesService.reject).mockResolvedValue({} as never);
    vi.mocked(purchaseEstimatesService.convertPlan).mockResolvedValue({ planCode: 'KHMH-2026-088' });

    await renderPage();

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    // Draft row -> Gửi duyệt
    const draftTrigger = findButton(rows[0], 'Tác vụ');
    await act(async () => {
      draftTrigger.click();
    });
    const submitItem = [...document.body.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
      m => m.textContent?.includes('Gửi duyệt'),
    );
    expect(submitItem).toBeDefined();
    await act(async () => {
      submitItem!.click();
    });
    await flushQueries();
    expect(purchaseEstimatesService.submitApproval).toHaveBeenCalledWith('est-01');

    // Pending approval row -> Duyệt
    const pendingTrigger = findButton(rows[1], 'Tác vụ');
    await act(async () => {
      pendingTrigger.click();
    });
    const approveItem = [...document.body.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
      m => m.textContent?.trim() === 'Duyệt',
    );
    expect(approveItem).toBeDefined();
    await act(async () => {
      approveItem!.click();
    });
    await flushQueries();
    expect(purchaseEstimatesService.approveL1).toHaveBeenCalledWith('est-02', { note: undefined });

    // Approved row -> Tạo kế hoạch mua hàng
    const approvedTrigger = findButton(rows[2], 'Tác vụ');
    await act(async () => {
      approvedTrigger.click();
    });
    const convertItem = [...document.body.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
      m => m.textContent?.includes('Tạo kế hoạch mua hàng'),
    );
    expect(convertItem).toBeDefined();
    await act(async () => {
      convertItem!.click();
    });
    await flushQueries();
    expect(purchaseEstimatesService.convertPlan).toHaveBeenCalledWith('est-03');
  });
});
