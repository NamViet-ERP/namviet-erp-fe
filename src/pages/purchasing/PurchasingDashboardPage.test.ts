import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PurchasingDashboardPage from './PurchasingDashboardPage';

const mockFetchNextPage = vi.fn();

vi.mock('../../hooks/useActivityRealtime', () => ({
  useActivityRealtime: () => ({ connected: true }),
}));

vi.mock('../../hooks/usePurchasingDashboard', () => ({
  usePurchasingDashboardSummary: () => ({
    isLoading: false,
    data: { generatedAt: '2026-11-25T10:30:00Z' },
  }),
  usePurchasingDashboardVouchers: () => ({
    plans: { show: true, stats: [{ label: 'Nháp', value: 2, tone: 'info' }, { label: 'Đã duyệt', value: 4, tone: 'ok' }] },
    adhoc: { show: true, stats: [{ label: 'Chờ duyệt', value: 1, tone: 'warn' }] },
    orders: { show: true, stats: [{ label: 'Đang giao', value: 3, tone: 'info' }] },
    estimates: { show: false, stats: [] },
    contracts: { show: true, stats: [{ label: 'Hiệu lực', value: 5, tone: 'ok' }] },
    paymentPlans: { show: false, stats: [] },
    payments: { show: true, stats: [{ label: 'Đã gửi', value: 2, tone: 'warn' }] },
    warranties: { show: true, stats: [{ label: 'Còn hạn', value: 6, tone: 'ok' }] },
  }),
  usePurchasingActivityFeed: () => ({
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    fetchNextPage: mockFetchNextPage,
    data: {
      pages: [
        {
          items: [
            {
              id: 1,
              actorName: 'Nguyễn Minh Tuấn',
              occurredAt: '2026-11-25T10:00:00Z',
              categoryLabel: 'KHMH',
              message: 'Đã duyệt KHMH-2026-014 cho Dự án Nhơn Trạch 3',
            },
          ],
        },
      ],
    },
  }),
  usePurchasingActivityActors: () => ({
    isSuccess: true,
    data: [{ userId: 'u-1', name: 'Nguyễn Minh Tuấn' }],
  }),
}));

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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

describe('PurchasingDashboardPage characterization', () => {
  it('renders KPI strip tiles, activity feed items, and triggers Tải thêm', async () => {
    await act(async () => {
      root.render(
        createElement(
          QueryClientProvider,
          { client },
          createElement(MemoryRouter, null, createElement(PurchasingDashboardPage)),
        ),
      );
    });

    expect(container.textContent).toContain('Dashboard mua hàng');
    expect(container.textContent).toContain('Cập nhật lúc');

    const kpiGrid = container.querySelector('[aria-label="Số phiếu mua hàng"]');
    expect(kpiGrid).toBeTruthy();
    expect(kpiGrid?.textContent).toContain('Kế hoạch mua hàng');
    expect(kpiGrid?.textContent).toContain('Mua hàng phát sinh');
    expect(kpiGrid?.textContent).toContain('Đơn hàng');
    expect(kpiGrid?.textContent).toContain('Hợp đồng');
    expect(kpiGrid?.textContent).toContain('Đề nghị thanh toán');
    expect(kpiGrid?.textContent).toContain('Bảo hành / Khiếu nại');
    expect(kpiGrid?.textContent).not.toContain('Mua hàng dự toán');

    expect(container.textContent).toContain('Lịch sử hoạt động');
    expect(container.textContent).toContain('Nguyễn Minh Tuấn');
    expect(container.textContent).toContain('Đã duyệt KHMH-2026-014 cho Dự án Nhơn Trạch 3');

    const loadMoreBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Tải thêm'),
    );
    expect(loadMoreBtn).toBeTruthy();
    act(() => {
      loadMoreBtn!.click();
    });
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });
});
