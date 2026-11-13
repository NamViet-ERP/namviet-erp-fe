import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsService } from '../../services/projectsService';
import type { WarehouseProjectApiDto } from '../../types/wms';
import ProjectsPage from './ProjectsPage';

vi.mock('../../services/projectsService', () => ({
  projectsService: {
    list: vi.fn(),
    getByCode: vi.fn(),
    getNextCode: vi.fn(),
    getInventory: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    closeProject: vi.fn(),
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

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const mockProjects: WarehouseProjectApiDto[] = [
  {
    projectCode: 'DA-2026-001',
    projectName: 'Nhà máy Mayzer Bình Dương',
    projectType: 'EPC',
    pmId: '00000000-0000-0000-0000-000000000001',
    pmName: 'Nguyễn Văn A',
    startDate: '2026-01-15T00:00:00Z',
    endDate: null,
    materialBudget: 1000000,
    status: 'Active',
    clientName: null,
    scMembers: null,
    stockActualQty: 0,
    stockPlannedQty: 0,
    stockReservedQty: 0,
    stockMaterialCount: 0,
    approvedImportValue: 0,
    materialBudgetRemaining: 1000000,
    warehouseKeepers: [{ userId: 'k1', displayName: 'Thủ kho Nam' }],
    stage: null,
  },
  {
    projectCode: 'DA-2026-002',
    projectName: 'Khu công nghiệp VSIP III',
    projectType: 'EPC',
    pmId: '00000000-0000-0000-0000-000000000002',
    pmName: 'Trần Văn B',
    startDate: '2026-02-01T00:00:00Z',
    endDate: null,
    materialBudget: 2000000,
    status: 'Active',
    clientName: null,
    scMembers: null,
    stockActualQty: 50,
    stockPlannedQty: 100,
    stockReservedQty: 20,
    stockMaterialCount: 18,
    approvedImportValue: 500000,
    materialBudgetRemaining: 1500000,
    warehouseKeepers: [],
    stage: null,
  },
];

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  vi.mocked(projectsService.list).mockResolvedValue({
    items: mockProjects,
    totalCount: mockProjects.length,
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
        createElement(MemoryRouter, null, createElement(ProjectsPage)),
      ),
    );
  });
  await flushQueries();
}

describe('ProjectsPage Table Action Column Alignment', () => {
  it('renders "Thao tác" header centered with project-col-actions class', async () => {
    await renderPage();

    const headers = [...container.querySelectorAll('thead th')];
    const actionHeader = headers.find(th => th.textContent?.trim() === 'Thao tác');

    expect(actionHeader).toBeDefined();
    expect(actionHeader?.className).toContain('text-center');
    expect(actionHeader?.className).toContain('project-col-actions');
    expect(actionHeader?.className).not.toContain('text-right');
  });

  it('renders action cells centered with project-col-actions class and justify-center container', async () => {
    await renderPage();

    const actionCells = [...container.querySelectorAll('tbody td.project-col-actions')];
    expect(actionCells).toHaveLength(2);

    actionCells.forEach(cell => {
      expect(cell.className).toContain('text-center');
      expect(cell.className).not.toContain('text-right');

      const flexContainer = cell.querySelector('div');
      expect(flexContainer).not.toBeNull();
      expect(flexContainer?.className).toContain('justify-center');
      expect(flexContainer?.className).not.toContain('justify-end');
    });
  });

  it('renders trash action with identical w-8 h-8 dimensions in both active and disabled states', async () => {
    await renderPage();

    // Row 1: stockMaterialCount === 0 -> active delete button
    const deleteBtn = container.querySelector('button[aria-label="Xóa kho dự án DA-2026-001"]');
    expect(deleteBtn).not.toBeNull();
    expect(deleteBtn?.className).toContain('w-8');
    expect(deleteBtn?.className).toContain('h-8');
    expect(deleteBtn?.className).toContain('p-0');
    expect(deleteBtn?.className).toContain('inline-flex');
    expect(deleteBtn?.className).toContain('items-center');
    expect(deleteBtn?.className).toContain('justify-center');

    // Row 2: stockMaterialCount === 18 -> disabled delete span
    const disabledSpan = container.querySelector(
      'span[title="Kho đã có mặt hàng, không thể xóa"]',
    );
    expect(disabledSpan).not.toBeNull();
    expect(disabledSpan?.className).toContain('w-8');
    expect(disabledSpan?.className).toContain('h-8');
    expect(disabledSpan?.className).toContain('p-0');
    expect(disabledSpan?.className).toContain('inline-flex');
    expect(disabledSpan?.className).toContain('items-center');
    expect(disabledSpan?.className).toContain('justify-center');
  });
});
