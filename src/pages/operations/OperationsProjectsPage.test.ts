import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsService } from '../../services/projectsService';
import type { ProjectPurchasingProgressApiDto, WarehouseProjectApiDto } from '../../types/wms';
import OperationsProjectsPage from './OperationsProjectsPage';

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
    listPurchasingProgress: vi.fn(),
  },
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    permissions: [],
    has: () => true,
    hasAny: () => true,
    hasAll: () => true,
  }),
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
    pmId: '8a1f2c10-1000-4000-8000-000000000002',
    pmName: 'Lê Quốc Bảo',
    startDate: '2026-01-15',
    endDate: '2026-09-30',
    materialBudget: 950_000_000,
    status: 'Closed',
    clientName: 'ACV',
    scMembers: null,
    stockActualQty: 0,
    stockPlannedQty: 250,
    stockReservedQty: 0,
    stockMaterialCount: 0,
    approvedImportValue: 920_000_000,
    materialBudgetRemaining: 30_000_000,
    warehouseKeepers: [],
  },
];

const sampleProgress: ProjectPurchasingProgressApiDto[] = [
  {
    projectCode: 'DA-RM2-01',
    projectName: 'Trạm trộn bê tông Cầu Rạch Miễu 2',
    plannedStart: '2026-10-01',
    plannedEnd: '2026-12-30',
    actualEnd: null,
    status: 'in_progress',
    percentComplete: 65,
    plans: [
      {
        planCode: 'KHMH-2026-001',
        kind: 'plan',
        planStatus: 'approved',
        plannedStart: '2026-10-02',
        plannedEnd: '2026-11-25',
        actualEnd: null,
        status: 'in_progress',
        percentComplete: 65,
        ordered: 100,
        received: 65,
        orders: [],
      },
    ],
    orders: [
      {
        poCode: 'PO-2026-015',
        planCode: 'KHMH-2026-001',
        supplierName: 'Công ty CP Thép Hòa Phát Dung Quất',
        plannedStart: '2026-10-05',
        plannedEnd: '2026-12-20',
        actualEnd: null,
        deliveryStatus: 'partial',
        status: 'in_progress',
        percentComplete: 65,
        ordered: 100,
        received: 65,
        lines: [],
        receipts: [],
      },
    ],
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
      throw new Error('Timed out waiting for OperationsProjectsPage state');
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
        createElement(MemoryRouter, null, createElement(OperationsProjectsPage)),
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
  vi.mocked(projectsService.listPurchasingProgress).mockResolvedValue(sampleProgress);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
  client.clear();
  vi.unstubAllGlobals();
});

describe('OperationsProjectsPage', () => {
  it('renders PageShell, SectionCard, SelectField, TableShell, and EntityCodeLink with consolidated stats query when <= 200', async () => {
    await renderPage();

    expect(container.querySelector('.erp-page-shell--list.operations-dashboard.ops-projects')).not.toBeNull();
    expect(container.querySelectorAll('.erp-section-card.ops-projects-board')).toHaveLength(2);

    // SelectField inside .ops-projects__filter-field without legacy .form-input select
    const selectWrap = container.querySelector('.ops-projects__filter-field .hrm-filter-select-wrap');
    expect(selectWrap).not.toBeNull();
    const selectEl = selectWrap?.querySelector('select.hrm-filter-select[aria-label="Lọc dự án trên Gantt"]') as HTMLSelectElement | null;
    expect(selectEl).not.toBeNull();
    expect(container.querySelector('select.form-input')).toBeNull();

    // Consolidated single list query for <= 200 projects
    expect(projectsService.list).toHaveBeenCalledTimes(1);
    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 200 });

    // KPI strip values derived from consolidated list
    const kpiCards = Array.from(container.querySelectorAll('.ops-projects-kpis [role="listitem"]'));
    expect(kpiCards).toHaveLength(3);
    expect(kpiCards[0]?.textContent).toContain('2');
    expect(kpiCards[1]?.textContent).toContain('1');
    expect(kpiCards[2]?.textContent).toContain('1');

    // TableShell + EntityCodeLink preserving exact routes
    const tableShell = container.querySelector('.erp-table-shell table.wms-inventory-table.project-warehouse-table--wide');
    expect(tableShell).not.toBeNull();
    const projectCodeLink = tableShell?.querySelector('a.entity-code-link[href="/warehouse/projects/DA-RM2-01"]');
    const poCodeLink = tableShell?.querySelector('a.entity-code-link[href="/purchasing/orders/PO-2026-015"]');
    expect(projectCodeLink?.textContent).toBe('DA-RM2-01');
    expect(poCodeLink?.textContent).toBe('PO-2026-015');

    // Selecting a project via SelectField triggers project-filtered progress fetch
    await act(async () => {
      if (selectEl) {
        selectEl.value = 'DA-RM2-01';
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await waitFor(() =>
      vi.mocked(projectsService.listPurchasingProgress).mock.calls.some(args => args[0] === 'DA-RM2-01'),
    );
    expect(projectsService.listPurchasingProgress).toHaveBeenCalledWith('DA-RM2-01');
  });

  it('falls back to status count queries only when totalCount > 200', async () => {
    vi.mocked(projectsService.list).mockImplementation(async (params = {}) => {
      if (params.status === 'Active') {
        return { items: [], totalCount: 145, page: 1, pageSize: 1, totalPages: 145 };
      }
      if (params.status === 'Closed') {
        return { items: [], totalCount: 68, page: 1, pageSize: 1, totalPages: 68 };
      }
      return {
        items: sampleProjects,
        totalCount: 235,
        page: 1,
        pageSize: 200,
        totalPages: 2,
      };
    });

    await renderPage(() => {
      const kpiCards = container.querySelectorAll('.ops-projects-kpis [role="listitem"]');
      return Boolean(kpiCards[2]?.textContent?.includes('68'));
    });

    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 200 });
    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 1, status: 'Active' });
    expect(projectsService.list).toHaveBeenCalledWith({ page: 1, pageSize: 1, status: 'Closed' });

    const kpiCards = Array.from(container.querySelectorAll('.ops-projects-kpis [role="listitem"]'));
    expect(kpiCards[0]?.textContent).toContain('235');
    expect(kpiCards[1]?.textContent).toContain('145');
    expect(kpiCards[2]?.textContent).toContain('68');
  });
});
