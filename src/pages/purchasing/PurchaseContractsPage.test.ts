import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsService } from '../../services/projectsService';
import { suppliersService } from '../../services/suppliersService';
import { purchaseOrdersService } from '../../services/purchaseOrdersService';
import { purchaseContractsService } from '../../services/purchaseContractsService';
import { showToast } from '../../components/ui/Toast';
import type { PurchaseContractApiDto } from '../../types/api/purchasingApi';
import PurchaseContractsPage from './PurchaseContractsPage';

vi.mock('../../services/purchaseContractsService', () => ({
  purchaseContractsService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
    remove: vi.fn(),
    importFromPoAttachments: vi.fn(),
  },
}));

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
  },
}));

vi.mock('../../services/suppliersService', async () => {
  const actual = await vi.importActual<typeof import('../../services/suppliersService')>('../../services/suppliersService');
  return {
    ...actual,
    suppliersService: {
      ...actual.suppliersService,
      list: vi.fn(),
    },
  };
});

vi.mock('../../services/purchaseOrdersService', () => ({
  purchaseOrdersService: {
    list: vi.fn(),
  },
}));

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

const sampleContracts: PurchaseContractApiDto[] = [
  {
    id: 'ctr-1',
    code: 'HD-2026-009',
    contractNo: '24/2026/HDKT-NV',
    title: 'Hợp đồng cung cấp thép hình Cầu Rạch Miễu 2',
    poCode: 'PO-2026-041',
    projectCode: 'DA-CRM2',
    supplierId: 1,
    supplierName: 'Công ty Cổ phần Thép Hòa Phát',
    status: 'active',
    signedDate: '2026-11-01',
    effectiveFrom: '2026-11-01',
    effectiveTo: '2027-06-30',
    amount: 350_000_000,
    note: 'Giao làm 2 đợt',
    fileName: 'HopDong_Thep_CRM2.pdf',
    hasFile: true,
    uploadedAt: '2026-11-02T09:00:00Z',
    createdAt: '2026-11-01T08:00:00Z',
  },
];

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function setSelectValue(el: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function findFieldInput(dialog: HTMLElement, labelIncludes: string): HTMLInputElement {
  const field = [...dialog.querySelectorAll('.form-field')].find(
    f => f.querySelector('.form-label')?.textContent?.includes(labelIncludes),
  );
  const input = field?.querySelector('input');
  expect(input).toBeTruthy();
  return input as HTMLInputElement;
}

describe('PurchaseContractsPage characterization', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();

    vi.mocked(projectsService.list).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });
    vi.mocked(suppliersService.list).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 500,
      totalPages: 1,
    });
    vi.mocked(purchaseOrdersService.list).mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 200,
      totalPages: 1,
    });
    vi.mocked(purchaseContractsService.list).mockResolvedValue({
      items: sampleContracts,
      totalCount: sampleContracts.length,
      page: 1,
      pageSize: 15,
      totalPages: 1,
    });
    vi.mocked(purchaseContractsService.getById).mockResolvedValue(sampleContracts[0]);
    vi.mocked(purchaseContractsService.create).mockResolvedValue({
      ...sampleContracts[0],
      id: 'ctr-2',
      code: 'HD-2026-010',
      contractNo: '25/2026/HDKT-NV',
      title: 'Hợp đồng cung cấp xi măng PCB40',
    });
    vi.mocked(purchaseContractsService.remove).mockResolvedValue(undefined);

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

  async function flush() {
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
          createElement(MemoryRouter, null, createElement(PurchaseContractsPage)),
        ),
      );
    });
    await flush();
  }

  it('renders contract list and updates query when status filter changes', async () => {
    await renderPage();

    expect(container.textContent).toContain('HD-2026-009');
    expect(container.textContent).toContain('24/2026/HDKT-NV');
    expect(container.textContent).toContain('Hợp đồng cung cấp thép hình Cầu Rạch Miễu 2');
    expect(container.textContent).toContain('Hiệu lực');
    expect(container.querySelector('button[aria-label="Tải HopDong_Thep_CRM2.pdf"]')).not.toBeNull();

    const statusSelect = container.querySelector('select[aria-label="Lọc trạng thái"]') as HTMLSelectElement;
    expect(statusSelect).not.toBeNull();
    await act(async () => {
      setSelectValue(statusSelect, 'active');
    });
    await flush();

    expect(purchaseContractsService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'active' }),
    );
  });

  it('validates empty create form and submits new contract when filled', async () => {
    await renderPage();

    const createBtn = [...container.querySelectorAll('button')].find(
      b => b.textContent?.includes('Tạo hợp đồng'),
    ) as HTMLButtonElement;
    await act(async () => {
      createBtn.click();
    });

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Tạo hợp đồng');

    const saveBtn = [...dialog.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Tạo',
    ) as HTMLButtonElement;
    await act(async () => {
      saveBtn.click();
    });

    expect(showToast).toHaveBeenCalledWith('warning', 'Nhập số hợp đồng và tiêu đề.');
    expect(purchaseContractsService.create).not.toHaveBeenCalled();

    const contractNoInput = findFieldInput(dialog, 'Số hợp đồng');
    const titleInput = findFieldInput(dialog, 'Tiêu đề');
    await act(async () => {
      setInputValue(contractNoInput, '25/2026/HDKT-NV');
      setInputValue(titleInput, 'Hợp đồng cung cấp xi măng PCB40');
    });
    await act(async () => {
      saveBtn.click();
    });
    await flush();

    expect(purchaseContractsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contractNo: '25/2026/HDKT-NV',
        title: 'Hợp đồng cung cấp xi măng PCB40',
        status: 'draft',
      }),
    );
    expect(showToast).toHaveBeenCalledWith('success', 'Đã tạo HD-2026-010.');
  });

  it('opens edit modal on row click and confirms contract deletion', async () => {
    await renderPage();

    const firstRow = container.querySelectorAll('tbody tr')[0] as HTMLTableRowElement;
    await act(async () => {
      firstRow.click();
    });
    await flush();

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Hợp đồng HD-2026-009');
    expect(dialog.textContent).toContain('HopDong_Thep_CRM2.pdf');

    const deleteBtn = [...dialog.querySelectorAll('button')].find(
      b => b.textContent?.includes('Xóa hợp đồng'),
    ) as HTMLButtonElement;
    expect(deleteBtn).toBeTruthy();
    await act(async () => {
      deleteBtn.click();
    });

    const alertDialog = document.body.querySelector('[role="alertdialog"]') as HTMLElement;
    expect(alertDialog).not.toBeNull();
    expect(alertDialog.textContent).toContain('Xóa hợp đồng');

    const confirmDeleteBtn = [...alertDialog.querySelectorAll('button')].find(
      b => b.textContent?.trim() === 'Xóa',
    ) as HTMLButtonElement;
    await act(async () => {
      confirmDeleteBtn.click();
    });
    await flush();

    expect(purchaseContractsService.remove).toHaveBeenCalledWith('ctr-1');
    expect(showToast).toHaveBeenCalledWith('success', 'Đã xóa hợp đồng.');
  });
});
