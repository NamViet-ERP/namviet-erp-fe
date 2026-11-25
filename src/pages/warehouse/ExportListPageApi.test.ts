import { act, createElement } from 'react';
import type React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Export } from '../../types';
import { exportsService } from '../../services/exportsService';
import { materialsService } from '../../services/materialsService';
import { projectsService } from '../../services/projectsService';
import { stocktakesService } from '../../services/stocktakesService';
import { apiClient, saveBlob } from '../../lib/apiClient';
import { showToast } from '../../components/ui/Toast';
import ExportListPageRoute from './ExportListPageApi';

vi.mock('../../services/exportsService', () => ({
  exportsService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    approve: vi.fn(),
    submit: vi.fn(),
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
    getInventory: vi.fn(),
  },
}));

vi.mock('../../services/stocktakesService', () => ({
  stocktakesService: {
    list: vi.fn(),
  },
}));

vi.mock('../../lib/apiClient', async importOriginal => {
  const actual = await importOriginal<typeof import('../../lib/apiClient')>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      getBlob: vi.fn(),
    },
    saveBlob: vi.fn(),
  };
});

vi.mock('../../auth/AuthProvider', () => ({
  useSession: () => ({
    user: { id: 'usr-tk', username: 'thukho.minh', role: 'storekeeper' },
    permissions: ['wms.exports.view', 'wms.exports.create', 'wms.exports.approve'],
    refresh: vi.fn(),
  }),
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    has: () => true,
  }),
}));

vi.mock('../../components/auth/PermissionGate', () => ({
  default: ({ children }: { children?: React.ReactNode }) => children,
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const sampleExports: Export[] = [
  {
    id: 'exp-1',
    voucherCode: 'XK-2026-011',
    date: '25/11/2026',
    createdAt: '2026-11-25T08:00:00.000Z',
    soCode: 'PO-2026-041',
    customer: '',
    warehouseId: 'WH-CRM2',
    warehouseName: 'Kho Cầu Rạch Miễu 2',
    project: 'DA-CRM2',
    projectName: 'Cầu Rạch Miễu 2',
    items: [
      { productId: 'VT-THEP-H300', sku: 'VT-THEP-H300', name: 'Thép hình H300', qty: 20, unit: 'Cây' },
    ],
    status: 'draft',
    createdBy: 'Trần Minh Quang',
    note: 'Xuất lắp dầm chủ trụ T5',
    isDirectProcurement: false,
  },
  {
    id: 'exp-2',
    voucherCode: 'XK-2026-012',
    date: '25/11/2026',
    createdAt: '2026-11-25T09:15:00.000Z',
    soCode: 'PO-2026-052',
    customer: '',
    warehouseId: 'WH-VSIP3',
    warehouseName: 'Kho KCN VSIP III',
    project: 'DA-VSIP3',
    projectName: 'Nhà máy Mayzer VSIP III',
    items: [
      { productId: 'VT-ONG-D114', sku: 'VT-ONG-D114', name: 'Ống thép đúc D114', qty: 50, unit: 'Mét' },
    ],
    status: 'pending',
    createdBy: 'Lê Thị Thu Hà',
    note: 'Xuất thẳng từ NCC ra công trường',
    isDirectProcurement: true,
    linkedTicketCode: 'NK-2026-052',
  },
  {
    id: 'exp-3',
    voucherCode: 'XK-2026-013',
    date: '24/11/2026',
    createdAt: '2026-11-24T10:30:00.000Z',
    soCode: 'PO-2026-030',
    customer: '',
    warehouseId: 'WH-CRM2',
    warehouseName: 'Kho Cầu Rạch Miễu 2',
    project: 'DA-CRM2',
    projectName: 'Cầu Rạch Miễu 2',
    items: [
      { productId: 'VT-BULONG-M20', sku: 'VT-BULONG-M20', name: 'Bu lông cường độ cao M20', qty: 200, unit: 'Bộ' },
    ],
    status: 'approved',
    createdBy: 'Nguyễn Văn Thành',
    approvedBy: 'Trần Thủ Kho',
    approvedAt: '2026-11-24T14:00:00.000Z',
    note: 'Đã duyệt xuất kho',
    isDirectProcurement: false,
  },
];

function setSearchInput(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('ExportListPageApi characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.clearAllMocks();

    vi.mocked(exportsService.list).mockResolvedValue(sampleExports);
    vi.mocked(materialsService.list).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });
    vi.mocked(projectsService.list).mockResolvedValue({
      items: [
        {
          projectCode: 'DA-CRM2',
          projectName: 'Cầu Rạch Miễu 2',
          projectType: 'EPC',
          pmId: 'pm-1',
          pmName: 'Nguyễn Hữu Phước',
          startDate: '2026-01-10T00:00:00Z',
          endDate: null,
          materialBudget: 1_000_000_000,
          status: 'Active',
          clientName: null,
          scMembers: null,
          stockActualQty: 100,
          stockPlannedQty: 0,
          stockReservedQty: 0,
          stockMaterialCount: 1,
          approvedImportValue: 0,
          materialBudgetRemaining: 1_000_000_000,
          warehouseKeepers: [],
          stage: null,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
    vi.mocked(projectsService.getInventory).mockResolvedValue([]);
    vi.mocked(stocktakesService.list).mockResolvedValue([]);
    vi.mocked(apiClient.getBlob).mockResolvedValue(new Blob(['xlsx'], { type: 'application/octet-stream' }));
    vi.mocked(saveBlob).mockResolvedValue(true);

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

  async function renderPage() {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(MemoryRouter, null, createElement(ExportListPageRoute)),
        ),
      );
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 40));
    });
  }

  function clickTab(labelPrefix: string) {
    const btn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.replace(/\s+/g, ' ').trim().startsWith(labelPrefix),
    );
    expect(btn, `Expected tab starting with "${labelPrefix}"`).toBeDefined();
    btn!.click();
  }

  it('filters rows by kindTabs (stock/direct), status tabs, and search query', async () => {
    await renderPage();

    expect(container.querySelectorAll('tbody tr').length).toBe(3);

    await act(async () => {
      clickTab('Xuất thẳng');
    });
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(container.textContent).toContain('XK-2026-012');

    await act(async () => {
      clickTab('Xuất từ kho');
    });
    expect(container.querySelectorAll('tbody tr').length).toBe(2);
    expect(container.textContent).toContain('XK-2026-011');
    expect(container.textContent).toContain('XK-2026-013');

    await act(async () => {
      clickTab('Nháp');
    });
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(container.textContent).toContain('XK-2026-011');

    // Reset tabs to all and filter by search
    await act(async () => {
      const allTabs = [...container.querySelectorAll('button')].filter(b =>
        b.textContent?.replace(/\s+/g, ' ').trim().startsWith('Tất cả'),
      );
      allTabs[0]?.click();
      allTabs[1]?.click();
    });

    const searchEl = container.querySelector('input[placeholder*="Tìm mã chứng từ"]') as HTMLInputElement;
    expect(searchEl).not.toBeNull();
    await act(async () => {
      setSearchInput(searchEl, 'VSIP III');
    });
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(container.textContent).toContain('XK-2026-012');
  });

  it('opens create modal and triggers Excel export via downloadVoucherExport', async () => {
    await renderPage();

    const createBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Tạo phiếu xuất'),
    ) as HTMLButtonElement;
    await act(async () => {
      createBtn.click();
    });
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Tạo phiếu xuất kho dự án');

    const cancelBtn = [...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Hủy')!;
    await act(async () => {
      cancelBtn.click();
    });

    const exportBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Xuất Excel'),
    ) as HTMLButtonElement;
    await act(async () => {
      exportBtn.click();
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(apiClient.getBlob).toHaveBeenCalledWith(
      '/api/exports/export',
      expect.objectContaining({ status: undefined, search: undefined }),
    );
    expect(saveBlob).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith('success', 'Đã xuất danh sách phiếu xuất');

    vi.mocked(showToast).mockClear();
    vi.mocked(saveBlob).mockResolvedValueOnce(false);
    await act(async () => {
      exportBtn.click();
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    expect(showToast).not.toHaveBeenCalledWith('success', expect.anything());
  });
});
