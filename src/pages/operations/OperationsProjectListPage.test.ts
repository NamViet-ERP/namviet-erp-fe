import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsService } from '../../services/projectsService';
import type { WarehouseProjectApiDto } from '../../types/wms';
import OperationsProjectListPage from './OperationsProjectListPage';

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
    getNextCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../hooks/useProjectPersonnel', () => ({
  useProjectPersonnel: () => ({
    data: [
      { id: 'nv-1', name: 'Nguyễn Văn Hùng', code: 'NV001', email: 'hung.nv@namviet.vn' },
      { id: 'nv-2', name: 'Trần Minh Tuấn', code: 'NV002', email: 'tuan.tm@namviet.vn' },
      { id: 'nv-3', name: 'Lê Quốc Bảo', code: 'NV003', email: 'bao.lq@namviet.vn' },
    ],
  }),
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    permissions: [],
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
    projectCode: 'DA-RM2-01',
    projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
    projectType: 'Project',
    pmId: '8a1f2c10-1000-4000-8000-000000000001',
    pmName: 'Nguyễn Văn Hùng',
    startDate: '2026-03-01',
    endDate: '2026-12-30',
    materialBudget: 1_800_000_000,
    status: 'Active',
    clientName: 'Ban QLDA Mỹ Thuận',
    scMembers: 'Trần Minh Tuấn',
    stockActualQty: 180,
    stockPlannedQty: 300,
    stockReservedQty: 20,
    stockMaterialCount: 14,
    approvedImportValue: 620_000_000,
    materialBudgetRemaining: 1_180_000_000,
    warehouseKeepers: [],
  },
  {
    projectCode: 'DA-LT-02',
    projectName: 'Nhà ga T3 Tân Sơn Nhất - Gói MEP',
    projectType: 'Project',
    pmId: '00000000-0000-0000-0000-000000000000',
    pmName: 'Kho hàng',
    startDate: '2026-05-10',
    endDate: null,
    materialBudget: 950_000_000,
    status: 'Transferring',
    clientName: 'ACV',
    scMembers: null,
    stockActualQty: 90,
    stockPlannedQty: 150,
    stockReservedQty: 0,
    stockMaterialCount: 8,
    approvedImportValue: 310_000_000,
    materialBudgetRemaining: 640_000_000,
    warehouseKeepers: [],
  },
  {
    projectCode: 'DA-DT-03',
    projectName: 'Cầu Mỹ Thuận 2 - Hạng mục M&E',
    projectType: 'Project',
    pmId: '8a1f2c10-1000-4000-8000-000000000003',
    pmName: 'Lê Quốc Bảo',
    startDate: '2025-11-01',
    endDate: '2026-08-15',
    materialBudget: 720_000_000,
    status: 'Closed',
    clientName: 'Ban QLDA 7',
    scMembers: 'Trần Minh Tuấn',
    stockActualQty: 0,
    stockPlannedQty: 220,
    stockReservedQty: 0,
    stockMaterialCount: 0,
    approvedImportValue: 700_000_000,
    materialBudgetRemaining: 20_000_000,
    warehouseKeepers: [],
  },
];

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

async function flushQueries(ms = 25) {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms));
  });
}

async function waitFor(predicate: () => boolean, timeoutMs = 2000) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start >= timeoutMs) {
      throw new Error('Timed out waiting for OperationsProjectListPage state');
    }
    await flushQueries(15);
  }
}

async function renderPage(readyPredicate?: () => boolean) {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(MemoryRouter, null, createElement(OperationsProjectListPage)),
      ),
    );
  });
  if (readyPredicate) {
    await waitFor(readyPredicate);
  } else {
    await flushQueries();
  }
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);

  vi.mocked(projectsService.list).mockResolvedValue({
    items: sampleProjects,
    totalCount: sampleProjects.length,
    page: 1,
    pageSize: 200,
    totalPages: 1,
  });
  vi.mocked(projectsService.getNextCode).mockResolvedValue({ projectCode: 'DA-2026-004' });
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  client.clear();
  vi.unstubAllGlobals();
});

describe('OperationsProjectListPage', () => {
  it('renders PageShell, SectionCard, non-pill CTA, TableShell, and shares single summary query when <= 200', async () => {
    await renderPage(() => Boolean(container.textContent?.includes('DA-RM2-01')));

    expect(container.querySelector('.erp-page-shell--list.operations-dashboard.ops-projects')).not.toBeNull();
    expect(container.querySelector('.erp-section-card.ops-projects-board')).not.toBeNull();

    // Non-pill CTA button with no duplicate '+'
    const ctaBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Thêm dự án',
    );
    expect(ctaBtn).toBeDefined();
    expect(ctaBtn?.className).toContain('btn-filled');
    expect(ctaBtn?.className).not.toContain('rounded-full');
    expect(ctaBtn?.textContent).not.toContain('+');

    // Consolidated single list query shared with stats when filters are empty
    expect(projectsService.list).toHaveBeenCalledTimes(1);
    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 200 });

    // KPI counts from single summary response
    const kpis = Array.from(container.querySelectorAll('.ops-projects-kpis [role="listitem"]'));
    expect(kpis).toHaveLength(4);
    expect(kpis[0]?.textContent).toContain('3');
    expect(kpis[1]?.textContent).toContain('1');
    expect(kpis[2]?.textContent).toContain('1');
    expect(kpis[3]?.textContent).toContain('1');

    // TableShell + sanitized PM + consistent Link button variants (no .btn-secondary)
    const table = container.querySelector('.erp-table-shell table.wms-inventory-table.project-warehouse-table--wide');
    expect(table).not.toBeNull();
    expect(table?.textContent).toContain('DA-RM2-01');
    expect(table?.textContent).toContain('Chưa phân công PM');
    expect(table?.querySelector('.btn-secondary')).toBeNull();
    expect(table?.querySelectorAll('a.btn.btn-tonal')).toHaveLength(3);
    expect(table?.querySelectorAll('a.btn.btn-text')).toHaveLength(3);
  });

  it('uses HrmDatePicker in Create and Edit modals with zero native date inputs', async () => {
    await renderPage(() => Boolean(container.textContent?.includes('DA-RM2-01')));

    // Open Create modal
    const ctaBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Thêm dự án',
    ) as HTMLButtonElement;
    await act(async () => {
      ctaBtn.click();
    });
    await flushQueries();

    expect(document.body.textContent).toContain('Tạo dự án mới');
    expect(document.body.querySelectorAll('input[type="date"]')).toHaveLength(0);

    const createStartTrigger = document.getElementById('modal-start-date') as HTMLButtonElement | null;
    const createEndTrigger = document.getElementById('modal-end-date') as HTMLButtonElement | null;
    expect(createStartTrigger).not.toBeNull();
    expect(createEndTrigger).not.toBeNull();
    expect(createStartTrigger?.className).toContain('hrm-date-picker__trigger');
    expect(createEndTrigger?.className).toContain('hrm-date-picker__trigger');
    expect(createStartTrigger?.disabled).toBe(false);
    expect(createEndTrigger?.disabled).toBe(false);

    // Modal footer uses Button primitives (.btn-outlined & .btn-filled)
    const cancelBtn = Array.from(document.body.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Hủy',
    ) as HTMLButtonElement;
    const saveBtn = Array.from(document.body.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Lưu',
    ) as HTMLButtonElement;
    expect(cancelBtn.className).toContain('btn-outlined');
    expect(saveBtn.className).toContain('btn-filled');

    // Close modal and open Edit modal for DA-RM2-01
    await act(async () => {
      cancelBtn.click();
    });
    await flushQueries();

    const editBtns = Array.from(container.querySelectorAll('button[title="Sửa thông tin dự án"]')) as HTMLButtonElement[];
    expect(editBtns).toHaveLength(3);
    await act(async () => {
      editBtns[0]!.click();
    });
    await flushQueries();

    expect(document.body.textContent).toContain('Sửa dự án');
    expect(document.body.querySelectorAll('input[type="date"]')).toHaveLength(0);
    const editStartTrigger = document.getElementById('modal-start-date') as HTMLButtonElement | null;
    const editEndTrigger = document.getElementById('modal-end-date') as HTMLButtonElement | null;
    expect(editStartTrigger?.disabled).toBe(true);
    expect(editEndTrigger?.disabled).toBe(false);
    expect(editStartTrigger?.textContent).toContain('01/03/2026');
    expect(editEndTrigger?.textContent).toContain('30/12/2026');
  });

  it('falls back to status count queries only when totalCount > 200 and fetches filtered list on tab click', async () => {
    vi.mocked(projectsService.list).mockImplementation(async (params = {}) => {
      if (params.status === 'Active' && params.pageSize === 1) {
        return { items: [], totalCount: 150, page: 1, pageSize: 1, totalPages: 150 };
      }
      if (params.status === 'Transferring' && params.pageSize === 1) {
        return { items: [], totalCount: 30, page: 1, pageSize: 1, totalPages: 30 };
      }
      if (params.status === 'Closed' && params.pageSize === 1) {
        return { items: [], totalCount: 60, page: 1, pageSize: 1, totalPages: 60 };
      }
      if (params.status === 'Active') {
        return {
          items: [sampleProjects[0]!],
          totalCount: 150,
          page: 1,
          pageSize: 15,
          totalPages: 10,
        };
      }
      return {
        items: sampleProjects,
        totalCount: 240,
        page: 1,
        pageSize: 200,
        totalPages: 2,
      };
    });

    await renderPage(() => {
      const kpis = container.querySelectorAll('.ops-projects-kpis [role="listitem"]');
      return Boolean(kpis[3]?.textContent?.includes('60'));
    });

    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 200 });
    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 1, status: 'Active' });
    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 1, status: 'Transferring' });
    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 1, status: 'Closed' });

    const kpis = Array.from(container.querySelectorAll('.ops-projects-kpis [role="listitem"]'));
    expect(kpis[0]?.textContent).toContain('240');
    expect(kpis[1]?.textContent).toContain('150');
    expect(kpis[2]?.textContent).toContain('30');
    expect(kpis[3]?.textContent).toContain('60');

    // Click 'Đang triển khai' status tab to trigger filtered list query
    const activeTab = Array.from(
      container.querySelectorAll('[role="tablist"][aria-label="Lọc trạng thái"] button'),
    ).find(b => b.textContent?.trim() === 'Đang triển khai') as HTMLButtonElement;
    await act(async () => {
      activeTab.click();
    });
    await waitFor(() =>
      vi.mocked(projectsService.list).mock.calls.some(
        ([params]) => params?.status === 'Active' && params?.pageSize === 15,
      ),
    );

    expect(projectsService.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 15,
      search: undefined,
      status: 'Active',
    });

    const resetBtn = container.querySelector('button[title="Đặt lại bộ lọc"]') as HTMLButtonElement | null;
    expect(resetBtn).not.toBeNull();
    expect(resetBtn?.className).toContain('btn-text');

    await act(async () => {
      resetBtn?.click();
    });
    await waitFor(() => Boolean(container.textContent?.includes('DA-LT-02')));
    expect(container.querySelector('button[title="Đặt lại bộ lọc"]')).toBeNull();
  });
});
