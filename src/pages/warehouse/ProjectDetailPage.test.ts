import { act, createElement } from 'react';
import type React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsService } from '../../services/projectsService';
import type {
  WarehouseProjectApiDto,
  WarehouseProjectInventoryApiDto,
  WarehouseProjectLedgerEntryApiDto,
} from '../../types/wms';
import ProjectDetailPage from './ProjectDetailPage';

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    getByCode: vi.fn(),
    getInventory: vi.fn(),
    getLedger: vi.fn(),
    closeProject: vi.fn(),
    update: vi.fn(),
    updateInventoryMinStock: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

vi.mock('../../auth/AuthProvider', () => ({
  useSession: () => ({
    user: { id: 'usr-admin', username: 'admin', role: 'admin' },
    permissions: ['*'],
    refresh: vi.fn(),
  }),
}));

vi.mock('../../components/auth/PermissionGate', () => ({
  default: ({ children }: { children?: React.ReactNode }) => children,
}));

vi.mock('../../lib/wms/priceVisibility', () => ({
  useCanViewWmsPrices: () => true,
}));

vi.mock('../../components/warehouse/WarehouseKeeperMultiSelect', () => ({
  default: ({ value }: { value: Array<{ userId: string; displayName: string }> }) =>
    createElement('div', { 'data-testid': 'keeper-select' }, value.map(k => k.displayName).join(', ')),
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const mockProject: WarehouseProjectApiDto = {
  projectCode: 'DA-2026-001',
  projectName: 'Nhà máy Nhiệt điện Sông Hậu',
  projectType: 'EPC',
  pmId: '00000000-0000-0000-0000-000000000001',
  pmName: 'Nguyễn Văn Minh',
  startDate: '2026-01-15T00:00:00Z',
  endDate: '2026-12-31T00:00:00Z',
  materialBudget: 500_000_000,
  status: 'Active',
  clientName: 'EVN',
  scMembers: null,
  stockActualQty: 10,
  stockPlannedQty: 5,
  stockReservedQty: 0,
  stockMaterialCount: 1,
  approvedImportValue: 150_000_000,
  materialBudgetRemaining: 350_000_000,
  warehouseKeepers: [{ userId: 'k1', displayName: 'Trần Thủ Kho' }],
  stage: null,
};

const mockInventory: WarehouseProjectInventoryApiDto[] = [
  {
    projectCode: 'DA-2026-001',
    materialCode: 'VT-001',
    materialName: 'Van bi inox DN50',
    unit: 'Cái',
    actualImportQty: 10,
    actualExportQty: 6,
    actualInventoryQty: 4,
    plannedInventoryQty: 9,
    reservedQty: 0,
    minStockQty: 10,
    plannedImportQty: 5,
    plannedExportQty: 0,
    pendingDefectQty: 0,
    issuedFromPoQty: 6,
    issuedFromGeneralQty: 2,
  },
];

const mockLedger: WarehouseProjectLedgerEntryApiDto[] = [
  {
    id: '101',
    voucherCode: 'NK-2026-001',
    kind: 'import',
    status: 'approved',
    date: '2026-02-01',
    itemQty: 10,
    totalValue: 150_000_000,
  },
];

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('ProjectDetailPage characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();

    vi.mocked(projectsService.getByCode).mockResolvedValue(mockProject);
    vi.mocked(projectsService.getInventory).mockResolvedValue(mockInventory);
    vi.mocked(projectsService.getLedger).mockResolvedValue(mockLedger);
    vi.mocked(projectsService.update).mockResolvedValue(undefined);
    vi.mocked(projectsService.closeProject).mockResolvedValue({
      projectCode: 'DA-2026-001',
      status: 'Closed',
    });
    vi.mocked(projectsService.deleteProject).mockResolvedValue(undefined);

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

  async function renderPage() {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(
            MemoryRouter,
            { initialEntries: ['/warehouse/projects/DA-2026-001'] },
            createElement(
              Routes,
              null,
              createElement(Route, {
                path: '/warehouse/projects/:code',
                element: createElement(ProjectDetailPage),
              }),
              createElement(Route, {
                path: '/warehouse/projects',
                element: createElement('div', null, 'Projects List'),
              }),
            ),
          ),
        ),
      );
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 40));
    });
  }

  function clickTab(label: string) {
    const btn = [...container.querySelectorAll('button')].find(
      b => b.textContent?.trim() === label,
    );
    expect(btn).toBeDefined();
    btn!.click();
  }

  it('renders detail header, stat cards, and switches cleanly across stock, budget, history, and info tabs', async () => {
    await renderPage();

    // Detail header & stats
    expect(container.textContent).toContain('Nhà máy Nhiệt điện Sông Hậu');
    expect(container.textContent).toContain('Mã kho: DA-2026-001');
    expect(container.textContent).toContain('Trần Thủ Kho');

    // Default tab: stock
    expect(container.textContent).toContain('VT-001');
    expect(container.textContent).toContain('Van bi inox DN50');
    expect(container.textContent).toContain('mặt hàng đang dưới tồn tối thiểu');

    // Switch to budget tab
    await act(async () => {
      clickTab('Dự toán');
    });
    expect(container.textContent).toContain('Ngân sách');

    // Switch to history tab
    await act(async () => {
      clickTab('Lịch sử phiếu');
    });
    expect(container.textContent).toContain('NK-2026-001');

    // Switch to info tab
    await act(async () => {
      clickTab('Thông tin');
    });
    expect(container.textContent).toContain('Loại dự án');
    expect(container.textContent).toContain('EPC');
    expect(container.textContent).toContain('Còn lại (đã trừ nhập duyệt)');
  });

  it('opens edit modal, submits updates, and supports close project confirm dialog', async () => {
    await renderPage();

    // Open edit modal
    const editBtn = [...container.querySelectorAll('button')].find(
      b => b.textContent?.includes('Chỉnh sửa'),
    );
    expect(editBtn).toBeDefined();
    await act(async () => {
      editBtn!.click();
    });

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Chỉnh sửa kho dự án');

    const nameInput = dialog.querySelector('input[value="Nhà máy Nhiệt điện Sông Hậu"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(nameInput, 'Nhà máy Nhiệt điện Sông Hậu II');
    });
    await act(async () => {
      const saveBtn = [...dialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Lưu thay đổi');
      saveBtn!.click();
    });

    expect(projectsService.update).toHaveBeenCalledWith(
      'DA-2026-001',
      expect.objectContaining({
        projectName: 'Nhà máy Nhiệt điện Sông Hậu II',
        materialBudget: 500_000_000,
      }),
    );

    // Open close project confirm dialog
    const closeBtn = [...container.querySelectorAll('button')].find(
      b => b.textContent?.includes('Đóng kho'),
    );
    expect(closeBtn).toBeDefined();
    await act(async () => {
      closeBtn!.click();
    });

    const alertDialog = document.body.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(alertDialog).not.toBeNull();
    expect(alertDialog.textContent).toContain('Đóng kho dự án?');
    await act(async () => {
      const confirmCloseBtn = [...alertDialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Đóng kho');
      confirmCloseBtn!.click();
    });

    expect(projectsService.closeProject).toHaveBeenCalledWith('DA-2026-001');
  });

  it('renders delete button and confirms deletion when project has zero stock', async () => {
    vi.mocked(projectsService.getByCode).mockResolvedValue({
      ...mockProject,
      stockMaterialCount: 0,
      stockActualQty: 0,
    });
    vi.mocked(projectsService.getInventory).mockResolvedValue([]);

    await renderPage();

    const deleteBtn = [...container.querySelectorAll('button')].find(
      b => b.textContent?.includes('Xóa kho'),
    );
    expect(deleteBtn).toBeDefined();
    await act(async () => {
      deleteBtn!.click();
    });

    const alertDialog = document.body.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(alertDialog).not.toBeNull();
    expect(alertDialog.textContent).toContain('Xóa kho dự án');

    await act(async () => {
      const confirmDeleteBtn = [...alertDialog.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Xóa kho');
      confirmDeleteBtn!.click();
    });

    expect(projectsService.deleteProject).toHaveBeenCalledWith('DA-2026-001');
  });
});
