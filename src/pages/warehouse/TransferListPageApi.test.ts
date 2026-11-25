import { act, createElement } from 'react';
import type React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transfer } from '../../types';
import { transfersService } from '../../services/transfersService';
import { materialsService } from '../../services/materialsService';
import { projectsService } from '../../services/projectsService';
import { stocktakesService } from '../../services/stocktakesService';
import { apiClient, saveBlob } from '../../lib/apiClient';
import { showToast } from '../../components/ui/Toast';
import TransferListPageRoute from './TransferListPageApi';

vi.mock('../../services/transfersService', () => ({
  transfersService: {
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

vi.mock('../../components/auth/PermissionGate', () => ({
  default: ({ children }: { children?: React.ReactNode }) => children,
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const sampleTransfers: Transfer[] = [
  {
    id: 'tf-1',
    voucherCode: 'CK-2026-007',
    date: '25/11/2026',
    createdAt: '2026-11-25T08:00:00.000Z',
    fromWarehouseId: 'WH-CRM2',
    fromWarehouseName: 'Kho Cầu Rạch Miễu 2',
    toWarehouseId: 'WH-CENTRAL',
    toWarehouseName: 'Kho trung tâm',
    project: 'DA-CRM2',
    projectName: 'Cầu Rạch Miễu 2',
    items: [
      { productId: 'VT-CAP-CU95', sku: 'VT-CAP-CU95', name: 'Cáp đồng trần 95mm2', qty: 120, unit: 'Mét' },
    ],
    status: 'draft',
    createdBy: 'Nguyễn Hoàng Nam',
    note: 'Hoàn trả cáp dư sau nghiệm thu hạng mục trạm',
  },
  {
    id: 'tf-2',
    voucherCode: 'CK-2026-008',
    date: '25/11/2026',
    createdAt: '2026-11-25T09:45:00.000Z',
    fromWarehouseId: 'WH-CRM2',
    fromWarehouseName: 'Kho Cầu Rạch Miễu 2',
    toWarehouseId: 'WH-VSIP3',
    toWarehouseName: 'Kho KCN VSIP III',
    project: 'DA-CRM2',
    projectName: 'Cầu Rạch Miễu 2',
    toProject: 'DA-VSIP3',
    toProjectName: 'Nhà máy Mayzer VSIP III',
    items: [
      { productId: 'VT-ONG-D114', sku: 'VT-ONG-D114', name: 'Ống thép đúc D114', qty: 30, unit: 'Mét' },
    ],
    status: 'pending',
    createdBy: 'Lê Thị Thu Hà',
    note: 'Điều chuyển ống thép sang VSIP III',
  },
  {
    id: 'tf-3',
    voucherCode: 'CK-2026-009',
    date: '24/11/2026',
    createdAt: '2026-11-24T11:00:00.000Z',
    fromWarehouseId: 'WH-VSIP3',
    fromWarehouseName: 'Kho KCN VSIP III',
    toWarehouseId: 'WH-CENTRAL',
    toWarehouseName: 'Kho trung tâm',
    project: 'DA-VSIP3',
    projectName: 'Nhà máy Mayzer VSIP III',
    items: [
      { productId: 'VT-VAN-BI-DN50', sku: 'VT-VAN-BI-DN50', name: 'Van bi inox DN50', qty: 8, unit: 'Cái' },
    ],
    status: 'approved',
    createdBy: 'Trần Minh Quang',
    approvedBy: 'Phạm Văn An',
    approvedAt: '2026-11-24T15:20:00.000Z',
    note: 'Đã nhập lại kho trung tâm',
  },
];

function setSearchInput(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('TransferListPageApi characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.clearAllMocks();

    vi.mocked(transfersService.list).mockResolvedValue(sampleTransfers);
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
          createElement(MemoryRouter, null, createElement(TransferListPageRoute)),
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

  it('filters rows by typeTabs (return/cross-project), status tabs, and search query', async () => {
    await renderPage();

    expect(container.querySelectorAll('tbody tr').length).toBe(3);

    await act(async () => {
      clickTab('Chuyển kho dự án');
    });
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(container.textContent).toContain('CK-2026-008');

    await act(async () => {
      clickTab('Hoàn trả kho trung tâm');
    });
    expect(container.querySelectorAll('tbody tr').length).toBe(2);
    expect(container.textContent).toContain('CK-2026-007');
    expect(container.textContent).toContain('CK-2026-009');

    await act(async () => {
      clickTab('Nháp');
    });
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(container.textContent).toContain('CK-2026-007');

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
      setSearchInput(searchEl, 'CK-2026-008');
    });
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(container.textContent).toContain('Nhà máy Mayzer VSIP III');
  });

  it('opens create modal and guards Excel export toast on saveBlob return value', async () => {
    await renderPage();

    const createBtn = [...container.querySelectorAll('button')].find(b =>
      b.textContent?.includes('Tạo phiếu chuyển'),
    ) as HTMLButtonElement;
    await act(async () => {
      createBtn.click();
    });
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Tạo phiếu chuyển kho dự án');

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
      '/api/transfers/export',
      expect.objectContaining({ status: undefined, search: undefined }),
    );
    expect(showToast).toHaveBeenCalledWith('success', 'Đã xuất danh sách phiếu chuyển');

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
