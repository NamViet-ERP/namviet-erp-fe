import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SuppliersDashboardCharts from './SuppliersDashboardCharts';

type CapturedChart = {
  kind: 'bar' | 'line';
  margin?: { top?: number; right?: number; left?: number; bottom?: number };
};

type CapturedYAxis = {
  width?: number;
  tickFormatter?: (value: unknown, index: number) => string;
};

const capturedCharts: CapturedChart[] = [];
const capturedYAxes: CapturedYAxis[] = [];

vi.mock('recharts', async importOriginal => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) =>
      createElement('div', { className: 'recharts-responsive-container' }, children),
    BarChart: ({ children, margin }: { children?: ReactNode; margin?: CapturedChart['margin'] }) => {
      capturedCharts.push({ kind: 'bar', margin });
      return createElement('div', { className: 'recharts-wrapper', 'data-chart': 'bar' }, children);
    },
    LineChart: ({ children, margin }: { children?: ReactNode; margin?: CapturedChart['margin'] }) => {
      capturedCharts.push({ kind: 'line', margin });
      return createElement('div', { className: 'recharts-wrapper', 'data-chart': 'line' }, children);
    },
    YAxis: (props: CapturedYAxis) => {
      capturedYAxes.push({ width: props.width, tickFormatter: props.tickFormatter });
      return createElement('div', { className: 'recharts-yAxis' });
    },
    XAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Bar: () => null,
    Line: () => null,
  };
});

describe('SuppliersDashboardCharts', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    capturedCharts.length = 0;
    capturedYAxes.length = 0;
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('passes widened margins, width=74 YAxis, and non-duplicate tickFormatter to both charts', async () => {
    await act(async () => {
      root.render(
        createElement(SuppliersDashboardCharts, {
          loading: false,
          debtBySupplier: [
            { supplierId: 101, supplierName: 'Công ty CP Thép Hòa Phát', debt: 700_000, paid: 350_000, remaining: 350_000 },
          ],
          trend: [
            { month: '10/2026', debt: 1_050_000, payment: 700_000 },
            { month: '11/2026', debt: 1_400_000, payment: 1_050_000 },
          ],
        }),
      );
    });

    expect(capturedCharts).toHaveLength(2);
    expect(capturedCharts[0]).toEqual({ kind: 'bar', margin: { top: 8, right: 12, left: 10, bottom: 8 } });
    expect(capturedCharts[1]).toEqual({ kind: 'line', margin: { top: 8, right: 12, left: 10, bottom: 8 } });

    expect(capturedYAxes).toHaveLength(2);
    for (const axis of capturedYAxes) {
      expect(axis.width).toBe(74);
      const fmt = axis.tickFormatter!;
      expect(fmt(0, 0)).toBe('0');
      expect(fmt(350_000, 1)).toBe('350.000');
      expect(fmt(700_000, 2)).toBe('700.000');
      expect(fmt(1_000_000, 3)).toBe('1 tr');
      expect(fmt(1_050_000, 4)).toBe('1.1 tr');
      expect(fmt(1_400_000, 5)).toBe('1.4 tr');
      expect(fmt(1_200_000_000, 6)).toBe('1.2 tỷ');
      expect(fmt(2_000_000_000, 7)).toBe('2 tỷ');
    }
  });

  it('renders empty states when debtBySupplier and trend are empty', async () => {
    await act(async () => {
      root.render(
        createElement(SuppliersDashboardCharts, {
          loading: false,
          debtBySupplier: [],
          trend: [],
        }),
      );
    });

    expect(container.textContent).toContain('Chưa có đề nghị thanh toán nào trong kỳ đã chọn.');
    expect(container.textContent).toContain('Chưa có dữ liệu theo tháng trong kỳ đã chọn.');
  });
});
