import type { CskhProgressSnapshot } from '../../../lib/cskh/opsWorkspace';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatSignedPct } from '../../../lib/cskh/commandCenter';
import { isoToDisplay, parseIsoDate } from '../../../lib/dates';
import type { CskhGanttItem } from '../../../lib/cskh/opsWorkspace';
import { ganttItemPlanPct } from '../../../lib/cskh/opsWorkspace';
import { countWbsDescendants } from '../../../lib/cskh/chainYarn30tData';

import type { TimeScaleMode } from '../../../lib/cskh/ganttUtils';
import { buildTimelineStructure, calculateItemBar,
  CHAIN_YARN_MILESTONE_PINS, DEFAULT_MILESTONE_PINS
} from '../../../lib/cskh/ganttUtils';

export function CskhGanttTimelineChart({
  items,
  allItems,
  onSelectRow,
  scaleMode = 'decade',
  todayStr = '2026-09-22',
  showCompare = false,
  prevSnapshot,
  collapsedIds,
  onToggleCollapse,
}: {
  items: CskhGanttItem[];
  allItems?: CskhGanttItem[];
  onSelectRow?: (item: CskhGanttItem) => void;
  scaleMode?: TimeScaleMode;
  todayStr?: string;
  showCompare?: boolean;
  prevSnapshot?: CskhProgressSnapshot;
  collapsedIds?: Set<string>;
  onToggleCollapse?: (id: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const treeSource = allItems ?? items;

  const timeline = useMemo(() => {
    return buildTimelineStructure(treeSource, scaleMode, todayStr);
  }, [treeSource, scaleMode, todayStr]);

  const activeHoverItem = useMemo(() => {
    return treeSource.find(it => it.id === hoveredId) ?? null;
  }, [treeSource, hoveredId]);

  const milestoneList = useMemo(() => {
    const isChainYarnPeriod = timeline.startTime >= new Date(2026, 6, 1).getTime();
    const pins = isChainYarnPeriod ? CHAIN_YARN_MILESTONE_PINS : DEFAULT_MILESTONE_PINS;
    return pins.filter(p => {
      const d = parseIsoDate(p.date);
      return d && d.getTime() >= timeline.startTime && d.getTime() <= timeline.endTime;
    });
  }, [timeline]);

  const containerMinWidth = useMemo(() => {
    return Math.max(1400, timeline.months.length * 210) + 'px';
  }, [timeline.months.length]);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
      {/* CHART HEADER & LEGEND */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{
            fontSize: '13.5px',
            fontWeight: 800,
            color: '#0f172a',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            margin: 0,
          }}>
            BIỂU ĐỒ GANTT TIMELINE TIẾN ĐỘ THỜI GIAN ({timeline.months[0]?.label ?? ''} ➔ {timeline.months[timeline.months.length - 1]?.label ?? ''})
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {showCompare
              ? 'Đang bật đối chiếu Ghost Bar: Thanh đặc trên là Tuần 37 hiện tại, thanh mờ sọc dưới là Tuần 36 (Baseline kỳ trước)'
              : `Chu kỳ dự án ${timeline.totalDays} ngày từ ngày bắt đầu (${timeline.months[0]?.label}) đến hoàn thành thương mại COD`}
          </p>
        </div>

        {/* LEGEND CHÚ GIẢI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '11.5px' }}>
          {showCompare ? (
            <>
              <div className="flex items-center gap-1">
                <span style={{ width: '22px', height: '12px', borderRadius: '3px', backgroundColor: '#0284c7' }} />
                <span style={{ color: '#0f172a', fontWeight: 700 }}>Kỳ này (W37)</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{
                  width: '22px',
                  height: '10px',
                  borderRadius: '2px',
                  background: 'repeating-linear-gradient(45deg, #94a3b8, #94a3b8 3px, #cbd5e1 3px, #cbd5e1 6px)',
                  border: '1px dashed #64748b',
                }} />
                <span style={{ color: '#475569', fontWeight: 700 }}>Kỳ trước (W36 Baseline)</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}>▲ +%</span>
                <span style={{ color: '#334155', fontWeight: 600 }}>Tăng trưởng</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, backgroundColor: '#fee2e2', color: '#b91c1c' }}>⏸ 0%</span>
                <span style={{ color: '#334155', fontWeight: 600 }}>Dậm chân / Nghẽn</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span style={{ width: '22px', height: '10px', borderRadius: '2px', backgroundColor: '#1e293b' }} />
                <span style={{ color: '#1e293b', fontWeight: 700 }}>Nhóm tổng hợp (WBS)</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
                <span style={{ color: '#334155', fontWeight: 600 }}>Hoàn thành (100%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }} />
                <span style={{ color: '#334155', fontWeight: 600 }}>Nghẽn tiến độ (BN)</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f59e0b' }} />
                <span style={{ color: '#334155', fontWeight: 600 }}>Chờ phụ thuộc</span>
              </div>
              <div className="flex items-center gap-1">
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }} />
                <span style={{ color: '#334155' }}>Chưa bắt đầu</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1">
            <span style={{ width: '14px', height: '3px', backgroundColor: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontWeight: 700 }}>Đường Hôm nay (22/09)</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🚩</span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>Mốc Hợp đồng CĐT</span>
          </div>
        </div>
      </div>

      {/* TIMELINE CANVAS CONTAINER (SCROLLABLE, STICKY LEFT COLUMN) */}
      <div style={{ overflowX: 'auto', backgroundColor: '#ffffff' }}>
        <div style={{ minWidth: containerMinWidth, display: 'flex', flexDirection: 'column' }}>
          
          {/* HEADER ROW 1: MONTHS & TIME SUBDIVISIONS */}
          <div style={{ display: 'flex', backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
            {/* STICKY Task Column Header */}
            <div style={{
              width: '360px',
              flexShrink: 0,
              position: 'sticky',
              left: 0,
              zIndex: 30,
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRight: '1px solid #cbd5e1',
              boxShadow: '3px 0 8px -2px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                HẠNG MỤC THI CÔNG & WBS
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {items.length} hạng mục
              </span>
            </div>

            {/* Timeline Axis Header */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* Tier 1: Months */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', height: '30px', alignItems: 'center' }}>
                {timeline.months.map(m => (
                  <div
                    key={m.key}
                    style={{
                      width: `${m.widthPct}%`,
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#1e293b',
                      borderRight: '1px solid #cbd5e1',
                      padding: '4px 0',
                      letterSpacing: '0.2px',
                    }}
                  >
                    {m.label} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>({m.daysCount} ngày)</span>
                  </div>
                ))}
              </div>

              {/* Tier 2: Subdivisions (10-day decades, Weeks, or 170-Day segments) */}
              <div style={{ display: 'flex', height: '34px', alignItems: 'center', backgroundColor: '#fafafa', position: 'relative' }}>
                {timeline.months.map(m => (
                  <div key={`sub-${m.key}`} style={{ width: `${m.widthPct}%`, display: 'flex', height: '100%', borderRight: '1px solid #cbd5e1' }}>
                    {m.subdivisions.map(sub => (
                      <div
                        key={sub.key}
                        style={{
                          width: `${(sub.daysCount / m.daysCount) * 100}%`,
                          textAlign: 'center',
                          color: sub.isCurrent ? '#b91c1c' : '#475569',
                          backgroundColor: sub.isCurrent ? '#fee2e2' : 'transparent',
                          borderRight: '1px solid #f1f5f9',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px 0',
                          lineHeight: 1.2,
                          transition: 'background-color 0.2s ease',
                        }}
                        title={`${sub.label}: ${sub.sublabel}${sub.isCurrent ? ' (Khoảng thời gian chứa Hôm nay 22/09)' : ''}`}
                      >
                        <span style={{ fontSize: '10.5px', fontWeight: sub.isCurrent ? 800 : 700 }}>{sub.label}</span>
                        {scaleMode === 'decade' && (
                          <span style={{ fontSize: '9px', opacity: sub.isCurrent ? 0.95 : 0.65, fontWeight: sub.isCurrent ? 700 : 400 }}>
                            {sub.sublabel}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DEDICATED SEPARATION BUFFER & TODAY POINTER STRIP (KHOẢNG CÁCH THOÁNG VỚI HEADER) */}
          <div style={{ display: 'flex', backgroundColor: '#ffffff', height: '26px', alignItems: 'center', position: 'relative', borderBottom: '1px solid #e2e8f0' }}>
            {/* Sticky Left Spacer */}
            <div style={{
              width: '360px',
              flexShrink: 0,
              position: 'sticky',
              left: 0,
              zIndex: 29,
              backgroundColor: '#ffffff',
              height: '100%',
              borderRight: '1px solid #cbd5e1',
              boxShadow: '3px 0 8px -2px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
            }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>⏱️</span> Trục thời gian đối chiếu
              </span>
            </div>

            {/* Timeline Track Buffer with Red Plumb Line & Centered Today Badge */}
            <div style={{ flex: 1, position: 'relative', height: '100%' }}>
              {/* Background grid line dividers in buffer */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                {timeline.months.map(m => (
                  <div key={`m-buf-${m.key}`} style={{ width: `${m.widthPct}%`, height: '100%', display: 'flex', borderRight: '1px solid #f1f5f9' }}>
                    {m.subdivisions.map(sub => (
                      <div key={`w-buf-${sub.key}`} style={{ width: `${(sub.daysCount / m.daysCount) * 100}%`, height: '100%', borderRight: '1px dashed #f8fafc' }} />
                    ))}
                  </div>
                ))}
              </div>

              {/* Red marker vertical guide line through buffer */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${timeline.todayLeftPct}%`,
                width: '2px',
                backgroundColor: '#ef4444',
                zIndex: 10,
                pointerEvents: 'none',
              }} />

              {/* Floating "📍 Hôm nay (22/09)" Flag in dedicated buffer zone (ZERO OVERLAP WITH DATES OR MILESTONES) */}
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: `${timeline.todayLeftPct}%`,
                  transform: 'translateX(-50%)',
                  zIndex: 25,
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 9px',
                  borderRadius: '9999px',
                  boxShadow: '0 2px 4px rgba(239,68,68,0.35)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title="Mốc thời gian đối chiếu hiện tại (22/09/2026)"
              >
                <span>📍</span>
                <span>Hôm nay (22/09)</span>
              </div>
            </div>
          </div>

          {/* DEDICATED CONTRACTUAL MILESTONE ROW (EPC DELIVERABLES ONLY - RỘNG RÃI, THOÁNG MẮT) */}
          <div style={{ display: 'flex', backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', height: '58px', alignItems: 'center' }}>
            {/* Sticky Milestone Row Title */}
            <div style={{
              width: '360px',
              flexShrink: 0,
              position: 'sticky',
              left: 0,
              zIndex: 28,
              backgroundColor: '#f8fafc',
              padding: '10px 16px',
              borderRight: '1px solid #cbd5e1',
              boxShadow: '3px 0 8px -2px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '2px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#0284c7',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                <span>🚩</span>
                <span>MỐC HỢP ĐỒNG CĐT (EPC)</span>
              </div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                {milestoneList.length} mốc nghiệm thu & giải ngân
              </span>
            </div>

            {/* Timeline Milestone Track */}
            <div style={{ flex: 1, position: 'relative', height: '100%' }}>
              {/* Background Month & Subdivision Grid dividers */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                {timeline.months.map(m => (
                  <div key={`m-grid-${m.key}`} style={{ width: `${m.widthPct}%`, height: '100%', display: 'flex', borderRight: '1px solid #e2e8f0' }}>
                    {m.subdivisions.map(sub => (
                      <div key={`w-grid-${sub.key}`} style={{ width: `${(sub.daysCount / m.daysCount) * 100}%`, height: '100%', borderRight: '1px dashed #f1f5f9' }} />
                    ))}
                  </div>
                ))}
              </div>

              {/* Red marker vertical guide line through milestone row */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${timeline.todayLeftPct}%`,
                width: '2px',
                backgroundColor: '#ef4444',
                zIndex: 5,
                pointerEvents: 'none',
              }} />

              {/* Milestone Pins (Staggered top/bottom so milestones never collide) */}
              {milestoneList.map(pin => {
                const s = parseIsoDate(pin.date);
                if (!s) return null;
                const offset = (s.getTime() - timeline.startTime) / (1000 * 60 * 60 * 24);
                const leftPct = Math.min(98, Math.max(0, (offset / timeline.totalDays) * 100));
                const isBottomTier = pin.tier === 'bottom';

                return (
                  <div
                    key={pin.id}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      top: isBottomTier ? '30px' : '6px',
                      transform: leftPct > 85 ? 'translateX(-80%)' : 'translateX(-30%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: pin.color,
                      backgroundColor: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      border: `1px solid ${pin.color}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      whiteSpace: 'nowrap',
                      zIndex: 15,
                    }}
                    title={`${pin.label}: ngày ${isoToDisplay(pin.date)}`}
                  >
                    <span>🚩</span>
                    <span>{pin.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIMELINE TASK ROWS */}
          <div style={{ position: 'relative' }}>
            {items.map((row, rowIdx) => {
              const bar = calculateItemBar(row, timeline.startTime, timeline.totalDays);
              const plan = ganttItemPlanPct(row);
              const delta = row.actualPct - plan;
              const isBottleneck = row.statusTone === 'danger' || (row.statusLabel?.includes('Nghẽn') && row.actualPct < 100);
              const isHovered = hoveredId === row.id;
              const isGroup = Boolean(row.isGroup);
              const isMilestone = row.days === 0;
              const isCollapsed = Boolean(collapsedIds?.has(row.id));
              const hasChildren = treeSource.some(it => it.parentId === row.id);
              const childCount = hasChildren ? countWbsDescendants(treeSource, row.id) : 0;
              const indentPx = (row.level ?? 0) * 16;

              const prevItem = prevSnapshot?.items.find(it => it.id === row.id || it.name.trim() === row.name.trim());
              const prevActual = prevItem ? prevItem.actualPct : 0;
              const weeklyDelta = row.actualPct - prevActual;

              let themeColor = '#0284c7';
              let themeBg = '#e0f2fe';
              let progressFill = '#0284c7';

              if (row.actualPct >= 100) {
                themeColor = '#16a34a';
                themeBg = '#dcfce7';
                progressFill = '#10b981';
              } else if (isBottleneck) {
                themeColor = '#dc2626';
                themeBg = '#fee2e2';
                progressFill = '#ef4444';
              } else if (row.statusTone === 'warn' || row.statusLabel?.includes('Chờ')) {
                themeColor = '#d97706';
                themeBg = '#fef3c7';
                progressFill = '#f59e0b';
              }

              // Non-colliding single status badge per row
              let statusBadge: { text: string; bg: string; color: string; border: string };
              if (row.actualPct >= 100) {
                statusBadge = {
                  text: '✓ Hoàn thành 100%',
                  bg: '#dcfce7',
                  color: '#15803d',
                  border: '#86efac',
                };
              } else if (isBottleneck) {
                statusBadge = {
                  text: `⚠️ ${row.statusLabel || 'Nghẽn'} (${formatSignedPct(delta)})`,
                  bg: '#fee2e2',
                  color: '#b91c1c',
                  border: '#fca5a5',
                };
              } else if (row.statusTone === 'warn' || row.statusLabel?.includes('Chờ')) {
                statusBadge = {
                  text: `⏳ ${row.statusLabel || 'Chờ phụ thuộc'}`,
                  bg: '#fef3c7',
                  color: '#b45309',
                  border: '#fde68a',
                };
              } else {
                statusBadge = {
                  text: row.statusLabel || 'Chưa bắt đầu',
                  bg: '#f1f5f9',
                  color: '#475569',
                  border: '#cbd5e1',
                };
              }

              return (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    height: showCompare ? '78px' : '64px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: row.level === 0
                      ? '#f8fafc'
                      : isHovered
                      ? '#f8fafc'
                      : isBottleneck
                      ? 'rgba(254, 242, 242, 0.45)'
                      : row.level === 1
                      ? '#fafbfc'
                      : rowIdx % 2 === 1
                      ? '#fafbfc'
                      : '#ffffff',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* STICKY Left Column: Task Info (Pinned when scrolling horizontally) */}
                  <div
                    onClick={() => onSelectRow?.(row)}
                    style={{
                      width: '360px',
                      flexShrink: 0,
                      position: 'sticky',
                      left: 0,
                      zIndex: 25,
                      backgroundColor: row.level === 0
                        ? '#f8fafc'
                        : isHovered
                        ? '#f8fafc'
                        : isBottleneck
                        ? '#fef2f2'
                        : row.level === 1
                        ? '#fafbfc'
                        : rowIdx % 2 === 1
                        ? '#fafbfc'
                        : '#ffffff',
                      padding: '8px 14px',
                      borderRight: '1px solid #cbd5e1',
                      boxShadow: '3px 0 8px -2px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Nhấn để chỉnh sửa chi tiết"
                  >
                    {/* Line 1: Chevron + WBS Code + Task Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: `${indentPx}px` }}>
                      {/* Chevron Toggle Button for Groups */}
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCollapse?.(row.id);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#0284c7',
                            cursor: 'pointer',
                            padding: 0,
                            flexShrink: 0,
                          }}
                          title={isCollapsed ? 'Nhấn để mở nhóm con' : 'Nhấn để thu gọn nhóm con'}
                        >
                          {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        </button>
                      ) : (
                        <span style={{ width: '20px', display: 'inline-flex', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', flexShrink: 0 }}>
                          {isMilestone ? '🚩' : '•'}
                        </span>
                      )}

                      {/* WBS Code */}
                      {row.wbs && (
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          backgroundColor: row.level === 0 ? '#0284c7' : row.level === 1 ? '#e0f2fe' : '#f1f5f9',
                          color: row.level === 0 ? '#ffffff' : row.level === 1 ? '#0369a1' : '#475569',
                          flexShrink: 0,
                        }}>
                          {row.wbs}
                        </span>
                      )}

                      {/* Task Name */}
                      <span style={{
                        fontSize: row.level === 0 ? '13px' : row.level === 1 ? '12.5px' : '12px',
                        fontWeight: row.level === 0 ? 800 : row.level === 1 ? 700 : row.level === 2 ? 600 : 500,
                        color: row.level === 0
                          ? '#0369a1'
                          : isBottleneck
                          ? '#b91c1c'
                          : row.level === 1
                          ? '#0f172a'
                          : '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                      }}>
                        {row.name}
                      </span>

                      {/* Child count tag if collapsed */}
                      {isCollapsed && childCount > 0 && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '9999px',
                          backgroundColor: '#e0f2fe',
                          color: '#0284c7',
                          flexShrink: 0,
                        }}>
                          +{childCount}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Department & Days & Progress */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px',
                      paddingLeft: `${indentPx + 26}px`,
                      flexWrap: 'wrap',
                    }}>
                      <span style={{
                        fontSize: '10.5px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: isBottleneck ? '#fee2e2' : '#f1f5f9',
                        color: isBottleneck ? '#b91c1c' : '#475569',
                        fontWeight: 600,
                      }}>
                        {row.department || '-'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {row.days > 0 ? `${row.days} ngày` : 'Mốc COD'}
                      </span>
                      {showCompare ? (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: row.actualPct >= 100 ? '#16a34a' : weeklyDelta > 0 ? '#16a34a' : isBottleneck ? '#dc2626' : '#475569',
                        }}>
                          W37: {row.actualPct}% vs W36: {prevActual}% ({weeklyDelta > 0 ? `+${weeklyDelta}%` : `${weeklyDelta}%`})
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: row.actualPct >= 100 ? '#16a34a' : isBottleneck ? '#dc2626' : row.level === 0 ? '#f59e0b' : '#0284c7',
                        }}>
                          TT: {row.actualPct}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Timeline Track */}
                  <div
                    style={{
                      flex: 1,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={() => setHoveredId(row.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Background Vertical Grid Lines for Subdivisions */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                      {timeline.months.map(m => (
                        <div key={`m-trk-${m.key}`} style={{ width: `${m.widthPct}%`, height: '100%', display: 'flex', borderRight: '1px solid #e2e8f0' }}>
                          {m.subdivisions.map(sub => (
                            <div key={`w-trk-${sub.key}`} style={{ width: `${(sub.daysCount / m.daysCount) * 100}%`, height: '100%', borderRight: '1px dashed #f1f5f9' }} />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Shaded elapsed days area */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${timeline.todayLeftPct}%`,
                      backgroundColor: 'rgba(241, 245, 249, 0.45)',
                      pointerEvents: 'none',
                    }} />

                    {/* Continuous Red "Hôm nay" Marker Line */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${timeline.todayLeftPct}%`,
                      width: '2px',
                      backgroundColor: '#ef4444',
                      zIndex: 8,
                      pointerEvents: 'none',
                    }} />

                    {/* GANTT BAR: GROUP SUMMARY BRACKET BAR vs MILESTONE vs STANDARD TASK BAR */}
                    {isGroup ? (
                      /* MS Project Style Executive Summary Bracket Bar */
                      <div
                        onClick={() => onSelectRow?.(row)}
                        style={{
                          position: 'absolute',
                          left: `${bar.leftPct}%`,
                          width: `${bar.widthPct}%`,
                          height: row.level === 0 ? '16px' : '13px',
                          top: row.level === 0 ? '24px' : '26px',
                          backgroundColor: row.level === 0 ? '#0f172a' : row.level === 1 ? '#1e293b' : '#334155',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          zIndex: isHovered ? 7 : 4,
                        }}
                        title={`Nhóm tổng hợp ${row.name}: ${row.actualPct}% tiến độ (${isoToDisplay(row.startDate)} ➔ ${isoToDisplay(row.endDate)})`}
                      >
                        {/* Left Downward Bracket Hanger */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          bottom: '-6px',
                          width: 0,
                          height: 0,
                          borderTop: `6px solid ${row.level === 0 ? '#0f172a' : row.level === 1 ? '#1e293b' : '#334155'}`,
                          borderRight: '6px solid transparent',
                        }} />

                        {/* Right Downward Bracket Hanger */}
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          bottom: '-6px',
                          width: 0,
                          height: 0,
                          borderTop: `6px solid ${row.level === 0 ? '#0f172a' : row.level === 1 ? '#1e293b' : '#334155'}`,
                          borderLeft: '6px solid transparent',
                        }} />

                        {/* Progress Fill inside Group Bar */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${Math.min(100, Math.max(0, row.actualPct))}%`,
                            backgroundColor: row.level === 0 ? '#fbbf24' : '#38bdf8',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease',
                          }}
                        />

                        {/* Label Inside Group Bar */}
                        <span style={{
                          position: 'relative',
                          zIndex: 3,
                          paddingLeft: '6px',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          color: '#ffffff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                          whiteSpace: 'nowrap',
                        }}>
                          {row.actualPct}%
                        </span>
                      </div>
                    ) : isMilestone ? (
                      /* Milestone Diamond (e.g. COD 20/03/2027) */
                      <div
                        onClick={() => onSelectRow?.(row)}
                        style={{
                          position: 'absolute',
                          left: `${bar.leftPct}%`,
                          top: '22px',
                          width: '18px',
                          height: '18px',
                          backgroundColor: '#16a34a',
                          border: '2px solid #ffffff',
                          borderRadius: '3px',
                          transform: 'translateX(-50%) rotate(45deg)',
                          boxShadow: '0 2px 5px rgba(22,163,74,0.4)',
                          cursor: 'pointer',
                          zIndex: 10,
                        }}
                        title={`Mốc hoàn thành ${row.name}: ${isoToDisplay(row.endDate)}`}
                      />
                    ) : (
                      <>
                        {/* Gantt Bar 1: Current Week (W37) */}
                        <div
                          onClick={() => onSelectRow?.(row)}
                          style={{
                            position: 'absolute',
                            left: `${bar.leftPct}%`,
                            width: `${bar.widthPct}%`,
                            height: showCompare ? '24px' : '32px',
                            top: showCompare ? '14px' : '16px',
                            borderRadius: '6px',
                            backgroundColor: themeBg,
                            border: `1.5px solid ${themeColor}`,
                            boxShadow: isHovered ? '0 3px 8px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                            transform: isHovered ? 'translateY(-1px)' : 'none',
                            zIndex: isHovered ? 7 : 3,
                          }}
                          title={`${row.name}: ${row.actualPct}% đạt được (${isoToDisplay(row.startDate)} ➔ ${isoToDisplay(row.endDate)})`}
                        >
                          {/* Actual Progress Fill */}
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${Math.min(100, Math.max(0, row.actualPct))}%`,
                              backgroundColor: progressFill,
                              transition: 'width 0.3s ease',
                            }}
                          />

                          {/* Bar Label (Inside) */}
                          {row.actualPct > 0 && (
                            <span style={{
                              position: 'relative',
                              zIndex: 3,
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              fontSize: showCompare ? '10px' : '11px',
                              fontWeight: 800,
                              color: row.actualPct > 35 ? '#ffffff' : themeColor,
                              textShadow: row.actualPct > 35 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                              whiteSpace: 'nowrap',
                            }}>
                              {showCompare ? `W37: ${row.actualPct}%` : `${row.actualPct}%`}
                            </span>
                          )}
                        </div>

                        {/* Gantt Bar 2: Ghost Bar Baseline (Tuần 36 - W36) - KHI BẬT ĐỐI SOÁT */}
                        {showCompare && (
                          <div
                            onClick={() => onSelectRow?.(row)}
                            style={{
                              position: 'absolute',
                              left: `${bar.leftPct}%`,
                              width: `${bar.widthPct}%`,
                              height: '18px',
                              top: '43px',
                              borderRadius: '4px',
                              backgroundColor: '#f8fafc',
                              border: '1.5px dashed #94a3b8',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              zIndex: 2,
                            }}
                            title={`Thanh mờ đối chiếu Baseline Tuần 36 (W36): ${prevActual}% tiến độ`}
                          >
                            {/* W36 Ghost Progress Fill */}
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${Math.min(100, Math.max(0, prevActual))}%`,
                                background: 'repeating-linear-gradient(45deg, #94a3b8, #94a3b8 4px, #cbd5e1 4px, #cbd5e1 8px)',
                                opacity: 0.85,
                              }}
                            />

                            {/* W36 Text Inside */}
                            <span style={{
                              position: 'relative',
                              zIndex: 3,
                              paddingLeft: '6px',
                              paddingRight: '6px',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              color: prevActual > 35 ? '#ffffff' : '#475569',
                              textShadow: prevActual > 35 ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                              whiteSpace: 'nowrap',
                            }}>
                              W36: {prevActual}%
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Single Distinct Status Badge Next to Bar (NO DUPLICATION & NO OVERLAP) */}
                    <div style={{
                      position: 'absolute',
                      left: `calc(${bar.leftPct + bar.widthPct}% + 12px)`,
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}>
                      {isGroup ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: row.level === 0 ? '#fef3c7' : '#f1f5f9',
                          color: row.level === 0 ? '#92400e' : '#334155',
                          border: `1px solid ${row.level === 0 ? '#fde68a' : '#cbd5e1'}`,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                          {row.level === 0 ? '👑 Dự án 170 ngày' : `📁 Nhóm ${row.wbs ?? ''}`} ({row.days} ngày · {row.actualPct}%)
                        </span>
                      ) : isMilestone ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #86efac',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                          🚩 Mốc COD: {isoToDisplay(row.endDate)}
                        </span>
                      ) : showCompare ? (
                        row.actualPct >= 100 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}>
                            ✓ Hoàn thành 100%
                          </span>
                        ) : weeklyDelta > 0 ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}>
                            ▲ +{weeklyDelta}% Tuần này
                          </span>
                        ) : isBottleneck ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}>
                            ⏸ 0% Dậm chân ({row.statusLabel || 'Nghẽn'})
                          </span>
                        ) : row.statusTone === 'warn' || row.statusLabel?.includes('Chờ') ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}>
                            ⏳ 0% ({row.statusLabel || 'Chờ phụ thuộc'})
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #cbd5e1',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}>
                            {statusBadge.text}
                          </span>
                        )
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.color,
                          border: `1px solid ${statusBadge.border}`,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                          {statusBadge.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER TOOLTIP / ACTIVE SELECTION DETAIL */}
      {activeHoverItem ? (
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div>
            <strong style={{ color: '#0f172a' }}>🔎 Đang chọn: {activeHoverItem.name}</strong>
            <span style={{ color: '#475569', marginLeft: '10px' }}>
              Bộ phận: <strong>{activeHoverItem.department || '-'}</strong> · Thời gian: <strong>{isoToDisplay(activeHoverItem.startDate)} ➔ {isoToDisplay(activeHoverItem.endDate)} ({activeHoverItem.days} ngày)</strong>
            </span>
          </div>
          <div>
            {showCompare && prevSnapshot && (
              <>
                <span>W36: <strong style={{ color: '#64748b' }}>{prevSnapshot.items.find(i => i.id === activeHoverItem.id || i.name.trim() === activeHoverItem.name.trim())?.actualPct ?? 0}%</strong></span>
                <span style={{ margin: '0 6px' }}>➔</span>
              </>
            )}
            <span>W37 Thực tế: <strong style={{ color: activeHoverItem.actualPct >= 100 ? '#16a34a' : '#dc2626' }}>{activeHoverItem.actualPct}%</strong></span>
            {showCompare && (
              <span style={{
                marginLeft: '6px',
                fontWeight: 700,
                color: (activeHoverItem.actualPct - (prevSnapshot?.items.find(i => i.id === activeHoverItem.id || i.name.trim() === activeHoverItem.name.trim())?.actualPct ?? 0)) > 0 ? '#16a34a' : '#dc2626',
              }}>
                (Δ {formatSignedPct(activeHoverItem.actualPct - (prevSnapshot?.items.find(i => i.id === activeHoverItem.id || i.name.trim() === activeHoverItem.name.trim())?.actualPct ?? 0))})
              </span>
            )}
            <span style={{ margin: '0 8px' }}>|</span>
            <span>Kế hoạch: <strong>{ganttItemPlanPct(activeHoverItem)}%</strong></span>
            {activeHoverItem.notes && (
              <span style={{ color: '#b91c1c', marginLeft: '10px', fontStyle: 'italic' }}>
                ({activeHoverItem.notes})
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '10px 20px',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #f1f5f9',
          fontSize: '11.5px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>💡 Cột hạng mục bên trái được ghim cố định (Sticky) khi cuộn ngang · Sử dụng nút "Thước đo" để chuyển đổi hiển thị 10 ngày / Tuần W / 170 Ngày</span>
          <span>Tổng chu kỳ Kick-off: <strong>170 ngày</strong></span>
        </div>
      )}
    </div>
  );
}
