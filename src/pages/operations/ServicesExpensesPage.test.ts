import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { serviceExpenseItemsService } from '../../services/serviceExpenseItemsService';
import type { ServiceExpenseItemApiDto } from '../../types/api/serviceExpenseItem';
import ServicesExpensesPage from './ServicesExpensesPage';

vi.mock('../../services/serviceExpenseItemsService', () => ({
  serviceExpenseItemsService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleActive: vi.fn(),
    delete: vi.fn(),
    downloadImportTemplate: vi.fn(),
    parseImportFile: vi.fn(),
    importBatch: vi.fn(),
  },
}));

vi.mock('../../hooks/useMaterialUnits', () => ({
  useMaterialUnits: () => ({
    data: [
      { id: 1, name: 'Công', description: null, isActive: true, sortOrder: 1 },
      { id: 2, name: 'Ca', description: null, isActive: true, sortOrder: 2 },
      { id: 3, name: 'Chuyến', description: null, isActive: true, sortOrder: 3 },
      { id: 4, name: 'Gói', description: null, isActive: true, sortOrder: 4 },
      { id: 5, name: 'Tháng', description: null, isActive: true, sortOrder: 5 },
    ],
    isLoading: false,
  }),
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const mockItems: ServiceExpenseItemApiDto[] = [
  {
    id: 1,
    code: 'DV-VC-01',
    name: 'Chi phí cẩu tháp, vận chuyển vật tư',
    type: 'service',
    unit: 'Chuyến',
    referencePrice: 3500000,
    description: 'Xe cẩu 25 tấn phục vụ nâng lắp silo',
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-11-16T00:00:00Z',
    updatedAt: '2026-11-16T00:00:00Z',
  },
  {
    id: 2,
    code: 'CP-TK-01',
    name: 'Chi phí tiếp khách & đối tác EPC',
    type: 'expense',
    unit: 'Gói',
    referencePrice: 5000000,
    description: 'Tiếp khách định kỳ nghiệm thu mốc dự án',
    isActive: false,
    sortOrder: 2,
    createdAt: '2026-11-16T00:00:00Z',
    updatedAt: '2026-11-16T00:00:00Z',
  },
];

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  vi.mocked(serviceExpenseItemsService.list).mockResolvedValue({
    items: mockItems,
    total: mockItems.length,
    page: 1,
    pageSize: 15,
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
    await new Promise(resolve => setTimeout(resolve, 50));
  });
}

async function renderPage() {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(MemoryRouter, null, createElement(ServicesExpensesPage)),
      ),
    );
  });
  await flushQueries();
}

describe('ServicesExpensesPage Standard Layout & Actions', () => {
  it('renders HrmPanel with Mayzer navy header and unified toolbar', async () => {
    await renderPage();

    // Check board head
    const boardHead = container.querySelector('.mat-catalog-board__head');
    expect(boardHead).not.toBeNull();
    expect(boardHead?.textContent).toContain('Danh sách dịch vụ & chi phí dự án');

    // Check toolbar
    const toolbar = container.querySelector('.mat-catalog__toolbar');
    expect(toolbar).not.toBeNull();

    // Check SearchBar inside toolbar
    const searchInput = toolbar?.querySelector('input[type="search"], input[type="text"]');
    expect(searchInput).not.toBeNull();

    // Check segmented pill switcher
    const pillSwitcher = toolbar?.querySelector('[role="group"][aria-label="Lọc theo phân loại"]');
    expect(pillSwitcher).not.toBeNull();
    expect(pillSwitcher?.textContent).toContain('Tất cả');
    expect(pillSwitcher?.textContent).toContain('Dịch vụ');
    expect(pillSwitcher?.textContent).toContain('Chi phí ngoài');

    // Check status button
    const statusBtn = toolbar?.querySelector('button.mat-catalog__status');
    expect(statusBtn).not.toBeNull();
    expect(statusBtn?.textContent).toContain('Chỉ đang dùng');

    // Check table class and wrapping
    const tableWrap = container.querySelector('.wms-inventory-table-wrap');
    expect(tableWrap).not.toBeNull();
    const table = tableWrap?.querySelector('table.wms-inventory-table.mat-catalog-table');
    expect(table).not.toBeNull();

    // Check items rendered
    expect(container.textContent).toContain('DV-VC-01');
    expect(container.textContent).toContain('CP-TK-01');
  });

  it('toggles showInactive when clicking status button', async () => {
    await renderPage();

    const statusBtn = container.querySelector('button.mat-catalog__status') as HTMLButtonElement;
    expect(statusBtn).not.toBeNull();
    expect(statusBtn.textContent).toContain('Chỉ đang dùng');

    // Click to toggle
    await act(async () => {
      statusBtn.click();
    });
    await flushQueries();

    expect(statusBtn.textContent).toContain('Hiện cả ngừng SD');
    expect(statusBtn.classList.contains('is-on')).toBe(true);

    // Filter reset button should now appear
    const resetBtn = container.querySelector('button[title="Đặt lại bộ lọc"]');
    expect(resetBtn).not.toBeNull();
    expect(resetBtn?.textContent).toContain('Xóa lọc');
  });

  it('renders "Nhập Excel" and "Thêm dịch vụ / chi phí" on the header', async () => {
    await renderPage();

    const buttons = Array.from(container.querySelectorAll('button'));
    const importBtn = buttons.find(b => b.textContent?.includes('Nhập Excel'));
    const addBtn = buttons.find(b => b.textContent?.includes('Thêm dịch vụ / chi phí'));

    expect(importBtn).toBeDefined();
    expect(addBtn).toBeDefined();
  });

  it('opens create modal with MaterialUnitSelect from system settings and no chip buttons', async () => {
    await renderPage();

    const buttons = Array.from(container.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent?.includes('Thêm dịch vụ / chi phí'));
    expect(addBtn).toBeDefined();

    await act(async () => {
      addBtn?.click();
    });
    await flushQueries();

    // Modal title
    expect(document.body.textContent).toContain('Thêm dịch vụ / chi phí mới');

    // Unit select should exist with options from mocked useMaterialUnits
    const unitSelect = document.body.querySelector('select.form-select') as HTMLSelectElement;
    expect(unitSelect).not.toBeNull();

    const options = Array.from(unitSelect.querySelectorAll('option')).map(o => o.value);
    expect(options).toContain('Công');
    expect(options).toContain('Ca');
    expect(options).toContain('Chuyến');
    expect(options).toContain('Gói');
    expect(options).toContain('Tháng');

    // Verify there are no hardcoded chip buttons
    const chipBtns = Array.from(document.body.querySelectorAll('button')).filter(
      b => b.className.includes('text-[10px]') && ['Công', 'Ca', 'Chuyến', 'Gói'].includes(b.textContent?.trim() ?? ''),
    );
    expect(chipBtns).toHaveLength(0);
  });

  it('opens ServiceExpenseImportModal when clicking "Nhập Excel"', async () => {
    await renderPage();

    const buttons = Array.from(container.querySelectorAll('button'));
    const importBtn = buttons.find(b => b.textContent?.includes('Nhập Excel'));
    expect(importBtn).toBeDefined();

    await act(async () => {
      importBtn?.click();
    });
    await flushQueries();

    // Modal title & template download button
    expect(document.body.textContent).toContain('Nhập danh mục dịch vụ & chi phí từ file Excel');
    expect(document.body.textContent).toContain('Tải file mẫu Excel (.xlsx)');
    expect(document.body.textContent).toContain('Kéo thả file Excel (.xlsx, .xls) hoặc CSV vào đây');
  });
});
