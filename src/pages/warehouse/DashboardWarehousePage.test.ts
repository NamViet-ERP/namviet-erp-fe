import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WMS_ERROR } from '../../lib/wms/messages';
import {
  emptyWarehouseDashboardData,
  type WarehouseDashboardData,
} from '../../lib/wms/warehouseDashboardData';
import type { WmsLowStockAlertApiDto } from '../../types/api/wms/opsApi';
import DashboardWarehousePage from './DashboardWarehousePage';

interface DashboardHookResult {
  data: WarehouseDashboardData | null;
  isLoading: boolean;
  isError: boolean;
  refetch: ReturnType<typeof vi.fn>;
  isRefetching: boolean;
}

const mockUseWarehouseDashboard = vi.fn<() => DashboardHookResult>();
const mockUseLowStockAlerts = vi.fn<() => { data: WmsLowStockAlertApiDto[] }>();
const mockUseCanViewWmsPrices = vi.fn<() => boolean>();

vi.mock('../../hooks/useWarehouseDashboard', () => ({
  useWarehouseDashboard: () => mockUseWarehouseDashboard(),
}));

vi.mock('../../hooks/useLowStockAlerts', () => ({
  useLowStockAlerts: () => mockUseLowStockAlerts(),
}));

vi.mock('../../lib/wms/priceVisibility', () => ({
  useCanViewWmsPrices: () => mockUseCanViewWmsPrices(),
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function buildPopulatedDashboardData(): WarehouseDashboardData {
  return {
    totalStock: 1450,
    totalValue: 2_850_000_000,
    activeProjects: 6,
    miniStats: [
      { label: 'Chờ duyệt', value: '4', color: 'var(--md-error)' },
      { label: 'Nhập hôm nay', value: '3', color: 'var(--md-success)' },
      { label: 'Xuất hôm nay', value: '5', color: 'var(--nv-amber)' },
    ],
    trendData: [
      { month: 'T6', imports: 320_000_000, exports: 210_000_000 },
      { month: 'T7', imports: 450_000_000, exports: 390_000_000 },
      { month: 'T8', imports: 510_000_000, exports: 420_000_000 },
      { month: 'T9', imports: 380_000_000, exports: 340_000_000 },
      { month: 'T10', imports: 620_000_000, exports: 480_000_000 },
      { month: 'T11', imports: 570_000_000, exports: 460_000_000 },
    ],
    stockByCategory: [
      { name: 'Thép hình H300', value: 850, color: 'var(--nv-action)' },
      { name: 'Ống thép đúc DN150', value: 600, color: 'var(--md-success)' },
    ],
    stockByWarehouse: [
      { name: 'Dự án Cầu Rạch Miễu 2', value: 920, color: 'var(--nv-action)' },
      { name: 'Kho trung tâm Tân Bình', value: 530, color: 'var(--md-success)' },
    ],
    recentActivity: [
      { type: 'import', label: 'NK-2026-018 · Thép hình H300', value: '+120 Cây', time: '08:15', accent: 'var(--md-success)' },
      { type: 'export', label: 'XK-2026-041 · Dự án Cầu Rạch Miễu 2', value: '-45 Cây', time: '09:00', accent: 'var(--nv-amber)' },
      { type: 'import', label: 'NK-2026-019 · Công ty TNHH VLXD Minh Long', value: '+80 Tấn', time: '10:20', accent: 'var(--md-success)' },
      { type: 'transfer', label: 'CK-2026-009 · Chuyển kho Cầu Rạch Miễu 2', value: '30 Bộ', time: '11:05', accent: 'var(--nv-action)' },
      { type: 'export', label: 'XK-2026-042 · Bu lông neo M24', value: '-200 Bộ', time: '13:30', accent: 'var(--nv-amber)' },
      { type: 'import', label: 'NK-2026-020 · Xi măng PCB40 Hà Tiên', value: '+500 Bao', time: '14:45', accent: 'var(--md-success)' },
      { type: 'export', label: 'XK-2026-043 · Thép tấm SS400 12mm', value: '-18 Tấm', time: '16:10', accent: 'var(--nv-amber)' },
    ],
  };
}

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.resetAllMocks();

  mockUseCanViewWmsPrices.mockReturnValue(true);
  mockUseLowStockAlerts.mockReturnValue({ data: [] });
  mockUseWarehouseDashboard.mockReturnValue({
    data: buildPopulatedDashboardData(),
    isLoading: false,
    isError: false,
    refetch: vi.fn().mockResolvedValue(undefined),
    isRefetching: false,
  });

  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function renderDashboard() {
  await act(async () => {
    root.render(
      createElement(
        MemoryRouter,
        null,
        createElement(DashboardWarehousePage),
      ),
    );
  });
}

describe('DashboardWarehousePage Characterization', () => {
  it('renders PageLoader while dashboard data is loading', async () => {
    mockUseWarehouseDashboard.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    });

    await renderDashboard();

    const loader = container.querySelector('.page-loader[role="status"]');
    expect(loader).not.toBeNull();
    expect(container.textContent).toContain('Đang tải...');
    expect(container.querySelector('.warehouse-dash')).toBeNull();
  });

  it('renders error banner, placeholder KPI values, and calls refetch when Retry is clicked', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    mockUseWarehouseDashboard.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch,
      isRefetching: false,
    });

    await renderDashboard();

    const errorAlert = container.querySelector('.alert-banner--error[role="alert"]');
    expect(errorAlert).not.toBeNull();
    expect(errorAlert?.textContent).toContain(WMS_ERROR.loadDefault);

    const retryBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Thử lại'),
    ) as HTMLButtonElement | undefined;
    expect(retryBtn).toBeDefined();
    expect(retryBtn?.disabled).toBe(false);

    await act(async () => {
      retryBtn!.click();
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    const kpiValues = [...container.querySelectorAll('.kpi-card__value')].map(el =>
      el.textContent?.trim(),
    );
    expect(kpiValues.length).toBeGreaterThanOrEqual(6);
    expect(kpiValues.every(v => v === '-')).toBe(true);
  });

  it('renders low-stock alert banner with project and material EntityCodeLink anchors', async () => {
    mockUseLowStockAlerts.mockReturnValue({
      data: [
        {
          projectCode: 'DA-CRM2-2026',
          projectName: 'Dự án Cầu Rạch Miễu 2',
          materialCode: 'VT-THEP-001',
          materialName: 'Thép hình H300',
          unit: 'Cây',
          actualQty: 12,
          minStockQty: 50,
          shortageQty: 38,
        },
        {
          projectCode: 'DA-NV-2026',
          projectName: 'Nhà máy xử lý nước thải Bình Chánh',
          materialCode: 'VT-ONG-012',
          materialName: 'Ống thép đúc DN150',
          unit: 'Mét',
          actualQty: 25,
          minStockQty: 100,
          shortageQty: 75,
        },
      ],
    });

    await renderDashboard();

    const warningAlert = container.querySelector('.alert-banner--warning[role="alert"]');
    expect(warningAlert).not.toBeNull();
    expect(warningAlert?.textContent).toContain('2 cảnh báo tồn dưới ngưỡng tối thiểu');
    expect(warningAlert?.textContent).toContain('(12/50 Cây)');

    const links = [...warningAlert!.querySelectorAll('a')];
    expect(links.some(a => a.textContent?.trim() === 'DA-CRM2-2026' && a.getAttribute('href') === '/warehouse/projects/DA-CRM2-2026')).toBe(true);
    expect(links.some(a => a.textContent?.trim() === 'VT-THEP-001' && a.getAttribute('href') === '/warehouse/materials')).toBe(true);
  });

  it('renders both KPI strips with accurate tone accents and hides price KPI + trend chart when price permission is false', async () => {
    await renderDashboard();

    const opsStrip = container.querySelector('[role="list"][aria-label="Việc cần xử lý"]');
    const kpiStrip = container.querySelector('[role="list"][aria-label="Chỉ số kho"]');
    expect(opsStrip).not.toBeNull();
    expect(kpiStrip).not.toBeNull();

    expect(opsStrip?.querySelector('.kpi-card--accent-danger')?.textContent).toContain('Chờ duyệt');
    expect(opsStrip?.querySelector('.kpi-card--accent-success')?.textContent).toContain('Nhập hôm nay');
    expect(opsStrip?.querySelector('.kpi-card--accent-warning')?.textContent).toContain('Xuất hôm nay');

    expect(kpiStrip?.querySelector('.kpi-card--accent-info')?.textContent).toContain('Tồn tất cả kho');
    expect(kpiStrip?.querySelector('.kpi-card--accent-warning')?.textContent).toContain('Tổng giá trị');
    expect(kpiStrip?.querySelector('.kpi-card--accent-neutral')?.textContent).toContain('Kho dự án hoạt động');

    expect(container.textContent).toContain('1.450');
    expect(container.textContent).toContain('2.9 tỷ');
    expect(container.textContent).toContain('Thép hình H300');
    expect(container.textContent).toContain('Dự án Cầu Rạch Miễu 2');

    // Re-render without price viewing permission
    mockUseCanViewWmsPrices.mockReturnValue(false);
    await renderDashboard();

    expect(container.textContent).not.toContain('Tổng giá trị');
    expect(container.textContent).toContain('Biểu đồ giá trị nhập/xuất yêu cầu quyền xem giá.');
  });

  it('renders empty states for all charts and activity feed when data arrays are empty', async () => {
    mockUseWarehouseDashboard.mockReturnValue({
      data: emptyWarehouseDashboardData(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    });

    await renderDashboard();

    expect(container.textContent).toContain('Chưa có giá trị nhập/xuất trong 6 tháng gần đây.');
    expect(container.textContent).toContain('Chưa có số lượng tồn kho.');
    expect(container.textContent).toContain('Chưa có tồn kho theo kho dự án.');
    expect(container.textContent).toContain('Chưa có hoạt động phiếu kho.');
  });

  it('toggles Nhật ký kho between 5 preview items and all items via Xem thêm / Thu gọn', async () => {
    await renderDashboard();

    expect(container.querySelectorAll('.activity-feed__item')).toHaveLength(5);
    expect(container.textContent).toContain('NK-2026-018 · Thép hình H300');
    expect(container.textContent).not.toContain('NK-2026-020 · Xi măng PCB40 Hà Tiên');

    const expandBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Xem thêm (2)'),
    ) as HTMLButtonElement | undefined;
    expect(expandBtn).toBeDefined();

    await act(async () => {
      expandBtn!.click();
    });

    expect(container.querySelectorAll('.activity-feed__item')).toHaveLength(7);
    expect(container.querySelector('.activity-feed-scroll')).not.toBeNull();
    expect(container.textContent).toContain('NK-2026-020 · Xi măng PCB40 Hà Tiên');

    const collapseBtn = [...container.querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Thu gọn'),
    ) as HTMLButtonElement | undefined;
    expect(collapseBtn).toBeDefined();

    await act(async () => {
      collapseBtn!.click();
    });

    expect(container.querySelectorAll('.activity-feed__item')).toHaveLength(5);
    expect(container.querySelector('.activity-feed-scroll')).toBeNull();
  });
});
