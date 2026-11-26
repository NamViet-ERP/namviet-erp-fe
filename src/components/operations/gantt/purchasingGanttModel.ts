import { formatDateVi } from '../../../lib/hrm/formatters';
import {
  dueAwareStatus,
  receiptGanttSpan,
  receiptProgressStatus,
  todayYmdLocal,
} from '../../../lib/wms/purchasingProgressStatus';
import type { ProjectPurchasingProgressApiDto } from '../../../types/wms';

export const ROW_H = 42;
export const HEADER_H = 40;
export const PX_PER_DAY = 28;
export const MIN_BAR_PX = PX_PER_DAY;

export type GanttKind = 'project' | 'plan' | 'po' | 'line' | 'nk';

export type GanttNode = {
  id: string;
  kind: GanttKind;
  title: string;
  subtitle: string;
  plannedStart: string;
  plannedEnd: string;
  actualEnd?: string | null;
  status: string;
  percentComplete: number;
  ordered?: number;
  received?: number;
  expandable?: boolean;
  defaultOpen?: boolean;
  children: GanttNode[];
};

export type GanttTick = {
  x: number;
  label: string;
};

export function ymd(value: string): string {
  return value.slice(0, 10);
}

export function todayYmd(): string {
  return todayYmdLocal();
}

export function parseYmd(value: string): Date {
  const trimmed = value.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const vi = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vi) return new Date(Number(vi[3]), Number(vi[2]) - 1, Number(vi[1]));
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? new Date(1970, 0, 1) : d;
}

export function daysBetween(from: string, to: string): number {
  const delta = parseYmd(to).getTime() - parseYmd(from).getTime();
  if (Number.isNaN(delta)) return 0;
  return Math.round(delta / 86_400_000);
}

export function fmt(value?: string | null): string {
  return formatDateVi(value ?? undefined) ?? '-';
}

export function kindLabel(kind: GanttKind, title?: string): string {
  if (kind === 'project') return 'Dự án';
  if (kind === 'plan') return /^mhps([\s_-]|$)/i.test(title?.trim() ?? '') ? 'MHPS' : 'KHMH';
  if (kind === 'po') return 'PO';
  if (kind === 'nk') return 'NK';
  return 'VT';
}

export function titleHasKindPrefix(kind: GanttKind, title: string): boolean {
  const t = title.trim();
  if (kind === 'po') return /^po([\s_-]|$)/i.test(t);
  if (kind === 'nk') return /^nk([\s_-]|$)/i.test(t);
  if (kind === 'plan') return /^(khmh|mhps|kh)([\s_-]|$)/i.test(t);
  if (kind === 'line') return /^(vt|vật tư)([\s_-]|$)/i.test(t);
  return /^(dự án|du an)\b/i.test(t);
}

export function formatQty(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function orderReceipts(order: ProjectPurchasingProgressApiDto['orders'][number]) {
  return order.receipts ?? [];
}

function projectPlans(project: ProjectPurchasingProgressApiDto) {
  return project.plans ?? [];
}

function receiptLines(
  receipt: ProjectPurchasingProgressApiDto['orders'][number]['receipts'][number],
) {
  return receipt.lines ?? [];
}

function skuKey(value?: string | null): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isOpen(open: Record<string, boolean>, id: string, fallback: boolean): boolean {
  return open[id] ?? fallback;
}

export function buildOrderNode(
  projectCode: string,
  order: ProjectPurchasingProgressApiDto['orders'][number],
  open: Record<string, boolean>,
): GanttNode {
  const poKey = `${projectCode}:${order.poCode}`;
  const receipts = orderReceipts(order);
  const orderOpen = isOpen(open, poKey, receipts.length > 0);
  const coveredSkus = new Set<string>();
  const coveredNames = new Set<string>();
  for (const receipt of receipts) {
    for (const item of receiptLines(receipt)) {
      const sku = skuKey(item.sku);
      const name = skuKey(item.name);
      if (sku) coveredSkus.add(sku);
      if (name) coveredNames.add(name);
    }
  }
  const leftoverLines = order.lines.filter(line => {
    const sku = skuKey(line.sku);
    const name = skuKey(line.name);
    if (sku && coveredSkus.has(sku)) return false;
    if (name && coveredNames.has(name)) return false;
    return true;
  });
  const leftoverNodes: GanttNode[] = leftoverLines.map(line => ({
    id: `${poKey}:${line.id}`,
    kind: 'line' as const,
    title: line.name,
    subtitle: line.sku,
    plannedStart: line.plannedStart,
    plannedEnd: line.plannedEnd,
    actualEnd: line.actualEnd,
    status: dueAwareStatus(line.status, line.plannedEnd),
    percentComplete: line.percentComplete,
    ordered: line.ordered,
    received: line.received,
    children: [],
  }));
  const nkNodes: GanttNode[] = receipts.map(receipt => {
    const span = receiptGanttSpan(receipt.status, receipt.date, order.plannedEnd);
    const nkStatus = receiptProgressStatus(receipt.status, order.plannedEnd);
    const nkKey = `${poKey}:nk:${receipt.ticketCode}`;
    const items = receiptLines(receipt);
    const nkOpen = isOpen(open, nkKey, items.length > 0);
    return {
      id: nkKey,
      kind: 'nk' as const,
      title: receipt.ticketCode,
      subtitle: formatQty(receipt.quantity),
      plannedStart: span.plannedStart,
      plannedEnd: span.plannedEnd,
      actualEnd: span.actualEnd,
      status: nkStatus,
      percentComplete: receipt.status === 'approved' ? 100 : 0,
      ordered: receipt.quantity,
      received: receipt.status === 'approved' ? receipt.quantity : 0,
      expandable: items.length > 0,
      defaultOpen: items.length > 0,
      children: nkOpen
        ? items.map((item, index) => ({
            id: `${nkKey}:${index}:${item.sku || 'vt'}`,
            kind: 'line' as const,
            title: item.name,
            subtitle: item.sku,
            plannedStart: span.plannedStart,
            plannedEnd: span.plannedEnd,
            actualEnd: null,
            status: nkStatus,
            percentComplete: receipt.status === 'approved' ? 100 : 0,
            ordered: item.quantity,
            received: receipt.status === 'approved' ? item.quantity : 0,
            children: [],
          }))
        : [],
    };
  });
  return {
    id: poKey,
    kind: 'po',
    title: order.poCode,
    subtitle: order.supplierName?.trim() || order.planCode,
    plannedStart: order.plannedStart,
    plannedEnd: order.plannedEnd,
    actualEnd: order.actualEnd,
    status: dueAwareStatus(order.status, order.plannedEnd),
    percentComplete: order.percentComplete,
    ordered: order.ordered,
    received: order.received,
    expandable: leftoverLines.length > 0 || receipts.length > 0,
    defaultOpen: receipts.length > 0,
    children: orderOpen ? [...nkNodes, ...leftoverNodes] : [],
  };
}

export function monthTicks(minDate: string, totalDays: number): GanttTick[] {
  const ticks: GanttTick[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const d = parseYmd(minDate);
    d.setDate(d.getDate() + i);
    if (i === 0 || d.getDate() === 1) {
      ticks.push({
        x: i * PX_PER_DAY,
        label: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`,
      });
    }
  }
  return ticks;
}

export function dayTicks(minDate: string, totalDays: number): GanttTick[] {
  const ticks: GanttTick[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const d = parseYmd(minDate);
    d.setDate(d.getDate() + i);
    ticks.push({ x: i * PX_PER_DAY, label: String(d.getDate()) });
  }
  return ticks;
}

export function buildTree(
  groups: ProjectPurchasingProgressApiDto[],
  open: Record<string, boolean>,
): GanttNode[] {
  return groups.map(project => {
    const ordered = project.orders.reduce((s, o) => s + o.ordered, 0);
    const received = project.orders.reduce((s, o) => s + o.received, 0);
    const projectOpen = isOpen(open, project.projectCode, true);
    const plans = projectPlans(project);
    const linked = new Set(plans.map(p => p.planCode.trim().toLowerCase()));
    const orphanOrders = project.orders.filter(o => {
      const code = (o.planCode ?? '').trim().toLowerCase();
      return !code || !linked.has(code);
    });
    const children: GanttNode[] = [];
    if (projectOpen) {
      for (const plan of plans) {
        const planKey = `${project.projectCode}:plan:${plan.planCode}`;
        const planOpen = isOpen(open, planKey, plan.orders.length > 0);
        children.push({
          id: planKey,
          kind: 'plan',
          title: plan.planCode,
          subtitle: plan.kind === 'adhoc' ? 'Mua hàng phát sinh' : 'Kế hoạch mua hàng',
          plannedStart: plan.plannedStart,
          plannedEnd: plan.plannedEnd,
          actualEnd: plan.actualEnd,
          status: plan.orders.length > 0
            ? dueAwareStatus(plan.status, plan.plannedEnd)
            : plan.status,
          percentComplete: plan.percentComplete,
          ordered: plan.ordered,
          received: plan.received,
          expandable: plan.orders.length > 0,
          defaultOpen: plan.orders.length > 0,
          children: planOpen
            ? plan.orders.map(order => buildOrderNode(project.projectCode, order, open))
            : [],
        });
      }
      for (const order of orphanOrders) {
        children.push(buildOrderNode(project.projectCode, order, open));
      }
    }
    return {
      id: project.projectCode,
      kind: 'project' as const,
      title: project.projectName,
      subtitle: project.projectCode,
      plannedStart: project.plannedStart ?? todayYmd(),
      plannedEnd: project.plannedEnd ?? project.plannedStart ?? todayYmd(),
      actualEnd: project.actualEnd,
      status: dueAwareStatus(project.status, project.plannedEnd),
      percentComplete: project.percentComplete,
      ordered,
      received,
      expandable: plans.length > 0 || project.orders.length > 0,
      defaultOpen: true,
      children,
    };
  });
}

export function collectDates(groups: ProjectPurchasingProgressApiDto[], anchorToday: string = todayYmd()): string[] {
  const dates: string[] = [anchorToday];
  for (const project of groups) {
    if (project.plannedStart) dates.push(project.plannedStart);
    if (project.plannedEnd) dates.push(project.plannedEnd);
    if (project.actualEnd) dates.push(project.actualEnd);
    for (const order of project.orders) {
      dates.push(order.plannedStart, order.plannedEnd);
      if (order.actualEnd) dates.push(order.actualEnd);
      for (const receipt of orderReceipts(order)) {
        dates.push(receipt.date);
      }
      for (const line of order.lines) {
        dates.push(line.plannedStart, line.plannedEnd);
        if (line.actualEnd) dates.push(line.actualEnd);
      }
    }
    for (const plan of projectPlans(project)) {
      dates.push(plan.plannedStart, plan.plannedEnd);
      if (plan.actualEnd) dates.push(plan.actualEnd);
    }
  }
  return dates;
}

export function flattenVisible(nodes: GanttNode[], out: GanttNode[] = []): GanttNode[] {
  for (const node of nodes) {
    out.push(node);
    if (node.children.length > 0) flattenVisible(node.children, out);
  }
  return out;
}
