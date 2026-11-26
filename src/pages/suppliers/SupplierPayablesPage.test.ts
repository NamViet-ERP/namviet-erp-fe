import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { supplierPayablesService } from '../../services/supplierPayablesService';
import { downloadCsv } from '../../lib/csvExport';
import { formatCurrencyFull } from '../../utils/formatCurrency';
import type { SupplierPayableReportApiDto } from '../../types/api/purchasingApi';
import SupplierPayablesPage from './SupplierPayablesPage';

let mockCanPay = true;

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => ({
    has: () => mockCanPay,
    hasAny: () => mockCanPay,
    hasAll: () => mockCanPay,
  }),
}));

vi.mock('../../services/supplierPayablesService', () => ({
  supplierPayablesService: {
    getReport: vi.fn(),
    snapshot: vi.fn(),
  },
}));

vi.mock('../../lib/csvExport', () => ({
  downloadCsv: vi.fn().mockResolvedValue(true),
}));

function LocationProbe() {
  const loc = useLocation();
  return createElement('span', { 'data-location-search': loc.search });
}

function getLocationSearch(rootEl: HTMLElement): string {
  return rootEl.querySelector('[data-location-search]')?.getAttribute('data-location-search') ?? '';
}

function makeReport(overrides: Partial<SupplierPayableReportApiDto> = {}): SupplierPayableReportApiDto {
  return {
    kpis: {
      outstandingTotal: 520_000_000,
      overdueTotal: 180_000_000,
      overdueSupplierCount: 1,
      overLimitSupplierCount: 1,
    },
    aging: [
      { key: 'current', label: 'Chưa đến hạn', amount: 340_000_000, count: 2 },
      { key: 'd1_30', label: 'Quá hạn 1-30 ngày', amount: 180_000_000, count: 1 },
      { key: 'd31_60', label: 'Quá hạn 31-60 ngày', amount: 0, count: 0 },
      { key: 'd61_90', label: 'Quá hạn 61-90 ngày', amount: 0, count: 0 },
      { key: 'over90', label: 'Quá hạn trên 90 ngày', amount: 0, count: 0 },
    ],
    suppliers: [
      {
        supplierId: 101,
        supplierCode: 'NCC-HP01',
        supplierName: 'Công ty Cổ phần Thép Hòa Phát',
        poCount: 3,
        projectCount: 2,
        requested: 600_000_000,
        paid: 200_000_000,
        outstanding: 400_000_000,
        creditLimit: 350_000_000,
        overLimit: true,
        overdueAmount: 180_000_000,
        overdueCount: 1,
        unpaidCount: 2,
      },
      {
        supplierId: 102,
        supplierCode: 'NCC-TL02',
        supplierName: 'Công ty TNHH Thiết bị Điện Tiến Lợi',
        poCount: 2,
        projectCount: 1,
        requested: 240_000_000,
        paid: 120_000_000,
        outstanding: 120_000_000,
        creditLimit: null,
        overLimit: false,
        overdueAmount: 0,
        overdueCount: 0,
        unpaidCount: 1,
      },
      {
        supplierId: 103,
        supplierCode: 'NCC-XM03',
        supplierName: 'Tổng Công ty Xi măng VICEM Hà Tiên',
        poCount: 1,
        projectCount: 1,
        requested: 95_000_000,
        paid: 95_000_000,
        outstanding: 0,
        creditLimit: 500_000_000,
        overLimit: false,
        overdueAmount: 0,
        overdueCount: 0,
        unpaidCount: 0,
      },
    ],
    upcoming7Total: 120_000_000,
    upcoming30Total: 340_000_000,
    upcoming: [
      {
        paymentCode: 'DNTT-2026-021',
        poCode: 'PO-2026-112',
        projectCode: 'DA-NHONTRACH-03',
        supplierId: 102,
        supplierName: 'Công ty TNHH Thiết bị Điện Tiến Lợi',
        dueDate: '2026-12-02',
        outstanding: 120_000_000,
        daysUntilDue: 6,
      },
    ],
    lines: [
      {
        paymentCode: 'DNTT-2026-018',
        poCode: 'PO-2026-098',
        poDate: '2026-10-15',
        projectCode: 'DA-NHONTRACH-03',
        projectName: 'Nhà máy Nhiệt điện Nhơn Trạch 3',
        supplierId: 101,
        supplierCode: 'NCC-HP01',
        supplierName: 'Công ty Cổ phần Thép Hòa Phát',
        stageNumber: 1,
        requested: 180_000_000,
        paid: 0,
        outstanding: 180_000_000,
        dueDate: '2026-11-11',
        daysOverdue: 15,
        lineStatus: 'overdue',
        paymentStatus: 'submitted',
        paymentTerm: 'Net 30',
        paidAt: null,
        paidByName: null,
      },
      {
        paymentCode: 'DNTT-2026-021',
        poCode: 'PO-2026-112',
        poDate: '2026-11-05',
        projectCode: 'DA-NHONTRACH-03',
        projectName: 'Nhà máy Nhiệt điện Nhơn Trạch 3',
        supplierId: 102,
        supplierCode: 'NCC-TL02',
        supplierName: 'Công ty TNHH Thiết bị Điện Tiến Lợi',
        stageNumber: 2,
        requested: 240_000_000,
        paid: 120_000_000,
        outstanding: 120_000_000,
        dueDate: '2026-12-02',
        daysOverdue: 0,
        lineStatus: 'partial',
        paymentStatus: 'submitted',
        paymentTerm: 'Tạm ứng 50%',
        paidAt: null,
        paidByName: null,
      },
      {
        paymentCode: 'DNTT-2026-015',
        poCode: 'PO-2026-077',
        poDate: '2026-10-01',
        projectCode: 'DA-LONGTHANH-01',
        projectName: 'Sân bay Quốc tế Long Thành - GĐ1',
        supplierId: 103,
        supplierCode: 'NCC-XM03',
        supplierName: 'Tổng Công ty Xi măng VICEM Hà Tiên',
        stageNumber: 1,
        requested: 95_000_000,
        paid: 95_000_000,
        outstanding: 0,
        dueDate: '2026-10-31',
        daysOverdue: 0,
        lineStatus: 'paid',
        paymentStatus: 'paid',
        paymentTerm: 'Thanh toán ngay',
        paidAt: '2026-10-29T09:15:00Z',
        paidByName: 'Trần Thị Thu Hà',
      },
    ],
    ...overrides,
  };
}

function setControlValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

beforeEach(() => {
  mockCanPay = true;
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.resetAllMocks();
  vi.mocked(downloadCsv).mockResolvedValue(true);
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });

  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
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

async function flushQueries() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 40));
  });
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 40));
  });
}

async function renderPage(initialEntry = '/suppliers/debt') {
  await act(async () => {
    root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(
          MemoryRouter,
          { initialEntries: [initialEntry] },
          createElement(LocationProbe),
          createElement(SupplierPayablesPage),
        ),
      ),
    );
  });
  await flushQueries();
}

describe('SupplierPayablesPage characterization', () => {
  it('renders overview KPI & aging cards, summary table, upcoming schedule, and DNTT lines', async () => {
    vi.mocked(supplierPayablesService.getReport).mockResolvedValue(makeReport());

    await renderPage();

    expect(container.textContent).toContain('Công nợ NCC');

    const overview = container.querySelector('.sup-ap-overview');
    expect(overview).toBeTruthy();
    expect(overview?.textContent).toContain(formatCurrencyFull(520_000_000));
    expect(overview?.textContent).toContain(formatCurrencyFull(180_000_000));
    expect(overview?.textContent).toContain('NCC đang quá hạn');
    expect(overview?.textContent).toContain('NCC vượt hạn mức');
    expect(overview?.textContent).toContain('Chưa đến hạn');
    expect(overview?.textContent).toContain('Quá hạn 1-30 ngày');
    expect(overview?.textContent).toContain('Cần TT 7 ngày');
    expect(overview?.textContent).toContain(formatCurrencyFull(120_000_000));
    expect(overview?.textContent).toContain(formatCurrencyFull(340_000_000));

    // Summary table
    expect(container.textContent).toContain('Công nợ theo nhà cung cấp');
    expect(container.textContent).toContain('NCC-HP01');
    expect(container.textContent).toContain('Công ty Cổ phần Thép Hòa Phát');
    expect(container.textContent).toContain('Vượt hạn mức');
    expect(container.textContent).toContain('1 DNTT quá hạn');
    expect(container.textContent).toContain('Không giới hạn');
    expect(container.textContent).toContain('Không nợ');

    // Upcoming 30-day schedule
    expect(container.textContent).toContain('Lịch thanh toán sắp tới');
    expect(container.textContent).toContain('còn 6 ngày');
    const upcomingLink = container.querySelector('a[href="/purchasing/payments/DNTT-2026-021"]');
    expect(upcomingLink?.textContent).toContain('Ghi nhận TT');

    // Detailed DNTT lines
    const linesWrap = container.querySelector('#sup-ap-lines');
    expect(linesWrap).toBeTruthy();
    expect(linesWrap?.textContent).toContain('Quá hạn 15 ngày');
    expect(linesWrap?.textContent).toContain('TT một phần - còn');
    expect(linesWrap?.textContent).toContain('DNTT-2026-021 - đợt 2');
    expect(linesWrap?.textContent).toContain('Đã TT đủ');
    expect(linesWrap?.textContent).toContain('Trần Thị Thu Hà');
    expect(
      linesWrap?.querySelector('.hrm-table-col-actions a[href="/purchasing/orders/PO-2026-077"]')?.textContent,
    ).toContain('Xem PO');
    expect(
      linesWrap?.querySelector('.hrm-table-col-actions a[href="/purchasing/payments/DNTT-2026-018"]')?.textContent,
    ).toContain('Xác nhận TT');
  });

  it('clicking "Lọc DNTT" in summary table updates URL ?supplierId=... and refetches with supplierId', async () => {
    vi.mocked(supplierPayablesService.getReport).mockResolvedValue(makeReport());

    await renderPage();

    const filterBtns = Array.from(container.querySelectorAll('button')).filter(b =>
      b.textContent?.trim() === 'Lọc DNTT',
    );
    expect(filterBtns.length).toBe(3);

    await act(async () => {
      filterBtns[0]!.click();
    });
    await flushQueries();

    expect(getLocationSearch(container)).toBe('?supplierId=101');
    expect(supplierPayablesService.getReport).toHaveBeenLastCalledWith({
      supplierId: 101,
      status: undefined,
      search: undefined,
    });
    expect(container.textContent).toContain('Đang lọc theo Công ty Cổ phần Thép Hòa Phát.');

    const selectEl = container.querySelector('#sup-ap-lines')?.parentElement?.querySelector('select') as HTMLSelectElement;
    expect(selectEl).toBeTruthy();
    expect(selectEl.value).toBe('101');
  });

  it('filters by ApFilterTabs, supplier select, search bar, and resets all filters with "Xóa lọc"', async () => {
    vi.mocked(supplierPayablesService.getReport).mockResolvedValue(makeReport());

    await renderPage();

    // 1) Click status tab "Quá hạn"
    const overdueTab = Array.from(container.querySelectorAll('[role="tab"]')).find(el =>
      el.textContent?.trim() === 'Quá hạn',
    ) as HTMLButtonElement;
    expect(overdueTab).toBeTruthy();
    await act(async () => {
      overdueTab.click();
    });
    await flushQueries();
    expect(overdueTab.getAttribute('aria-selected')).toBe('true');
    expect(supplierPayablesService.getReport).toHaveBeenLastCalledWith({
      supplierId: undefined,
      status: 'overdue',
      search: undefined,
    });

    // 2) Change supplier select
    const selectEl = container.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      setControlValue(selectEl, '102');
    });
    await flushQueries();
    expect(getLocationSearch(container)).toBe('?supplierId=102');
    expect(supplierPayablesService.getReport).toHaveBeenLastCalledWith({
      supplierId: 102,
      status: 'overdue',
      search: undefined,
    });

    // 3) Type into SearchBar
    const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement;
    await act(async () => {
      setControlValue(searchInput, 'DNTT-2026-021');
    });
    await flushQueries();
    expect(supplierPayablesService.getReport).toHaveBeenLastCalledWith({
      supplierId: 102,
      status: 'overdue',
      search: 'DNTT-2026-021',
    });

    // 4) Reset filters via "Xóa lọc"
    const resetBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.trim() === 'Xóa lọc',
    ) as HTMLButtonElement;
    expect(resetBtn).toBeTruthy();
    await act(async () => {
      resetBtn.click();
    });
    await flushQueries();

    expect(getLocationSearch(container)).toBe('');
    expect(searchInput.value).toBe('');
    expect(selectEl.value).toBe('');
    const allTab = Array.from(container.querySelectorAll('[role="tab"]')).find(el =>
      el.textContent?.trim() === 'Tất cả',
    );
    expect(allTab?.getAttribute('aria-selected')).toBe('true');
    expect(supplierPayablesService.getReport).toHaveBeenLastCalledWith({
      supplierId: undefined,
      status: undefined,
      search: undefined,
    });
    const resetAfter = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.trim() === 'Xóa lọc',
    );
    expect(resetAfter).toBeUndefined();
  });

  it('exports CSV with expected headers and rows when clicking "Xuất CSV"', async () => {
    vi.mocked(supplierPayablesService.getReport).mockResolvedValue(makeReport());

    await renderPage();

    const exportBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Xuất CSV'),
    ) as HTMLButtonElement;
    expect(exportBtn).toBeTruthy();
    expect(exportBtn.disabled).toBe(false);

    await act(async () => {
      exportBtn.click();
    });

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [fileName, header, rows] = vi.mocked(downloadCsv).mock.calls[0]!;
    expect(fileName).toMatch(/^CongNo_NCC_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(header).toEqual([
      'NCC', 'Mã NCC', 'Dự án', 'PO', 'DNTT', 'Ngày PO', 'Giá trị', 'Điều khoản',
      'Hạn TT', 'Đã thanh toán', 'Còn nợ', 'Trạng thái', 'Số ngày quá hạn',
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual([
      'Công ty Cổ phần Thép Hòa Phát',
      'NCC-HP01',
      'Nhà máy Nhiệt điện Nhơn Trạch 3',
      'PO-2026-098',
      'DNTT-2026-018',
      '2026-10-15',
      180_000_000,
      'Net 30',
      '2026-11-11',
      0,
      180_000_000,
      'Quá hạn 15 ngày',
      15,
    ]);
    expect(rows[2]?.[11]).toContain('Đã TT đủ');
    expect(rows[2]?.[11]).toContain('Trần Thị Thu Hà');
  });

  it('renders empty state truthfully when report has no suppliers, upcoming items, or lines', async () => {
    vi.mocked(supplierPayablesService.getReport).mockResolvedValue(
      makeReport({
        suppliers: [],
        upcoming: [],
        lines: [],
        upcoming7Total: 0,
        upcoming30Total: 0,
      }),
    );

    await renderPage();

    const exportBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Xuất CSV'),
    ) as HTMLButtonElement;
    expect(exportBtn.disabled).toBe(true);
    expect(container.textContent).toContain('Chưa có đề nghị thanh toán nào được lập.');
    expect(container.textContent).toContain('Không có DNTT nào phù hợp bộ lọc.');
    expect(container.textContent).not.toContain('Lịch thanh toán sắp tới');
  });

  it('shows read-only "Xem DNTT" action when lacking payment permission', async () => {
    mockCanPay = false;
    vi.mocked(supplierPayablesService.getReport).mockResolvedValue(makeReport());

    await renderPage('/suppliers/debt?supplierId=101');

    const linesWrap = container.querySelector('#sup-ap-lines');
    expect(
      linesWrap?.querySelector('.hrm-table-col-actions a[href="/purchasing/payments/DNTT-2026-018"]')?.textContent,
    ).toContain('Xem DNTT');
    expect(container.textContent).not.toContain('Ghi nhận TT');
    expect(supplierPayablesService.getReport).toHaveBeenCalledWith({
      supplierId: 101,
      status: undefined,
      search: undefined,
    });
  });

  it('renders error board when report loading fails', async () => {
    vi.mocked(supplierPayablesService.getReport).mockRejectedValue(new Error('Không kết nối được máy chủ công nợ'));

    await renderPage();

    expect(container.textContent).toContain('Không tải được dữ liệu công nợ.');
  });
});
