import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsService } from '../../services/projectsService';
import { purchaseWarrantiesService } from '../../services/purchaseWarrantiesService';
import PurchaseWarrantiesPage from './PurchaseWarrantiesPage';

vi.mock('../../services/purchaseWarrantiesService', () => ({
  purchaseWarrantiesService: {
    list: vi.fn(),
    listClaims: vi.fn(),
    syncFromReceipts: vi.fn(),
  },
}));

vi.mock('../../services/projectsService', () => ({
  projectsService: {
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

vi.mock('./warranties/CreateComplaintTicketPanel', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? createElement('div', { 'data-testid': 'create-complaint-modal' }, 'CreateComplaint') : null,
}));

vi.mock('./warranties/WarrantyDetailModal', () => ({
  default: () => null,
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

let root: Root;
let container: HTMLDivElement;
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
  vi.mocked(purchaseWarrantiesService.list).mockResolvedValue([
    {
      id: 'bh-01',
      code: 'BH-2026-001',
      materialCode: 'VT-MAYBOM-15KW',
      materialName: 'Máy bơm ly tâm trục ngang 15kW',
      supplierName: 'Công ty Cơ điện Ebara',
      projectCode: 'DA-NHONTRACH-03',
      poCode: 'PO-2026-041',
      deliveryDate: '2026-10-15',
      quantity: 4,
      unit: 'Bộ',
      warrantyMonths: 24,
      anchorType: 'delivery',
      status: 'active',
      claimCount: 1,
    } as never,
  ]);
  vi.mocked(purchaseWarrantiesService.listClaims).mockResolvedValue([
    {
      id: 'cl-01',
      warrantyId: 'bh-01',
      ticketCode: 'KNBH-2026-003',
      createdAt: '2026-11-12T08:00:00Z',
      supplierName: 'Công ty Cơ điện Ebara',
      materialName: 'Máy bơm ly tâm trục ngang 15kW',
      materialCode: 'VT-MAYBOM-15KW',
      poCode: 'PO-2026-041',
      defectType: 'functional',
      severity: 'high',
      warrantyStatus: 'active',
      status: 'submitted',
      reason: 'Rò rỉ phớt cơ khí khi chạy tải',
    } as never,
  ]);
  vi.mocked(purchaseWarrantiesService.syncFromReceipts).mockResolvedValue({ created: 2, updated: 1 });

  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
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
    await new Promise(resolve => setTimeout(resolve, 60));
  });
}

describe('PurchaseWarrantiesPage characterization', () => {
  it('renders KPI strip, warranty registry rows, sync button, and switches to complaints tab', async () => {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(MemoryRouter, null, createElement(PurchaseWarrantiesPage)),
        ),
      );
    });
    await flushQueries();

    expect(container.textContent).toContain('Quản lý bảo hành');
    expect(container.textContent).toContain('Máy bơm ly tâm trục ngang 15kW');
    expect(container.textContent).toContain('Công ty Cơ điện Ebara');
    expect(container.textContent).toContain('24 tháng · Giao hàng');

    const syncBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Đồng bộ từ PO đã nhận'),
    );
    expect(syncBtn).toBeTruthy();
    await act(async () => {
      syncBtn!.click();
    });
    await flushQueries();
    expect(purchaseWarrantiesService.syncFromReceipts).toHaveBeenCalledTimes(1);

    const complaintsTab = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Khiếu nại bảo hành'),
    );
    expect(complaintsTab).toBeTruthy();
    act(() => {
      complaintsTab!.click();
    });
    await flushQueries();

    expect(container.textContent).toContain('KNBH-2026-003');
    expect(container.textContent).toContain('Khiếu nại đang xử lý');
    expect(container.textContent).toContain('Tạo khiếu nại mới');
  });
});
