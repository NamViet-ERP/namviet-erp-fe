import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatDateVi } from '../../lib/hrm/formatters';
import { purchasingProgressMeta, showGanttActualMark } from '../../lib/wms/purchasingProgressStatus';
import type { ProjectPurchasingProgressApiDto } from '../../types/wms';
import PurchasingGanttInspectBar from './gantt/PurchasingGanttInspectBar';
import {
  buildTree,
  collectDates,
  dayTicks,
  daysBetween,
  flattenVisible,
  fmt,
  HEADER_H,
  isOpen,
  kindLabel,
  MIN_BAR_PX,
  monthTicks,
  PX_PER_DAY,
  ROW_H,
  titleHasKindPrefix,
  todayYmd,
  ymd,
  type GanttNode,
} from './gantt/purchasingGanttModel';

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
    const dates = collectDates(groups, today);
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
          <span className="ops-gantt__bar-wrap" style={{ left: startX, width: barW }} aria-hidden>
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
        <p><span className="ops-gantt__swatch ops-tone--ok" aria-hidden />Đủ hàng / nhập thực tế</p>
        <p><span className="ops-gantt__swatch ops-tone--late" aria-hidden />Trễ giao - quá hạn trên PO, dù chưa nhập đủ</p>
        <p><span className="ops-gantt__swatch ops-tone--live" aria-hidden />Đang giao / nhập dự kiến</p>
        <p><span className="ops-gantt__swatch ops-tone--planned" aria-hidden />Chưa giao / nháp nhập</p>
        <p><span className="ops-gantt__swatch ops-gantt__swatch--today" aria-hidden />Hôm nay</p>
        <p><span className="ops-gantt__swatch ops-gantt__swatch--mark ops-tone--ok" aria-hidden />Chấm xanh = đã nhập thực tế</p>
      </div>

      <div
        className="ops-gantt__board"
        style={{ ['--gantt-day' as string]: `${PX_PER_DAY}px` }}
        onMouseLeave={() => setHoverId(null)}
      >
        <div ref={labelsRef} className="ops-gantt__labels" onScroll={() => syncPaneScroll('labels')}>
          <div className="ops-gantt__label ops-gantt__label--head" style={{ height: HEADER_H }}>
            Dự án / phiếu
          </div>
          {renderLabelTree(tree)}
        </div>

        <div ref={chartRef} className="ops-gantt__chart" onScroll={() => syncPaneScroll('chart')}>
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

      <PurchasingGanttInspectBar hovered={hovered} />
    </div>
  );
}
