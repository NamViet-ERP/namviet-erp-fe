import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatDateVi } from '../../lib/hrm/formatters';
import {
  dueAwareStatus,
  purchasingProgressMeta,
  receiptGanttSpan,
  receiptProgressStatus,
  showGanttActualMark,
} from '../../lib/wms/purchasingProgressStatus';
import type { ProjectPurchasingProgressApiDto } from '../../types/wms';

const ROW_H = 42;
const HEADER_H = 40;
const PX_PER_DAY = 28;
const MIN_BAR_PX = PX_PER_DAY;

type GanttKind = 'project' | 'plan' | 'po' | 'line' | 'nk';

type GanttNode = {
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

function ymd(value: string): string {
  return value.slice(0, 10);
}

function todayYmd(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function parseYmd(value: string): Date {
  const trimmed = value.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const vi = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vi) return new Date(Number(vi[3]), Number(vi[2]) - 1, Number(vi[1]));
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? new Date(1970, 0, 1) : d;
}

function daysBetween(from: string, to: string): number {
  const delta = parseYmd(to).getTime() - parseYmd(from).getTime();
  if (Number.isNaN(delta)) return 0;
  return Math.round(delta / 86_400_000);
}

function fmt(value?: string | null): string {
  return formatDateVi(value ?? undefined) ?? '-';
}

function kindLabel(kind: GanttKind, title?: string): string {
  if (kind === 'project') return 'Dự án';
  if (kind === 'plan') return /^mhps([\s_-]|$)/i.test(title?.trim() ?? '') ? 'MHPS' : 'KHMH';
  if (kind === 'po') return 'PO';
  if (kind === 'nk') return 'NK';
  return 'VT';
}

function titleHasKindPrefix(kind: GanttKind, title: string): boolean {
  const t = title.trim();
  if (kind === 'po') return /^po([\s_-]|$)/i.test(t);
  if (kind === 'nk') return /^nk([\s_-]|$)/i.test(t);
  if (kind === 'plan') return /^(khmh|mhps|kh)([\s_-]|$)/i.test(t);
  if (kind === 'line') return /^(vt|vật tư)([\s_-]|$)/i.test(t);
  return /^(dự án|du an)\b/i.test(t);
}

function formatQty(value: number): string {
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

function buildOrderNode(
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

function monthTicks(minDate: string, totalDays: number): { x: number; label: string }[] {
  const ticks: { x: number; label: string }[] = [];
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

function dayTicks(minDate: string, totalDays: number): { x: number; label: string }[] {
  const ticks: { x: number; label: string }[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const d = parseYmd(minDate);
    d.setDate(d.getDate() + i);
    ticks.push({ x: i * PX_PER_DAY, label: String(d.getDate()) });
  }
  return ticks;
}

function isOpen(open: Record<string, boolean>, id: string, fallback: boolean): boolean {
  return open[id] ?? fallback;
}

function buildTree(
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

function collectDates(groups: ProjectPurchasingProgressApiDto[]): string[] {
  const dates: string[] = [todayYmd()];
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

function flattenVisible(nodes: GanttNode[], out: GanttNode[] = []): GanttNode[] {
  for (const node of nodes) {
    out.push(node);
    if (node.children.length > 0) flattenVisible(node.children, out);
  }
  return out;
}

export default function ProjectPurchasingGantt({
  groups,
}: {
  groups: ProjectPurchasingProgressApiDto[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [hoverId, setHoverId] = useState<string | null>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const scrollLock = useRef(false);
  const tree = useMemo(() => buildTree(groups, open), [groups, open]);

  const syncPaneScroll = (source: 'labels' | 'chart') => {
    const labels = labelsRef.current;
    const chart = chartRef.current;
    if (!labels || !chart || scrollLock.current) return;
    scrollLock.current = true;
    if (source === 'labels') chart.scrollTop = labels.scrollTop;
    else labels.scrollTop = chart.scrollTop;
    requestAnimationFrame(() => {
      scrollLock.current = false;
    });
  };
  const rows = useMemo(() => flattenVisible(tree), [tree]);
  const today = todayYmd();
  const timeline = useMemo(() => {
    const dates = collectDates(groups);
    if (dates.length === 0) return null;
    const minDate = dates.reduce((a, b) => (ymd(a) < ymd(b) ? a : b));
    const maxDate = dates.reduce((a, b) => (ymd(a) > ymd(b) ? a : b));
    const totalDays = Math.max(14, daysBetween(minDate, maxDate) + 4);
    const chartWidth = Math.max(totalDays * PX_PER_DAY, 320);
    const todayX = Math.max(0, daysBetween(minDate, today) * PX_PER_DAY);
    return { minDate, totalDays, chartWidth, todayX };
  }, [groups, today]);

  useEffect(() => {
    if (!timeline) return;
    const chart = chartRef.current;
    if (!chart) return;
    chart.scrollLeft = Math.max(0, timeline.todayX - Math.round(chart.clientWidth * 0.28));
  }, [timeline]);

  if (!timeline) return null;

  const { minDate, totalDays, chartWidth, todayX } = timeline;
  const todayMid = todayX + PX_PER_DAY / 2;
  const todayDateLabel = formatDateVi(today) ?? today;
  const months = monthTicks(minDate, totalDays);
  const days = dayTicks(minDate, totalDays);
  const hovered = rows.find(r => r.id === hoverId) ?? null;
  const hoveredMeta = hovered ? purchasingProgressMeta(hovered.status) : null;

  const toggle = (id: string, fallback: boolean) => {
    setOpen(prev => ({ ...prev, [id]: !(prev[id] ?? fallback) }));
  };

  const renderLabel = (node: GanttNode) => {
    const meta = purchasingProgressMeta(node.status);
    const expanded = isOpen(open, node.id, node.defaultOpen ?? false);
    return (
      <div
        className={`ops-gantt__label ops-gantt__label--${node.kind} ops-tone--${meta.tone}${hoverId === node.id ? ' is-hover' : ''}`}
        style={{ height: ROW_H }}
        onMouseEnter={() => setHoverId(node.id)}
      >
        {node.expandable ? (
          <button
            type="button"
            className="ops-gantt__toggle"
            aria-expanded={expanded}
            aria-label={expanded ? `Thu gọn ${node.title}` : `Mở ${node.title}`}
            onFocus={() => setHoverId(node.id)}
            onClick={() => toggle(node.id, node.defaultOpen ?? false)}
          >
            {expanded ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
          </button>
        ) : (
          <span className="ops-gantt__toggle-spacer" aria-hidden />
        )}
        <div className="ops-gantt__label-text">
          <strong>
            {titleHasKindPrefix(node.kind, node.title) ? null : (
              <span className={`ops-gantt__kind ops-gantt__kind--${node.kind}`}>{kindLabel(node.kind, node.title)}</span>
            )}
            <span className="ops-gantt__title">{node.title}</span>
          </strong>
          <span>{node.subtitle}</span>
        </div>
        <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
      </div>
    );
  };

  const renderTrack = (node: GanttNode) => {
    const meta = purchasingProgressMeta(node.status);
    const startX = Math.max(0, daysBetween(minDate, node.plannedStart) * PX_PER_DAY);
    const endX = Math.max(startX, daysBetween(minDate, node.plannedEnd || node.plannedStart) * PX_PER_DAY);
    const isNkPoint = node.kind === 'nk' && node.plannedStart === node.plannedEnd;
    const barW = isNkPoint ? 8 : Math.max(MIN_BAR_PX, endX - startX + PX_PER_DAY);
    const actualX = node.actualEnd != null
      ? Math.max(0, daysBetween(minDate, node.actualEnd) * PX_PER_DAY)
      : null;
    const showMark = showGanttActualMark(node.kind, node.status, node.actualEnd, node.percentComplete);
    const showPlanBar = !(isNkPoint && showMark);
    return (
      <div
        className={`ops-gantt__track ops-gantt__track--${node.kind}${hoverId === node.id ? ' is-hover' : ''}`}
        style={{ height: ROW_H }}
        onMouseEnter={() => setHoverId(node.id)}
      >
        {showPlanBar ? (
          <span
            className="ops-gantt__bar-wrap"
            style={{ left: startX, width: barW }}
            aria-hidden
          >
            <span className={`ops-gantt__bar ops-gantt__bar--${node.kind} ops-tone--${meta.tone}`} />
          </span>
        ) : null}
        {showMark ? (
          <span
            className="ops-gantt__mark ops-tone--ok"
            style={{ left: actualX ?? 0 }}
            title={`Nhập thực tế ${fmt(node.actualEnd)}`}
            aria-hidden
          />
        ) : null}
      </div>
    );
  };

  const renderLabelTree = (nodes: GanttNode[]) =>
    nodes.map(node => (
      <div key={node.id} className="ops-gantt__folder">
        {renderLabel(node)}
        {node.children.length > 0 ? (
          <div className={`ops-gantt__kids ops-gantt__kids--${node.kind}`}>
            {renderLabelTree(node.children)}
          </div>
        ) : null}
      </div>
    ));

  const renderTrackTree = (nodes: GanttNode[]) =>
    nodes.map(node => (
      <div key={node.id} className="ops-gantt__folder">
        {renderTrack(node)}
        {node.children.length > 0 ? (
          <div className={`ops-gantt__kids ops-gantt__kids--${node.kind}`}>
            {renderTrackTree(node.children)}
          </div>
        ) : null}
      </div>
    ));

  return (
    <div className="ops-gantt">
      <div className="ops-gantt__guide" aria-label="Cách đọc Gantt">
        <p>
          <span className="ops-gantt__swatch ops-tone--ok" aria-hidden />
          Đủ hàng / nhập thực tế
        </p>
        <p>
          <span className="ops-gantt__swatch ops-tone--late" aria-hidden />
          Trễ giao - quá hạn trên PO, dù chưa nhập đủ
        </p>
        <p>
          <span className="ops-gantt__swatch ops-tone--live" aria-hidden />
          Đang giao / nhập dự kiến
        </p>
        <p>
          <span className="ops-gantt__swatch ops-tone--planned" aria-hidden />
          Chưa giao / nháp nhập
        </p>
        <p>
          <span className="ops-gantt__swatch ops-gantt__swatch--today" aria-hidden />
          Hôm nay
        </p>
        <p>
          <span className="ops-gantt__swatch ops-gantt__swatch--mark ops-tone--ok" aria-hidden />
          Chấm xanh = đã nhập thực tế
        </p>
      </div>

      <div
        className="ops-gantt__board"
        style={{ ['--gantt-day' as string]: `${PX_PER_DAY}px` }}
        onMouseLeave={() => setHoverId(null)}
      >
        <div
          ref={labelsRef}
          className="ops-gantt__labels"
          onScroll={() => syncPaneScroll('labels')}
        >
          <div className="ops-gantt__label ops-gantt__label--head" style={{ height: HEADER_H }}>
            Dự án / phiếu
          </div>
          {renderLabelTree(tree)}
        </div>

        <div
          ref={chartRef}
          className="ops-gantt__chart"
          onScroll={() => syncPaneScroll('chart')}
        >
          <div className="ops-gantt__timeline" style={{ width: chartWidth }}>
            <div className="ops-gantt__timehead" style={{ height: HEADER_H }}>
              {months.map(tick => (
                <span key={`m-${tick.label}-${tick.x}`} className="ops-gantt__month" style={{ left: tick.x }}>
                  {tick.label}
                </span>
              ))}
              {days.map(tick => (
                <span
                  key={`d-${tick.label}-${tick.x}`}
                  className={`ops-gantt__day${tick.x === todayX ? ' ops-gantt__day--today' : ''}`}
                  style={{ left: tick.x, width: PX_PER_DAY }}
                  title={tick.x === todayX ? `Hôm nay ${todayDateLabel}` : undefined}
                >
                  {tick.label}
                </span>
              ))}
            </div>
            <div className="ops-gantt__today-col" style={{ left: todayX, top: HEADER_H }} aria-hidden />
            <div className="ops-gantt__today" style={{ left: todayMid, top: HEADER_H }} aria-hidden />
            {renderTrackTree(tree)}
          </div>
        </div>
      </div>

      <p className="ops-gantt__inspect" role="status">
        {hovered && hoveredMeta ? (
          <>
            <span className={`badge ${hoveredMeta.badgeClass}`}>{hoveredMeta.label}</span>
            <strong>{hovered.title}</strong>
            <span>Kế hoạch {fmt(hovered.plannedStart)} - {fmt(hovered.plannedEnd)}</span>
            {hovered.kind === 'nk' ? (
              <>
                <span className="tabular-nums">SL {formatQty(hovered.ordered ?? 0)}</span>
                <span>
                  {hovered.actualEnd
                    ? `Nhập thực tế ${fmt(hovered.actualEnd)}`
                    : 'Chưa duyệt - không tính đã nhận'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {hovered.actualEnd && (hovered.status === 'completed' || (hovered.percentComplete ?? 0) >= 100)
                    ? `Nhập kho ${fmt(hovered.actualEnd)}`
                    : hovered.status === 'late'
                      ? 'Quá hạn giao, chưa nhập đủ'
                      : hovered.actualEnd
                        ? `Đã nhập một phần ${fmt(hovered.actualEnd)}`
                        : 'Chưa nhập kho'}
                </span>
                {hovered.ordered != null ? (
                  <span className="tabular-nums">
                    Đã nhận {hovered.received}/{hovered.ordered} ({hovered.percentComplete}%)
                  </span>
                ) : null}
              </>
            )}
          </>
        ) : (
          <span>Rê chuột vào thanh để xem ngày. Bấm mũi tên để sổ KHMH/MHPS, PO, phiếu NK và vật tư.</span>
        )}
      </p>
    </div>
  );
}
