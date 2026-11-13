import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { purchasePlansService } from '../../services/purchasePlansService';
import PurchasePlansPage from './PurchasePlansPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/purchasePlansService', () => ({
  purchasePlansService: {
    list: vi.fn(),
    getByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    has: () => true,
    hasAny: () => true,
    hasAll: () => true,
  }),
}));

vi.mock('../../components/purchasing/CreatePurchasePlanModal', () => ({
  default: () => null,
}));

vi.mock('../../components/purchasing/PurchasePlanVariancePanel', () => ({
  default: () => null,
}));

vi.mock('../../components/ui/ConfirmDialog', () => ({
  default: () => null,
}));

vi.mock('../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

const mockPlans = [
  {
    code: 'KHMH-2026-001',
    projectName: 'Dự án Lò Hơi 30T',
    projectCode: 'DA-LH30T',
    status: 'draft',
    budgetTotal: 100000000,
    proposalTotal: 95000000,
    purchaseTotal: 90000000,
    paidTotal: 50000000,
    createdAt: '2026-11-10T08:00:00Z',
    note: 'Đợt 1',
  },
  {
    code: 'KHMH-2026-002',
    projectName: 'Dự án Cẩu Trục',
    projectCode: 'DA-CT',
    status: 'rejected',
    budgetTotal: 50000000,
    proposalTotal: 48000000,
    purchaseTotal: 0,
    paidTotal: 0,
    createdAt: '2026-11-11T09:30:00Z',
    note: 'Bị từ chối do vượt ngân sách',
    rejectReason: 'Vượt ngân sách quý 4',
  },
];

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  vi.mocked(purchasePlansService.list).mockResolvedValue({
    items: mockPlans as never,
    totalCount: mockPlans.length,
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

async function renderPage(kind: 'plan' | 'adhoc' = 'plan') {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(MemoryRouter, null, createElement(PurchasePlansPage, { kind })),
      ),
    );
  });
  await flushQueries();
}

describe('PurchasePlansPage Clickable Rows & Navigation', () => {
  it('renders data rows with cursor-pointer, pur-erp__row-clickable, role="button", and title', async () => {
    await renderPage();
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const firstRow = rows[0] as HTMLTableRowElement;
    expect(firstRow.className).toContain('pur-erp__row-clickable');
    expect(firstRow.className).toContain('cursor-pointer');
    expect(firstRow.getAttribute('role')).toBe('button');
    expect(firstRow.getAttribute('tabindex')).toBe('0');
    expect(firstRow.getAttribute('title')).toBe('Nhấn để xem chi tiết KHMH-2026-001');

    const rejectedRow = rows[1] as HTMLTableRowElement;
    expect(rejectedRow.className).toContain('pur-erp__row-clickable');
    expect(rejectedRow.className).toContain('cursor-pointer');
    expect(rejectedRow.className).toContain('pur-erp__row--rejected');
    expect(rejectedRow.getAttribute('title')).toBe('Nhấn để xem chi tiết KHMH-2026-002');
  });

  it('navigates to plan detail when row is clicked', async () => {
    await renderPage();
    const firstRow = container.querySelectorAll('tbody tr')[0] as HTMLTableRowElement;
    act(() => {
      firstRow.click();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/purchasing/plans/KHMH-2026-001');
  });

  it('navigates to plan detail on Enter and Space keydown', async () => {
    await renderPage();
    const firstRow = container.querySelectorAll('tbody tr')[0] as HTMLTableRowElement;

    act(() => {
      firstRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/purchasing/plans/KHMH-2026-001');

    mockNavigate.mockClear();

    act(() => {
      firstRow.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/purchasing/plans/KHMH-2026-001');

    mockNavigate.mockClear();

    // Other keys should not navigate
    act(() => {
      firstRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('stops propagation when clicking on actions column, preventing row navigation', async () => {
    await renderPage();
    const firstRow = container.querySelectorAll('tbody tr')[0] as HTMLTableRowElement;
    const actionsCell = firstRow.querySelector('.pur-erp__td-actions') as HTMLTableCellElement;
    expect(actionsCell).toBeTruthy();

    act(() => {
      actionsCell.click();
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    const dropdownTrigger = actionsCell.querySelector('button') as HTMLButtonElement;
    if (dropdownTrigger) {
      act(() => {
        dropdownTrigger.click();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    }
  });

  it('stops propagation when clicking on code cell', async () => {
    await renderPage();
    const firstRow = container.querySelectorAll('tbody tr')[0] as HTMLTableRowElement;
    const codeCell = firstRow.querySelector('.pur-erp__td-code') as HTMLTableCellElement;
    expect(codeCell).toBeTruthy();

    act(() => {
      codeCell.click();
    });
    // The row navigation should not be called from the code cell click event
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to adhoc route when kind is adhoc', async () => {
    await renderPage('adhoc');
    const firstRow = container.querySelectorAll('tbody tr')[0] as HTMLTableRowElement;

    act(() => {
      firstRow.click();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/purchasing/adhoc/KHMH-2026-001');
  });
});
