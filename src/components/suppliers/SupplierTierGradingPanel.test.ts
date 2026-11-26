import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSuppliers } from '../../hooks/useSuppliers';
import SupplierTierGradingPanel from './SupplierTierGradingPanel';

vi.mock('../../hooks/useSuppliers', () => ({
  useSuppliers: vi.fn(),
}));

describe('SupplierTierGradingPanel', () => {
  let container: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.mocked(useSuppliers).mockReturnValue({
      data: {
        items: [
          {
            id: 201,
            supplierCode: 'NCC-HP01',
            supplierName: 'Công ty Cổ phần Thép Hòa Phát',
            taxCode: '0301234567',
            supplierType: 'Nhà sản xuất',
            scope: 'Trong nước',
            maxDebtDays: 30,
            rating: 'B',
            approvalStatus: 'approved',
            isBlacklisted: false,
            purchasedRevenue: 850_000_000,
          },
        ],
        totalCount: 1,
        totalPages: 1,
        page: 1,
        pageSize: 20,
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSuppliers>);

    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    client.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders rating filter using canonical hrm-filter-select-wrap and hrm-filter-select classes', async () => {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(SupplierTierGradingPanel),
        ),
      );
    });

    const selectWrap = container.querySelector('.erp-filter-toolbar .hrm-filter-select-wrap');
    expect(selectWrap).not.toBeNull();
    expect(selectWrap?.classList.contains('hrm-field')).toBe(true);

    const selectEl = selectWrap?.querySelector('select.hrm-filter-select') as HTMLSelectElement | null;
    expect(selectEl).not.toBeNull();
    expect(selectEl?.getAttribute('aria-label')).toBe('Lọc phân hạng');
  });
});
