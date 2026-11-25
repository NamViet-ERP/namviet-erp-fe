import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClientModule from '../../lib/apiClient';
import { stocktakesService } from '../../services/stocktakesService';
import { projectsService } from '../../services/projectsService';
import { materialsService } from '../../services/materialsService';
import { showToast } from '../../components/ui/Toast';
import type { Stocktake } from '../../types';
import type {
  MaterialApiDto,
  WarehouseProjectApiDto,
  WarehouseProjectInventoryApiDto,
} from '../../types/wms';
import StocktakeListPage from './StocktakeListPage';

vi.mock('../../services/stocktakesService', () => ({
  stocktakesService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    approve: vi.fn(),
  },
}));

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
    getInventory: vi.fn(),
  },
}));

vi.mock('../../services/materialsService', () => ({
  materialsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../auth/AuthProvider', () => ({
  useSession: () => ({
    user: { id: 'usr-wh-01', username: 'nguyenvanhung', role: 'admin' },
    permissions: ['wms.stocktakes.view', 'wms.stocktakes.create'],
    refresh: vi.fn(),
  }),
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const mockStocktakes: Stocktake[] = [
  {
    id: 'st-001',
    voucherCode: 'KK-2026-001',
    date: '15/11/2026',
    createdBy: 'Nguyễn Văn Hùng',
    status: 'pending',
    warehouseId: 'DA-2026-RM2',
    warehouseName: 'Dự án Cầu Rạch Miễu 2',
    condition: 'counting',
    isFrozen: true,
    note: 'Kiểm kê định kỳ thép hình tháng 11',
    items: [
      {
        productId: 'VT-THEP-001',
        sku: 'VT-THEP-001',
        name: 'Thép hình H300',
        systemQty: 50,
        actualQty: 48,
        diff: -2,
        reason: 'Cắt mẫu thử cơ lý',
      },
    ],
  },
  {
    id: 'st-002',
    voucherCode: 'KK-2026-002',
    date: '12/11/2026',
    createdBy: 'Trần Thị Mai',
    status: 'approved',
    warehouseId: 'DA-2026-LH30',
    warehouseName: 'Dự án Lò Hơi 30T',
    condition: 'completed',
    isFrozen: false,
    note: 'Đã đối soát tồn kho đầu kỳ',
    items: [
      {
        productId: 'VT-VAN-002',
        sku: 'VT-VAN-002',
        name: 'Van bi inox DN50',
        systemQty: 20,
        actualQty: 20,
        diff: 0,
      },
    ],
  },
  {
    id: 'st-003',
    voucherCode: 'KK-2026-003',
    date: '10/11/2026',
    createdBy: 'Lê Minh Tuấn',
    status: 'cancelled',
    warehouseId: 'DA-2026-CD1',
    warehouseName: 'Dự án Trạm Biến Áp Long An',
    condition: 'counting',
    isFrozen: false,
    note: 'Lập nhầm kho dự án',
    items: [],
  },
];

const mockProjects: WarehouseProjectApiDto[] = [
  {
    projectCode: 'DA-2026-RM2',
    projectName: 'Dự án Cầu Rạch Miễu 2',
    projectType: 'EPC',
    pmId: '00000000-0000-0000-0000-000000000001',
    pmName: 'Nguyễn Văn Hùng',
    startDate: '2026-01-10T00:00:00Z',
    endDate: null,
    materialBudget: 500000000,
    status: 'Active',
    clientName: 'Ban QLDA Mỹ Thuận',
    scMembers: null,
    stockActualQty: 70,
    stockPlannedQty: 70,
    stockReservedQty: 0,
    stockMaterialCount: 2,
    approvedImportValue: 350000000,
    materialBudgetRemaining: 150000000,
    warehouseKeepers: [],
    stage: null,
  },
  {
    projectCode: 'DA-2026-LH30',
    projectName: 'Dự án Lò Hơi 30T',
    projectType: 'EPC',
    pmId: '00000000-0000-0000-0000-000000000002',
    pmName: 'Trần Thị Mai',
    startDate: '2026-02-15T00:00:00Z',
    endDate: null,
    materialBudget: 300000000,
    status: 'Active',
    clientName: 'Công ty Nhiệt điện Duyên Hải',
    scMembers: null,
    stockActualQty: 20,
    stockPlannedQty: 20,
    stockReservedQty: 0,
    stockMaterialCount: 1,
    approvedImportValue: 180000000,
    materialBudgetRemaining: 120000000,
    warehouseKeepers: [],
    stage: null,
  },
];

const mockMaterials: MaterialApiDto[] = [
  {
    materialCode: 'VT-THEP-001',
    materialName: 'Thép hình H300',
    categoryId: 1,
    isConsumable: false,
    unit: 'Cây',
    origin: 'Hòa Phát • Việt Nam (ĐNA)',
    technicalSpec: 'H300x300x10x15',
    generalTechnicalSpec: null,
    qualityStandard: 'JIS G3101',
    isActive: true,
    categoryPath: {
      danhMuc: 'Thép kết cấu',
      nhomVatTu: 'Thép hình',
      loaiVatTu: 'H300',
      phanLoai: null,
      kieu: null,
    },
  },
  {
    materialCode: 'VT-VAN-002',
    materialName: 'Van bi inox DN50',
    categoryId: 2,
    isConsumable: false,
    unit: 'Cái',
    origin: 'Kitz • Nhật Bản (G7)',
    technicalSpec: 'DN50 PN16',
    generalTechnicalSpec: null,
    qualityStandard: 'JIS B2002',
    isActive: true,
    categoryPath: {
      danhMuc: 'Đường ống',
      nhomVatTu: 'Van công nghiệp',
      loaiVatTu: 'Van bi',
      phanLoai: null,
      kieu: null,
    },
  },
];

const mockProjectInventory: WarehouseProjectInventoryApiDto[] = [
  {
    projectCode: 'DA-2026-RM2',
    materialCode: 'VT-THEP-001',
    materialName: 'Thép hình H300',
    unit: 'Cây',
    plannedImportQty: 50,
    plannedExportQty: 0,
    actualImportQty: 50,
    actualExportQty: 0,
    actualInventoryQty: 50,
    plannedInventoryQty: 50,
    reservedQty: 0,
    minStockQty: 5,
    pendingDefectQty: 0,
    issuedFromPoQty: 0,
    issuedFromGeneralQty: 0,
  },
  {
    projectCode: 'DA-2026-RM2',
    materialCode: 'VT-VAN-002',
    materialName: 'Van bi inox DN50',
    unit: 'Cái',
    plannedImportQty: 20,
    plannedExportQty: 0,
    actualImportQty: 20,
    actualExportQty: 0,
    actualInventoryQty: 20,
    plannedInventoryQty: 20,
    reservedQty: 0,
    minStockQty: 2,
    pendingDefectQty: 0,
    issuedFromPoQty: 0,
    issuedFromGeneralQty: 0,
  },
];

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function setSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

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
        createElement(MemoryRouter, null, createElement(StocktakeListPage)),
      ),
    );
  });
  await flushQueries();
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();

  vi.mocked(stocktakesService.list).mockResolvedValue(mockStocktakes);
  vi.mocked(stocktakesService.create).mockResolvedValue({
    id: 'st-004',
    voucherCode: 'KK-2026-004',
    date: '26/11/2026',
    createdBy: 'Nguyễn Văn Hùng',
    status: 'pending',
    warehouseId: 'DA-2026-RM2',
    warehouseName: 'Dự án Cầu Rạch Miễu 2',
    condition: 'counting',
    isFrozen: true,
    note: 'Kiểm kê cuối tháng 11',
    items: [
      {
        productId: 'VT-THEP-001',
        sku: 'VT-THEP-001',
        name: 'Thép hình H300',
        systemQty: 50,
        actualQty: 55,
        diff: 5,
      },
    ],
  });
  vi.mocked(stocktakesService.approve).mockResolvedValue({
    ...mockStocktakes[0],
    status: 'approved',
    isFrozen: false,
  });
  vi.mocked(stocktakesService.update).mockResolvedValue({
    ...mockStocktakes[0],
    isFrozen: false,
  });

  vi.mocked(projectsService.list).mockResolvedValue({
    items: mockProjects,
    totalCount: mockProjects.length,
    page: 1,
    pageSize: 200,
    totalPages: 1,
  });
  vi.mocked(projectsService.getInventory).mockResolvedValue(mockProjectInventory);
  vi.mocked(materialsService.list).mockResolvedValue({
    items: mockMaterials,
    totalCount: mockMaterials.length,
    page: 1,
    pageSize: 500,
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

describe('StocktakeListPage characterization', () => {
  it('renders tabs with counts and table rows with voucher codes and freeze badges', async () => {
    await renderPage();

    const tabButtons = [...container.querySelectorAll('.tab-filter__tab')];
    expect(tabButtons.map(btn => btn.textContent?.trim())).toEqual([
      'Tất cả3',
      'Đã duyệt1',
      'Chưa duyệt1',
      'Đã hủy1',
    ]);

    const rows = [...container.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(3);

    expect(rows[0].textContent).toContain('KK-2026-001');
    expect(rows[0].textContent).toContain('Dự án Cầu Rạch Miễu 2');
    expect(rows[0].textContent).toContain('Đóng băng');

    expect(rows[1].textContent).toContain('KK-2026-002');
    expect(rows[1].textContent).toContain('Dự án Lò Hơi 30T');

    expect(rows[2].textContent).toContain('KK-2026-003');
  });

  it('switches tabs and filters rows by voucher code or warehouse search', async () => {
    await renderPage();

    const approvedTab = [...container.querySelectorAll('.tab-filter__tab')].find(btn =>
      btn.textContent?.includes('Đã duyệt'),
    ) as HTMLButtonElement;
    await act(async () => {
      approvedTab.click();
    });

    let rows = [...container.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('KK-2026-002');

    const allTab = [...container.querySelectorAll('.tab-filter__tab')].find(btn =>
      btn.textContent?.includes('Tất cả'),
    ) as HTMLButtonElement;
    await act(async () => {
      allTab.click();
    });

    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;
    expect(searchInput).not.toBeNull();
    await act(async () => {
      setInputValue(searchInput, 'Cầu Rạch Miễu 2');
    });

    rows = [...container.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('KK-2026-001');

    await act(async () => {
      setInputValue(searchInput, 'KK-2026-003');
    });

    rows = [...container.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('KK-2026-003');
  });

  it('opens create modal, populates project inventory, updates diff on actualQty edit, removes row, validates and submits', async () => {
    await renderPage();

    const createBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Tạo phiếu kiểm kê'),
    ) as HTMLButtonElement;
    expect(createBtn).toBeDefined();

    await act(async () => {
      createBtn.click();
    });

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Tạo phiếu kiểm kê');

    // Empty submit shows validation errors
    const submitBtn = [...dialog.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Tạo phiếu kiểm kê',
    ) as HTMLButtonElement;
    expect(submitBtn).toBeDefined();

    await act(async () => {
      submitBtn.click();
    });

    expect(dialog.textContent).toContain('Vui lòng chọn kho dự án kiểm kê');
    expect(dialog.textContent).toContain('Phải có ít nhất 1 vật tư kiểm kê');
    expect(stocktakesService.create).not.toHaveBeenCalled();

    // Choose project DA-2026-RM2
    const projectSelect = dialog.querySelector('select') as HTMLSelectElement;
    expect(projectSelect).not.toBeNull();
    await act(async () => {
      setSelectValue(projectSelect, 'DA-2026-RM2');
    });
    await flushQueries();

    expect(projectsService.getInventory).toHaveBeenCalledWith('DA-2026-RM2');

    const itemRows = [...dialog.querySelectorAll('tbody tr')];
    expect(itemRows).toHaveLength(2);

    // Edit actualQty on row 1 (+5 => diff +5) and row 2 (-3 => diff -3)
    const row1QtyInput = itemRows[0].querySelector('input[type="number"]') as HTMLInputElement;
    const row2QtyInput = itemRows[1].querySelector('input[type="number"]') as HTMLInputElement;
    expect(row1QtyInput.value).toBe('50');
    expect(row2QtyInput.value).toBe('20');

    await act(async () => {
      setInputValue(row1QtyInput, '55');
      setInputValue(row2QtyInput, '17');
    });

    expect(itemRows[0].textContent).toContain('+5');
    expect(itemRows[1].textContent).toContain('-3');

    // Add row then remove the added row via aria-label="Xóa dòng"
    const addRowBtn = [...dialog.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Thêm dòng'),
    ) as HTMLButtonElement;
    expect(addRowBtn).toBeDefined();
    await act(async () => {
      addRowBtn.click();
    });
    expect(dialog.querySelectorAll('tbody tr')).toHaveLength(3);

    const removeButtons = dialog.querySelectorAll('button[aria-label="Xóa dòng"]');
    expect(removeButtons).toHaveLength(3);
    await act(async () => {
      (removeButtons[2] as HTMLButtonElement).click();
    });
    expect(dialog.querySelectorAll('tbody tr')).toHaveLength(2);

    await act(async () => {
      submitBtn.click();
    });
    await flushQueries();

    expect(stocktakesService.create).toHaveBeenCalledTimes(1);
    const createdDto = vi.mocked(stocktakesService.create).mock.calls[0][0];
    expect(createdDto.warehouseId).toBe('DA-2026-RM2');
    expect(createdDto.warehouseName).toBe('Dự án Cầu Rạch Miễu 2');
    expect(createdDto.isFrozen).toBe(true);
    expect(createdDto.items).toHaveLength(2);
    expect(createdDto.items[0]).toMatchObject({
      sku: 'VT-THEP-001',
      name: 'Thép hình H300',
      systemQty: 50,
      actualQty: 55,
      diff: 5,
    });
    expect(createdDto.items[1]).toMatchObject({
      sku: 'VT-VAN-002',
      name: 'Van bi inox DN50',
      systemQty: 20,
      actualQty: 17,
      diff: -3,
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(showToast).toHaveBeenCalledWith(
      'success',
      expect.stringContaining('KK-2026-004'),
      'Tạo phiếu thành công',
    );
  });

  it('opens detail modal from EntityCodeLink and from dropdown Xem chi tiết', async () => {
    await renderPage();

    const codeLink = container.querySelector('button.entity-code-link') as HTMLButtonElement;
    expect(codeLink).not.toBeNull();
    expect(codeLink.textContent?.trim()).toBe('KK-2026-001');

    await act(async () => {
      codeLink.click();
    });

    let dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Phiếu kiểm kê — KK-2026-001');
    expect(dialog.textContent).toContain('Thép hình H300');
    expect(dialog.textContent).toContain('VT-THEP-001');
    expect(dialog.textContent).toContain('-2');

    const closeBtn = [...dialog.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Đóng',
    ) as HTMLButtonElement;
    await act(async () => {
      closeBtn.click();
    });
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    // Open via dropdown "Xem chi tiết" on second row
    const dropdownTriggers = [...container.querySelectorAll('button[aria-haspopup="menu"]')] as HTMLButtonElement[];
    await act(async () => {
      dropdownTriggers[1].click();
    });

    const detailItem = [...document.body.querySelectorAll('[role="menuitem"]')].find(el =>
      el.textContent?.includes('Xem chi tiết'),
    ) as HTMLButtonElement;
    await act(async () => {
      detailItem.click();
    });

    dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Phiếu kiểm kê — KK-2026-002');
    expect(dialog.textContent).toContain('Van bi inox DN50');
  });

  it('executes dropdown actions Duyệt phiếu, Mở băng, and confirms Hủy phiếu via ConfirmDialog', async () => {
    await renderPage();

    const openFirstRowMenu = async () => {
      const trigger = container.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;
      await act(async () => {
        trigger.click();
      });
    };

    // 1. Duyệt phiếu
    await openFirstRowMenu();
    const approveBtn = [...document.body.querySelectorAll('[role="menuitem"]')].find(el =>
      el.textContent?.includes('Duyệt phiếu'),
    ) as HTMLButtonElement;
    await act(async () => {
      approveBtn.click();
    });
    await flushQueries();
    expect(stocktakesService.approve).toHaveBeenCalledWith('st-001');
    expect(showToast).toHaveBeenCalledWith(
      'success',
      expect.stringContaining('KK-2026-001'),
    );

    // 2. Mở băng
    await openFirstRowMenu();
    const unfreezeBtn = [...document.body.querySelectorAll('[role="menuitem"]')].find(el =>
      el.textContent?.includes('Mở băng'),
    ) as HTMLButtonElement;
    await act(async () => {
      unfreezeBtn.click();
    });
    await flushQueries();
    expect(stocktakesService.update).toHaveBeenCalledWith(
      'st-001',
      expect.objectContaining({ isFrozen: false }),
    );

    // 3. Hủy phiếu opens ConfirmDialog [role="alertdialog"] before calling update
    vi.mocked(stocktakesService.update).mockClear();
    await openFirstRowMenu();
    const cancelBtn = [...document.body.querySelectorAll('[role="menuitem"]')].find(el =>
      el.textContent?.includes('Hủy phiếu'),
    ) as HTMLButtonElement;
    await act(async () => {
      cancelBtn.click();
    });

    const confirmDialog = document.body.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(confirmDialog).not.toBeNull();
    expect(confirmDialog.textContent).toContain('KK-2026-001');
    expect(stocktakesService.update).not.toHaveBeenCalled();

    const confirmActionBtn = [...confirmDialog.querySelectorAll('button')].find(btn =>
      btn.textContent?.trim() === 'Hủy phiếu',
    ) as HTMLButtonElement;
    expect(confirmActionBtn).toBeDefined();

    await act(async () => {
      confirmActionBtn.click();
    });
    await flushQueries();

    expect(stocktakesService.update).toHaveBeenCalledWith(
      'st-001',
      expect.objectContaining({ status: 'cancelled', isFrozen: false }),
    );
    expect(document.body.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('exports filtered stocktakes via Xuât Excel and toasts success only when saveBlob succeeds', async () => {
    await renderPage();

    const exportBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Xuất Excel'),
    ) as HTMLButtonElement;
    expect(exportBtn).toBeDefined();

    const saveSpy = vi.spyOn(apiClientModule, 'saveBlob').mockResolvedValueOnce(false);
    await act(async () => {
      exportBtn.click();
    });
    await flushQueries();
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(showToast).not.toHaveBeenCalledWith('success', expect.anything());

    saveSpy.mockResolvedValueOnce(true);
    await act(async () => {
      exportBtn.click();
    });
    await flushQueries();
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(showToast).toHaveBeenCalledWith(
      'success',
      expect.stringContaining('3 phiếu kiểm kê'),
    );
    saveSpy.mockRestore();
  });
});
