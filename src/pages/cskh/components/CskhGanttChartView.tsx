import { useMemo, useState } from 'react';
import { isoToDisplay, parseIsoDate, toIsoDate } from '../../../lib/dates';
import { formatSignedPct } from '../../../lib/cskh/commandCenter';
import { ganttItemPlanPct, type CskhGanttItem } from '../../../lib/cskh/opsWorkspace';
import {
  buildTimelineStructure,
  calculateItemBar,
  type TimeScaleMode,
} from '../../../lib/cskh/ganttUtils';

export interface GanttMilestonePin {
  id: string;
  label: string;
  date: string;
  color: string;
  tier: 'top' | 'bottom';
}

interface CskhGanttChartViewProps {
  items: CskhGanttItem[];
  onSelectRow?: (item: CskhGanttItem) => void;
  scaleMode?: TimeScaleMode;
  todayStr?: string;
  milestonePins?: GanttMilestonePin[];
}

export default function CskhGanttChartView({
  items,
  onSelectRow,
  scaleMode = 'decade',
  todayStr,
  milestonePins = [],
}: CskhGanttChartViewProps) {
  const currentTodayStr = todayStr || toIsoDate(new Date());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const timeline = useMemo(
    () => buildTimelineStructure(items, scaleMode, currentTodayStr),
    [items, scaleMode, currentTodayStr],
  );

  const activeHoverItem = useMemo(
    () => items.find(it => it.id === hoveredId) ?? null,
    [items, hoveredId],
  );

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden',
    }}>
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
            BIỂU ĐỒ GANTT TIMELINE TIẾN ĐỘ THỜI GIAN
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            Trục thời gian tiến độ thi công dự án EPC
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '11.5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
            <span style={{ color: '#334155', fontWeight: 600 }}>Hoàn thành (100%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }} />
            <span style={{ color: '#334155', fontWeight: 600 }}>Nghẽn tiến độ (BN)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f59e0b' }} />
            <span style={{ color: '#334155', fontWeight: 600 }}>Chờ phụ thuộc</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1' }} />
            <span style={{ color: '#334155' }}>Chưa bắt đầu</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '14px', height: '3px', backgroundColor: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontWeight: 700 }}>Đường Hôm nay ({isoToDisplay(currentTodayStr)})</span>
          </div>
          {milestonePins.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🚩</span>
              <span style={{ color: '#0284c7', fontWeight: 700 }}>Mốc Hợp đồng CĐT</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: '#ffffff' }}>
        <div style={{ minWidth: `${Math.max(1600, 320 + timeline.months.length * 240)}px`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
            <div style={{
              width: '320px',
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
                HẠNG MỤC THI CÔNG & BỘ PHẬN
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {items.length} hạng mục
              </span>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
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
                      padding: '4px 4px',
                      letterSpacing: '0.2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.label} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>({m.daysCount} ngày)</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', height: '26px', alignItems: 'center', backgroundColor: '#fafafa', position: 'relative' }}>
                {timeline.months.map(m => (
                  <div key={`sub-${m.key}`} style={{ width: `${m.widthPct}%`, display: 'flex', height: '100%', borderRight: '1px solid #cbd5e1' }}>
                    {m.subdivisions.map(sub => (
                      <div
                        key={sub.key}
                        style={{
                          width: `${(sub.daysCount / m.daysCount) * 100}%`,
                          textAlign: 'center',
                          fontSize: '10.5px',
                          color: '#475569',
                          borderRight: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          padding: '0 2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={`${sub.label}: ${sub.sublabel}`}
                      >
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>{sub.label}</span>
                        {scaleMode === 'decade' && (
                          <span style={{ fontSize: '9px', opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            ({sub.sublabel})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

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
                    boxShadow: '0 2px 4px rgba(239,68,68,0.3)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                  title="Mốc thời gian đối chiếu hiện tại"
                >
                  <span>📍</span>
                  <span>Hôm nay ({isoToDisplay(currentTodayStr)})</span>
                </div>
              </div>
            </div>
          </div>

          {milestonePins.length > 0 && (
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', height: '42px', alignItems: 'center' }}>
              <div style={{
                width: '320px',
                flexShrink: 0,
                position: 'sticky',
                left: 0,
                zIndex: 28,
                backgroundColor: '#f1f5f9',
                padding: '8px 16px',
                borderRight: '1px solid #cbd5e1',
                boxShadow: '3px 0 8px -2px rgba(0,0,0,0.06)',
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

              <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                  {timeline.months.map(m => (
                    <div key={`m-grid-${m.key}`} style={{ width: `${m.widthPct}%`, height: '100%', display: 'flex', borderRight: '1px solid #e2e8f0' }}>
                      {m.subdivisions.map(sub => (
                        <div key={`w-grid-${sub.key}`} style={{ width: `${(sub.daysCount / m.daysCount) * 100}%`, height: '100%', borderRight: '1px dashed #f1f5f9' }} />
                      ))}
                    </div>
                  ))}
                </div>

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

                {milestonePins.map(pin => {
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
                        top: isBottomTier ? '21px' : '4px',
                        transform: leftPct > 85 ? 'translateX(-80%)' : 'translateX(-30%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: pin.color,
                        backgroundColor: '#ffffff',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: `1px solid ${pin.color}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
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
          )}

          <div style={{ position: 'relative' }}>
            {items.map((row, rowIdx) => {
              const bar = calculateItemBar(row, timeline.startTime, timeline.totalDays);
              const plan = ganttItemPlanPct(row);
              const delta = row.actualPct - plan;
              const isBottleneck = row.statusTone === 'danger' || (row.statusLabel?.includes('Nghẽn') && row.actualPct < 100);
              const isHovered = hoveredId === row.id;

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

              let statusBadge: { text: string; bg: string; color: string; border: string };
              if (row.actualPct >= 100) {
                statusBadge = { text: '✓ Hoàn thành 100%', bg: '#dcfce7', color: '#15803d', border: '#86efac' };
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
                    height: '64px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: isHovered
                      ? '#f8fafc'
                      : isBottleneck
                        ? 'rgba(254, 242, 242, 0.45)'
                        : rowIdx % 2 === 1
                          ? '#fafbfc'
                          : '#ffffff',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div
                    onClick={() => onSelectRow?.(row)}
                    style={{
                      width: '320px',
                      flexShrink: 0,
                      position: 'sticky',
                      left: 0,
                      zIndex: 25,
                      backgroundColor: isHovered
                        ? '#f8fafc'
                        : isBottleneck
                          ? '#fef2f2'
                          : rowIdx % 2 === 1
                            ? '#fafbfc'
                            : '#ffffff',
                      padding: '10px 16px',
                      borderRight: '1px solid #cbd5e1',
                      boxShadow: '3px 0 8px -2px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      cursor: onSelectRow ? 'pointer' : 'default',
                    }}
                    title="Nhấn để chỉnh sửa chi tiết"
                  >
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isBottleneck ? '#b91c1c' : '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {row.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '10.5px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isBottleneck ? '#fee2e2' : '#f1f5f9',
                        color: isBottleneck ? '#b91c1c' : '#475569',
                        fontWeight: 600,
                      }}>
                        {row.department || '-'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {row.days} ngày ({isoToDisplay(row.startDate)} ➔ {isoToDisplay(row.endDate)})
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: row.actualPct >= 100 ? '#16a34a' : isBottleneck ? '#dc2626' : '#0284c7',
                      }}>
                        TT: {row.actualPct}%
                      </span>
                    </div>
                  </div>

                  <div
                    style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={() => setHoveredId(row.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                      {timeline.months.map(m => (
                        <div key={`m-trk-${m.key}`} style={{ width: `${m.widthPct}%`, height: '100%', display: 'flex', borderRight: '1px solid #e2e8f0' }}>
                          {m.subdivisions.map(sub => (
                            <div key={`w-trk-${sub.key}`} style={{ width: `${(sub.daysCount / m.daysCount) * 100}%`, height: '100%', borderRight: '1px dashed #f1f5f9' }} />
                          ))}
                        </div>
                      ))}
                    </div>

                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${timeline.todayLeftPct}%`,
                      backgroundColor: 'rgba(241, 245, 249, 0.45)',
                      pointerEvents: 'none',
                    }} />

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

                    <div
                      onClick={() => onSelectRow?.(row)}
                      style={{
                        position: 'absolute',
                        left: `${bar.leftPct}%`,
                        width: `${bar.widthPct}%`,
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: themeBg,
                        border: `1.5px solid ${themeColor}`,
                        boxShadow: isHovered ? '0 3px 8px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                        cursor: onSelectRow ? 'pointer' : 'default',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                        transform: isHovered ? 'translateY(-1px)' : 'none',
                        zIndex: isHovered ? 7 : 2,
                      }}
                      title={`${row.name}: ${row.actualPct}% đạt được (${isoToDisplay(row.startDate)} ➔ ${isoToDisplay(row.endDate)})`}
                    >
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

                      {row.actualPct > 0 && (
                        <span style={{
                          position: 'relative',
                          zIndex: 3,
                          paddingLeft: '8px',
                          paddingRight: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: row.actualPct > 35 ? '#ffffff' : themeColor,
                          textShadow: row.actualPct > 35 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                          whiteSpace: 'nowrap',
                        }}>
                          {row.actualPct}%
                        </span>
                      )}
                    </div>

                    <div style={{
                      position: 'absolute',
                      left: `calc(${bar.leftPct + bar.widthPct}% + 12px)`,
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}>
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
              Bộ phận: <strong>{activeHoverItem.department || '-'}</strong> · Thời gian:{' '}
              <strong>
                {isoToDisplay(activeHoverItem.startDate)} ➔ {isoToDisplay(activeHoverItem.endDate)} ({activeHoverItem.days} ngày)
              </strong>
            </span>
          </div>
          <div>
            <span>Kế hoạch: <strong>{ganttItemPlanPct(activeHoverItem)}%</strong></span>
            <span style={{ margin: '0 8px' }}>|</span>
            <span>
              Thực tế:{' '}
              <strong style={{ color: activeHoverItem.actualPct >= 100 ? '#16a34a' : '#dc2626' }}>
                {activeHoverItem.actualPct}%
              </strong>
            </span>
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
          <span>
            💡 Cột hạng mục bên trái được ghim cố định (Sticky) khi cuộn ngang · Sử dụng nút "Thước đo" để chuyển đổi hiển thị 10 ngày / Tuần W / 170 Ngày
          </span>
          <span>Tổng hạng mục: <strong>{items.length}</strong></span>
        </div>
      )}
    </div>
  );
}
