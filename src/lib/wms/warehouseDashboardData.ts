import type { Import, Export, Transfer } from '../../types';
import type { StockMatrixRowApiDto, WarehouseProjectApiDto } from '../../types/wms';

export interface TrendDataPoint {
  month: string;
  imports: number;
  exports: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface DashboardActivityItem {
  type: string;
  label: string;
  value: string;
  time: string;
  accent: string;
}

export interface DashboardMiniStat {
  label: string;
  value: string;
  color: string;
}

export interface WarehouseDashboardData {
  totalStock: number;
  totalValue: number;
  activeProjects: number;
  trendData: TrendDataPoint[];
  stockByCategory: CategoryDataPoint[];
  stockByWarehouse: CategoryDataPoint[];
  recentActivity: DashboardActivityItem[];
  miniStats: DashboardMiniStat[];
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

function parseDdMmYyyy(date: string): Date | null {
  const parts = date.trim().split('/');
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

function last6Months(): { year: number; month: number; label: string }[] {
  const result: { year: number; month: number; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `T${d.getMonth() + 1}`,
    });
  }
  return result;
}

function inCalendarMonth(dateStr: string, year: number, month: number): boolean {
  const d = parseDdMmYyyy(dateStr);
  return Boolean(d && d.getFullYear() === year && d.getMonth() === month);
}

function isToday(dateStr: string): boolean {
  const d = parseDdMmYyyy(dateStr);
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
  );
}

export function buildWarehouseDashboardData(
  imports: Import[],
  exports: Export[],
  transfers: Transfer[],
  matrix: StockMatrixRowApiDto[],
  projects: WarehouseProjectApiDto[],
): WarehouseDashboardData {
  const trendData = last6Months().map(({ year, month, label }) => ({
    month: label,
    imports: imports.filter(i => inCalendarMonth(i.date, year, month)).length,
    exports: exports.filter(e => inCalendarMonth(e.date, year, month)).length,
  }));

  const materialQty = matrix
    .map(row => {
      const projectQty = row.projects.reduce((sum, p) => sum + p.actualQty, 0);
      return {
        name: row.materialName,
        value: row.generalActualQty + projectQty,
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const stockByCategory: CategoryDataPoint[] = materialQty.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const projectQtyMap = new Map<string, number>();
  for (const row of matrix) {
    for (const project of row.projects) {
      const label = project.projectName || project.projectCode;
      projectQtyMap.set(label, (projectQtyMap.get(label) ?? 0) + project.actualQty);
    }
  }

  const stockByWarehouse: CategoryDataPoint[] = [...projectQtyMap.entries()]
    .filter(([, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const totalStock = matrix.reduce(
    (sum, row) => sum + row.generalActualQty + row.projects.reduce((p, x) => p + x.actualQty, 0),
    0,
  );

  const totalValue = matrix.reduce((sum, row) => {
    const qty = row.generalActualQty + row.projects.reduce((p, x) => p + x.actualQty, 0);
    return sum + qty * (row.weightedAverageUnitCost ?? 0);
  }, 0);

  const activeProjects = projects.filter(p => p.status !== 'Closed').length;

  const vouchers = [
    ...imports.map(i => ({
      voucherCode: i.voucherCode,
      date: i.date,
      type: 'import' as const,
      itemCount: i.items.length,
    })),
    ...exports.map(e => ({
      voucherCode: e.voucherCode,
      date: e.date,
      type: 'export' as const,
      itemCount: e.items.length,
    })),
    ...transfers.map(t => ({
      voucherCode: t.voucherCode,
      date: t.date,
      type: 'transfer' as const,
      itemCount: t.items.length,
    })),
  ].sort(
    (a, b) =>
      (parseDdMmYyyy(b.date)?.getTime() ?? 0) - (parseDdMmYyyy(a.date)?.getTime() ?? 0),
  );

  const typeMeta = {
    import: { prefix: 'Nhập kho', accent: 'var(--status-success)', sign: '+' },
    export: { prefix: 'Xuất kho', accent: 'var(--status-error)', sign: '-' },
    transfer: { prefix: 'Chuyển kho', accent: 'var(--status-warning)', sign: '' },
  } as const;

  const recentActivity: DashboardActivityItem[] = vouchers.slice(0, 5).map(v => {
    const meta = typeMeta[v.type];
    return {
      type: v.type,
      label: `${meta.prefix} #${v.voucherCode}`,
      value: `${meta.sign}${v.itemCount} dòng VT`.trim(),
      time: v.date,
      accent: meta.accent,
    };
  });

  const pendingCount = [...imports, ...exports, ...transfers].filter(v => v.status === 'pending').length;

  const miniStats: DashboardMiniStat[] = [
    {
      label: 'Nhập hôm nay',
      value: `${imports.filter(i => isToday(i.date)).length} phiếu`,
      color: 'var(--status-success)',
    },
    {
      label: 'Xuất hôm nay',
      value: `${exports.filter(e => isToday(e.date)).length} phiếu`,
      color: 'var(--status-warning)',
    },
    {
      label: 'Chờ duyệt',
      value: `${pendingCount} phiếu`,
      color: 'var(--status-error)',
    },
    {
      label: 'Mã vật tư',
      value: `${matrix.length} mặt hàng`,
      color: 'var(--chart-5)',
    },
  ];

  return {
    totalStock,
    totalValue,
    activeProjects,
    trendData,
    stockByCategory,
    stockByWarehouse,
    recentActivity,
    miniStats,
  };
}
